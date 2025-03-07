# Video Venture

Video Venture is an AI-powered video generation pipeline that transforms text descriptions into fully produced videos with voiceovers, background music, and seamless transitions.

## Features

- 🎬 AI Video Generation using Amazon Bedrock (Nova Reel)
- 🗣️ Professional voiceovers using ElevenLabs
- 🎵 AI-generated background music using Beatoven.ai
- 📝 AI-driven storyboard generation with GPT-4
- 🔄 Distributed job processing with BullMQ
- 📊 Job monitoring dashboard
- ☁️ Cloud storage with AWS S3
- 🔥 Firebase integration for data persistence

## Architecture

The system consists of three main services:

1. **API Service**: Handles incoming requests and job management
2. **Worker Service**: Processes video generation jobs
3. **Bull Board**: Provides a dashboard for monitoring job queues

### Tech Stack

- Node.js & TypeScript
- Redis for job queues
- Docker for containerization
- FFmpeg for video processing
- AWS Services (S3, Bedrock)
- Firebase Admin SDK
- Hono.js for API framework

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- FFmpeg
- Redis
- AWS Account with S3 and Bedrock access
- Firebase project with service account
- API keys for:
  - ElevenLabs
  - Beatoven.ai
  - OpenAI (GPT-4)

## Environment Variables

Create a `.env` file with the following variables:

```env
# AWS Configuration
AWS_REGION=your-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name

# API Keys
ELEVENLABS_API_KEY=your-elevenlabs-key
OPENAI_API_KEY=your-openai-key
BEATOVEN_API_KEY=your-beatoven-key

# Service Configuration
WORKER_CONCURRENCY=1
```

## Installation & Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/video-venture.git
cd video-venture
```

2. Install dependencies for all services:

```bash
cd api && npm install
cd ../worker && npm install
cd ../bull-board && npm install
```

3. Place your Firebase service account JSON file in the root directory as `service-account.json`

4. Start the services using Docker Compose:

```bash
docker compose up --build
```

## API Endpoints

### Create Video

```http
POST /api/videos
Content-Type: application/json

{
  "storyIdea": "Your video story concept",
  "maxScenes": 5,
  "voiceId": "optional-elevenlabs-voice-id"
}
```

### Check Status

```http
GET /api/videos/:jobId
```

## Monitoring

Access the Bull Board dashboard at:
http://localhost:3001/
