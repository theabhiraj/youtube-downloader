import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadProgress, setDownloadProgress] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const getYouTubeId = (youtubeUrl) => {
    let id = '';
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/;

    if (!youtubeUrl || !youtubeRegex.test(youtubeUrl)) {
      return ''; // Return empty if not a valid YouTube URL format
    }

    try {
      const urlObj = new URL(youtubeUrl);
      if (urlObj.hostname === 'youtu.be') {
        id = urlObj.pathname.slice(1);
      } else if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
        id = urlObj.searchParams.get('v');
      }
    } catch (e) {
      console.error('Error parsing URL in getYouTubeId:', e);
      return '';
    }
    return id;
  };

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    setVideoInfo(null);
    setError('');
    setSuccessMessage('');
    setDownloadProgress({});
  };

  const fetchVideoInfo = async () => {
    if (!url) return;
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const videoId = getYouTubeId(url);
      if (!videoId) {
        setError('Invalid YouTube URL. Please check the link.');
        setIsLoading(false);
        return;
      }

      // Fetch actual video info from backend
      const response = await axios.post(`${API_URL}/api/video-info`, { url });

      setVideoInfo({
        title: response.data.title,
        thumbnail: response.data.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        videoId: videoId,
        author: response.data.author,
        duration: response.data.duration
      });
      setSuccessMessage('Video information loaded successfully!');
    } catch (e) {
      setError('Failed to fetch video information. Please check the URL and try again.');
      console.error('Video info fetch error:', e);
    }
    setIsLoading(false);
  };

  const simulateProgress = (format, onProgress) => {
    let progress = 0;
    const interval = setInterval(() => {
      // Slower, more realistic progress for conversion
      progress += Math.random() * 8 + 2; // 2-10% increments
      if (progress >= 95) {
        progress = 95; // Stop at 95% to show conversion is happening
        clearInterval(interval);
      }
      onProgress(Math.round(progress));
    }, 500); // Slower updates
    return interval;
  };

  const handleDownload = async (format) => {
    if (!url) return;
    setError('');
    setSuccessMessage('');

    const progressKey = format;
    setDownloadProgress(prev => ({ ...prev, [progressKey]: 0 }));

    // Start with processing phase
    setDownloadProgress(prev => ({ ...prev, [progressKey]: 5 }));

    try {
      // Show initial processing
      setDownloadProgress(prev => ({ ...prev, [progressKey]: 10 }));

      const response = await axios.post(
        `${API_URL}/api/download-${format}`,
        { url },
        {
          responseType: 'blob',
          timeout: 300000, // 5 minute timeout
          onDownloadProgress: (progressEvent) => {
            if (progressEvent.lengthComputable) {
              // This tracks the download of the converted file
              const downloadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              // Map to 90-100% range (conversion is 10-90%, download is 90-100%)
              const adjustedProgress = 90 + (downloadProgress * 0.1);
              setDownloadProgress(prev => ({ ...prev, [progressKey]: Math.round(adjustedProgress) }));
            }
          }
        }
      );

      // Show conversion progress simulation
      let conversionProgress = 10;
      const conversionInterval = setInterval(() => {
        conversionProgress += Math.random() * 5 + 2;
        if (conversionProgress >= 85) {
          conversionProgress = 85;
          clearInterval(conversionInterval);
        }
        setDownloadProgress(prev => ({ ...prev, [progressKey]: Math.round(conversionProgress) }));
      }, 300);

      // Wait for response and clear conversion simulation
      setTimeout(() => clearInterval(conversionInterval), 100);

      // Extract filename from response headers
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${videoInfo?.title || 'download'}.${format === 'audio' ? 'mp3' : 'mp4'}`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Final download phase
      setDownloadProgress(prev => ({ ...prev, [progressKey]: 95 }));

      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      // Complete
      setDownloadProgress(prev => ({ ...prev, [progressKey]: 100 }));
      setSuccessMessage(`${format === 'audio' ? 'Audio' : 'Video'} "${filename}" downloaded successfully!`);

      // Clear progress after a delay
      setTimeout(() => {
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[progressKey];
          return newProgress;
        });
      }, 4000);

    } catch (err) {
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[progressKey];
        return newProgress;
      });

      if (err.code === 'ECONNABORTED') {
        setError(`Download timeout. The ${format} file might be too large or the conversion is taking too long.`);
      } else {
        setError(`Failed to download ${format}. Please try again.`);
      }
      console.error(`Download error for ${format}:`, err);
    }
  };

  const isDownloading = Object.keys(downloadProgress).length > 0;

  return (
    <div className="App">
      <div className="container">
        <h1 className="title">YouTube Downloader</h1>
        <p className="subtitle">Download your favorite YouTube videos and audio with ease</p>

        <div className="input-section">
          <input
            type="text"
            className="url-input"
            placeholder="Paste YouTube URL here (e.g., https://youtube.com/watch?v=...)"
            value={url}
            onChange={handleUrlChange}
            onKeyPress={(e) => e.key === 'Enter' && fetchVideoInfo()}
          />
          <button
            className="primary-button"
            onClick={fetchVideoInfo}
            disabled={!url || isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Loading...
              </>
            ) : (
              'Get Video Info'
            )}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            <strong>Success:</strong> {successMessage}
          </div>
        )}

        {videoInfo && (
          <div className="video-preview">
            <img
              src={videoInfo.thumbnail}
              alt="Video Thumbnail"
              className="video-thumbnail"
              onError={(e) => {
                e.target.src = `https://img.youtube.com/vi/${videoInfo.videoId}/hqdefault.jpg`;
              }}
            />
            <h3 className="video-title">{videoInfo.title}</h3>
            {videoInfo.author && (
              <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '1rem' }}>
                by {videoInfo.author}
              </p>
            )}

            {/* Progress bars for active downloads */}
            {Object.entries(downloadProgress).map(([format, progress]) => {
              let statusText = 'Preparing...';
              if (progress >= 10 && progress < 85) {
                statusText = `Converting ${format === 'audio' ? 'to MP3' : 'to MP4'}...`;
              } else if (progress >= 85 && progress < 100) {
                statusText = 'Finalizing download...';
              } else if (progress === 100) {
                statusText = 'Complete!';
              }

              return (
                <div key={format} className="progress-container">
                  <div className="progress-text">
                    <span>{statusText}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}

            <div className="download-buttons">
              <button
                className="secondary-button"
                onClick={() => handleDownload('audio')}
                disabled={isDownloading}
              >
                {downloadProgress.audio !== undefined ? (
                  <>
                    <span className="loading-spinner"></span>
                    Downloading...
                  </>
                ) : (
                  '🎵 Download MP3'
                )}
              </button>
              <button
                className="secondary-button"
                onClick={() => handleDownload('video')}
                disabled={isDownloading}
              >
                {downloadProgress.video !== undefined ? (
                  <>
                    <span className="loading-spinner"></span>
                    Downloading...
                  </>
                ) : (
                  '🎬 Download MP4'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
