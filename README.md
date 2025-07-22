# YouTube Downloader

A modern, responsive web application for downloading YouTube videos and audio files.

## Features

- 🎵 Download audio as MP3
- 🎬 Download video as MP4
- 📱 Mobile-friendly responsive design
- 📊 Real-time download progress tracking
- 🎨 Modern, clean UI
- ⚡ Fast processing with FFmpeg

## Tech Stack

- **Frontend**: React, Axios, Modern CSS
- **Backend**: Node.js, Express, ytdl-core, FFmpeg
- **Styling**: Custom CSS with gradient design

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/youtube-downloader.git
cd youtube-downloader
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

## Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```
The backend will run on `http://localhost:3001`

2. Start the frontend (in a new terminal):
```bash
cd frontend
npm start
```
The frontend will run on `http://localhost:3000`

## Usage

1. Open your browser and go to `http://localhost:3000`
2. Paste a YouTube URL in the input field
3. Click "Get Video Info" to load video details
4. Choose to download either MP3 (audio) or MP4 (video)
5. Watch the progress bar and wait for the download to complete

## API Endpoints

- `POST /api/video-info` - Get video information
- `POST /api/download-audio` - Download audio as MP3
- `POST /api/download-video` - Download video as MP4

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is for educational purposes only. Please respect YouTube's Terms of Service.
