require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

// Set FFmpeg path to the bundled static binary
console.log('FFmpeg static path:', ffmpegStatic);
ffmpeg.setFfmpegPath(ffmpegStatic);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Helper function to sanitize filename
const sanitizeFilename = (filename) => {
  return filename.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim();
};

// Get video information endpoint
app.post('/api/video-info', async (req, res) => {
  const { url } = req.body;
  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;
    
    res.json({
      title: videoDetails.title,
      thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url,
      duration: videoDetails.lengthSeconds,
      author: videoDetails.author.name,
      viewCount: videoDetails.viewCount
    });
  } catch (error) {
    console.error('Error fetching video info:', error);
    res.status(500).json({ error: 'Failed to fetch video information.' });
  }
});

app.post('/api/download-audio', async (req, res) => {
  const { url } = req.body;
  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const info = await ytdl.getInfo(url);
    const title = sanitizeFilename(info.videoDetails.title);
    
    res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    const stream = ytdl(url, { quality: 'highestaudio' });

    ffmpeg(stream)
      .audioBitrate(128)
      .toFormat('mp3')
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error during audio conversion.' });
        }
      })
      .on('end', () => {
        console.log('Audio conversion completed');
      })
      .pipe(res, { end: true });

  } catch (error) {
    console.error('Error fetching video info for audio:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process video for audio download.' });
    }
  }
});

app.post('/api/download-video', async (req, res) => {
  const { url } = req.body;
  if (!url || !ytdl.validateURL(url)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  try {
    const info = await ytdl.getInfo(url);
    const title = sanitizeFilename(info.videoDetails.title);
    
    res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    ytdl(url, { quality: 'highest' }).pipe(res);

  } catch (error) {
    console.error('Error fetching video info for video:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to process video for video download.' });
    }
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
