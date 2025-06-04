# Video Venture Monorepo

AI-powered video generation pipeline that creates videos from text descriptions using multiple AI models.

## Overview

Video Venture transforms your ideas into complete videos through an intelligent pipeline:

1. **Concept** → Describe your video idea
2. **Storyboard** → AI breaks it into scenes
3. **Generation** → Creates videos with voiceovers
4. **Download** → Get your finished video

## Architecture

This is a **TypeScript monorepo** with shared types and utilities across all services:

## Tech Stack

### Backend Services

- **API**: Fastify + TypeScript
- **Worker**: Node.js background processor
- **Database**: PostgreSQL with Drizzle ORM
- **Queue**: Redis + BullMQ for job management
- **Storage**: AWS S3 for media files

### Frontend

- **Framework**: Next.js 14 + TypeScript
- **UI**: Tailwind CSS + Radix UI
- **Auth**: Clerk
- **State**: TanStack Query + tRPC

### AI Services

- **Video Generation**: Fal.ai
- **Voice Synthesis**: ElevenLabs
- **Storyboard Creation**: OpenAI GPT-4

### DevOps

- **Monorepo**: Turbo for build orchestration
- **Backend Deployment**: Docker + VPS
- **Frontend Deployment**: Vercel
- **CI/CD**: GitHub Actions

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
cd videoventure-pipeline
npm install
```

2. **Environment setup:**

```bash
# Backend services
cp .env.example .env
# Edit .env with your API keys and database URLs

# Frontend
cp apps/frontend/.env.example apps/frontend/.env.local
# Edit with your frontend environment variables
```

3. **Build shared package:**

```bash
npm run build -- --filter=@video-venture/shared
```

## Development

### Full Stack Development

Start everything (backend + frontend):

```bash
npm run dev:fullstack
```

This runs:

- Backend services in Docker (API, Worker, Bull Board, Redis)
- Frontend locally with hot reload

**Access:**

- **Frontend**: http://localhost:3000
- **API**: http://localhost:6969
- **Bull Board**: http://localhost:3001

### Backend Only

Start just the backend services:

```bash
npm run dev:backend
# or
docker-compose up --build
```

### Frontend Only

Start just the frontend (assumes backend is running):

```bash
npm run dev:frontend
```

### Individual Services

```bash
# API only
npm run dev -- --filter=@video-venture/api

# Worker only
npm run dev -- --filter=@video-venture/worker

# Bull Board only
npm run dev -- --filter=@video-venture/bull-board
```

## Building

### Build Everything

```bash
npm run build
```

### Build Specific Services

```bash
# Shared package (required first)
npm run build -- --filter=@video-venture/shared

# Backend services
npm run build -- --filter=@video-venture/api
npm run build -- --filter=@video-venture/worker
npm run build -- --filter=@video-venture/bull-board

# Frontend
npm run build -- --filter=@video-venture/frontend
```

## Deployment

### Backend Services → VPS

Backend services are automatically deployed to VPS via GitHub Actions when changes are pushed to `main`:

- Triggers on changes to: `apps/api/`, `apps/worker/`, `apps/bull-board/`, `packages/shared/`
- Builds Docker images and deploys via SSH

### Frontend → Vercel

Frontend is automatically deployed to Vercel:

- Triggers on changes to: `apps/frontend/`, `packages/shared/`
- Configured through Vercel dashboard with monorepo settings

## Shared Types

The monorepo enables type safety across the entire stack:

```typescript
// packages/shared/src/types/index.ts
export interface VideoProject {
  id: string;
  projectName: string;
  status: ProjectStatus;
  // ... more fields
}

// apps/api/src/routes/videos.ts
import { VideoProject } from "@video-venture/shared";

// apps/frontend/src/components/VideoCard.tsx
import { VideoProject } from "@video-venture/shared";
```

Changes to shared types immediately show TypeScript errors across all services.

## Environment Variables

Checkout the .env.example for how to setup env's

## Useful Commands

```bash
# Install dependencies
npm install

# Clean everything
npm run clean

# Type check all packages
npm run typecheck

# Lint all packages
npm run lint

# Stop Docker services
npm run docker:down

# View logs
docker-compose logs -f api
docker-compose logs -f worker
```

## Healthcheck

```bash
# API health
curl http://localhost:6969/healthcheck
```

## Contributing

1. Create a feature branch
2. Make changes (shared types, backend, frontend)
3. Test locally with `npm run dev:fullstack`
4. Push to trigger deployments
5. Backend → VPS, Frontend → Vercel

## Troubleshooting

### "Cannot find module '@video-venture/shared'"

```bash
npm run build -- --filter=@video-venture/shared
```

### Docker port conflicts

```bash
npm run docker:down
docker system prune
```

### Frontend build issues

```bash
cd apps/frontend
rm -rf .next node_modules
cd ../..
npm install
npm run build -- --filter=@video-venture/shared
npm run dev:frontend
```
