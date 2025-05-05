# VideoVenture Pipeline Deployment Guide

This guide covers the complete setup of the VideoVenture pipeline on a fresh VPS, from initial server configuration to full deployment with Traefik.

## Initial Server Setup

```bash
# Connect to your VPS
ssh root@your-vps-ip

# Update system packages
apt update && apt upgrade -y

# Install essential packages, most of these should already be available
apt install -y curl git nano htop ufw build-essential wget

# Set up firewall
ufw allow ssh
ufw allow http
ufw allow https
ufw enable

# Create deploy user
adduser deploy
usermod -aG sudo deploy

# Create project directory
mkdir -p /opt/videoventure
chown -R deploy:deploy /opt/videoventure
chmod 750 /opt/videoventure
```

## Docker Installation (if not already pre-installed on VPS) Should add deploy user to docker regardless

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Add deploy user to docker group
usermod -aG docker deploy

# Install Docker Compose plugin
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# Verify installations
docker --version
docker compose version
```

## SSH Key Setup

On your local machine:

```bash
# Generate deployment key
ssh-keygen -t ed25519 -C "github-actions" -f github-actions

# Copy public key to VPS for deploy user
ssh-copy-id -i github-actions.pub deploy@your-vps-ip

# Set up GitHub secret
cat github-actions # Copy output to GitHub secret DEPLOY_SSH_KEY
```

## Directory Structure Setup

```bash
# Switch to deploy user
su - deploy

# Create directory structure
cd /opt/videoventure
mkdir -p traefik/letsencrypt traefik/auth scripts data

# Create empty ACME file with correct permissions
touch traefik/letsencrypt/acme.json
chmod 600 traefik/letsencrypt/acme.json
```

## Create Docker Compose File

```bash
# Create docker-compose.yml
nano /opt/videoventure/docker-compose.yml
```

Paste this content:

```yaml
version: "3.8"

services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/config:/etc/traefik
      - ./traefik/letsencrypt:/letsencrypt
      - ./traefik/auth:/auth
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--entrypoints.web.http.redirections.entryPoint.scheme=https"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=${ADMIN_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.traefik-dashboard.rule=Host(`traefik.${DOMAIN}`)"
      - "traefik.http.routers.traefik-dashboard.service=api@internal"
      - "traefik.http.routers.traefik-dashboard.entrypoints=websecure"
      - "traefik.http.routers.traefik-dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.routers.traefik-dashboard.middlewares=traefik-auth"
      - "traefik.http.middlewares.traefik-auth.basicauth.usersfile=/auth/users.txt"
    restart: unless-stopped
    networks:
      - web

  redis:
    image: redis:alpine
    container_name: redis
    volumes:
      - redis-data:/data
    restart: unless-stopped
    networks:
      - web

  api:
    image: ${DOCKER_REGISTRY}/videoventure-api:${TAG}
    container_name: api
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GOOGLE_APPLICATION_CREDENTIALS=/app/service-account.json
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - AWS_REGION=${AWS_REGION}
      - ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - S3_BUCKET_NAME=${S3_BUCKET_NAME}
      - CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
    volumes:
      - ./data/service-account.json:/app/service-account.json:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.${DOMAIN}`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.services.api.loadbalancer.server.port=6969"
    depends_on:
      - redis
    restart: unless-stopped
    networks:
      - web

  worker:
    image: ${DOCKER_REGISTRY}/videoventure-worker:${TAG}
    container_name: worker
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - GOOGLE_APPLICATION_CREDENTIALS=/app/service-account.json
      - AWS_REGION=${AWS_REGION}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - S3_BUCKET_NAME=${S3_BUCKET_NAME}
      - ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - BEATOVEN_API_KEY=${BEATOVEN_API_KEY}
      - FAL_API_KEY=${FAL_API_KEY}
      - WORKER_CONCURRENCY=1
    volumes:
      - ./data/service-account.json:/app/service-account.json:ro
      - worker-data:/app/data
    depends_on:
      - redis
    restart: unless-stopped
    networks:
      - web

  bull-board:
    image: ${DOCKER_REGISTRY}/videoventure-bull-board:${TAG}
    container_name: bull-board
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - BULL_BOARD_PORT=3001
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.bull-board.rule=Host(`dashboard.${DOMAIN}`)"
      - "traefik.http.routers.bull-board.entrypoints=websecure"
      - "traefik.http.routers.bull-board.tls.certresolver=letsencrypt"
      - "traefik.http.services.bull-board.loadbalancer.server.port=3001"
      - "traefik.http.routers.bull-board.middlewares=bull-auth"
      - "traefik.http.middlewares.bull-auth.basicauth.usersfile=/auth/users.txt"
    depends_on:
      - redis
    restart: unless-stopped
    networks:
      - web

networks:
  web:
    name: web
    driver: bridge

volumes:
  redis-data:
  worker-data:
```

## Create Deployment Script

```bash
# Create deploy.sh script
nano /opt/videoventure/scripts/deploy.sh
```

Paste this content:

```bash
#!/bin/bash
set -e

cd /opt/videoventure

# Handle .env.deploy file
if [ -f .env.deploy ]; then
  # Extract values from .env.deploy
  TAG=$(grep TAG .env.deploy | cut -d= -f2)
  DOCKER_REGISTRY=$(grep DOCKER_REGISTRY .env.deploy | cut -d= -f2)

  # Update values in .env without duplicating
  if grep -q "^TAG=" .env; then
    sed -i "s|^TAG=.*|TAG=$TAG|" .env
  else
    echo "TAG=$TAG" >> .env
  fi

  if grep -q "^DOCKER_REGISTRY=" .env; then
    sed -i "s|^DOCKER_REGISTRY=.*|DOCKER_REGISTRY=$DOCKER_REGISTRY|" .env
  else
    echo "DOCKER_REGISTRY=$DOCKER_REGISTRY" >> .env
  fi

  echo "Updated environment with TAG=$TAG and DOCKER_REGISTRY=$DOCKER_REGISTRY"
else
  echo "Warning: .env.deploy file not found!"
fi

# Pull latest images
docker compose pull

# Apply changes and restart containers
docker compose up -d

# Clean up old images
docker image prune -f -a --filter "until=24h"

echo "Deployment completed at $(date)"
```

Make it executable:

```bash
chmod +x /opt/videoventure/scripts/deploy.sh
```

## Create Environment File

```bash
# Create .env file
nano /opt/videoventure/.env
```

Refer to the .env.example for the ENV vars needed to fill

## Set Up Authentication

```bash
# Create auth file for Traefik & Bull Board
htpasswd -bc /opt/videoventure/traefik/auth/users.txt admin your-secure-password
chmod 600 /opt/videoventure/traefik/auth/users.txt
```

## Set Up GitHub Container Registry Access

```bash
# Log in to GitHub Container Registry
echo YOUR_GITHUB_PAT| docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

You will need create a PAT from Settings > Developer Settings > Create PAT Token and make sure it has package read access

## Set Up Service Account

```bash
# Copy service account file to VPS
# From your local machine:
scp service-account.json deploy@your-vps-ip:/opt/videoventure/data/
```

## Set Up DNS

Configure these DNS records at your domain registrar:

- A Record: api.videoventure.ai → your-vps-ip
- A Record: dashboard.videoventure.ai → your-vps-ip
- A Record: traefik.videoventure.ai → your-vps-ip

## Set Up GitHub Actions

1. Create `.github/workflows/deploy.yml` in your repository

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  REGISTRY_USERNAME: ${{ github.actor }}
  REGISTRY_PASSWORD: ${{ secrets.GITHUB_TOKEN }}
  ORGANIZATION: your-github-username

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build shared package
        run: npm run build -- --filter=@video-venture/shared

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ env.REGISTRY_USERNAME }}
          password: ${{ env.REGISTRY_PASSWORD }}

      - name: Extract metadata
        id: meta
        run: echo "version=$(date +'%Y%m%d%H%M%S')" >> $GITHUB_OUTPUT

      - name: Build and push API image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/api/Dockerfile
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.ORGANIZATION }}/videoventure-api:${{ steps.meta.outputs.version }},${{ env.REGISTRY }}/${{ env.ORGANIZATION }}/videoventure-api:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push Worker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/worker/Dockerfile
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.ORGANIZATION }}/videoventure-worker:${{ steps.meta.outputs.version }},${{ env.REGISTRY }}/${{ env.ORGANIZATION }}/videoventure-worker:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push Bull Board image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./apps/bull-board/Dockerfile
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.ORGANIZATION }}/videoventure-bull-board:${{ steps.meta.outputs.version }},${{ env.REGISTRY }}/${{ env.ORGANIZATION }}/videoventure-bull-board:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.3
        env:
          VERSION: ${{ steps.meta.outputs.version }}
          REGISTRY: ${{ env.REGISTRY }}
          ORGANIZATION: ${{ env.ORGANIZATION }}
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: deploy
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script_stop: true
          envs: VERSION,REGISTRY,ORGANIZATION
          script: |
            cd /opt/videoventure
            # Create deployment file
            echo "TAG=$VERSION" > .env.deploy
            echo "DOCKER_REGISTRY=$REGISTRY/$ORGANIZATION" >> .env.deploy
            # Make sure deployment script is executable
            chmod +x scripts/deploy.sh
            # Run deployment
            ./scripts/deploy.sh
```

2. Add GitHub Repository Secrets:
   - `DEPLOY_SSH_KEY`: Private key content from github-actions file
   - `DEPLOY_HOST`: Your VPS IP address or domain

## Initial Manual Deployment

For first deployment or testing:

```bash
# Set initial TAG and REGISTRY values
echo "TAG=latest" > /opt/videoventure/.env.deploy
echo "DOCKER_REGISTRY=ghcr.io/your-github-username" >> /opt/videoventure/.env.deploy

# Run deployment script
cd /opt/videoventure
./scripts/deploy.sh
```

## Verify Deployment

```bash
# Check if containers are running
docker ps

# Check logs
docker logs api
docker logs worker
docker logs bull-board
docker logs traefik

# Test services
curl -I https://api.videoventure.ai
curl -I https://dashboard.videoventure.ai
curl -I https://traefik.videoventure.ai
```

## Create Additional User with Sudo Access (Optional)

```bash
# As root user
adduser yourusername
usermod -aG sudo yourusername
usermod -aG deploy yourusername

# Set up SSH key authentication (from your local machine)
ssh-copy-id yourusername@your-vps-ip

# Secure SSH access (as root)
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
systemctl restart ssh
```

Grant this user permissions to `/opt/videventure` if needed, just make sure the max permission on the `acme.json` is `600` or it will cause the SSL cert generation to fail.

## Useful Commands

```bash
# View logs
docker logs -f traefik
docker logs -f api

# Restart services
docker compose restart worker

# Monitor containers
docker stats

# Check disk usage
df -h

# Check service status
docker compose ps
```
