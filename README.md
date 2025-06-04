# Video Venture

AI-powered video generation pipeline that creates videos from text descriptions using multiple AI models.

## Overview

Video Venture transforms your ideas into complete videos through an intelligent pipeline:

1. **Concept** → Describe your video idea
2. **Storyboard** → AI breaks it into scenes
3. **Generation** → Creates videos with voiceovers
4. **Download** → Get your finished video

## Tech Stack

- **Backend**: Node.js + TypeScript monorepo
- **Database**: PostgreSQL with Drizzle ORM
- **Queue**: Redis + BullMQ for background jobs
- **AI**: Fal.ai (video), ElevenLabs (voice), OpenAI (storyboard)
- **Storage**: AWS S3

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL
- Redis

### Setup

1. **Clone and install:**

```bash
git clone <your-repo>
cd video-venture
npm install
```

2. **Environment setup:**

```bash
cp .env.example .env
# Edit .env with your API keys and database URLs
```

3. **Rebuild shared package:**

```bash
npx turbo run build --filter=@video-venture/shared
```

4. **Start with Docker:**

```bash
docker compose up --build
```

### Services

- **API**: http://localhost:6969
- **Bull Board** (job monitoring): http://localhost:3001

# Healthcheck

curl http://localhost:6969/healthcheck
