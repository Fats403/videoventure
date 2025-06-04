#!/bin/bash
set -e

cd /opt/videoventure

echo "Starting deployment at $(date)"

# Replace docker-compose.yml with production version if it exists
if [ -f docker-compose.prod.yml ]; then
  mv docker-compose.prod.yml docker-compose.yml
  echo "Updated docker-compose.yml with production configuration"
fi

# Properly handle the .env.deploy file
if [ -f .env.deploy ]; then
  # Extract values from .env.deploy
  TAG=$(grep TAG .env.deploy | cut -d= -f2)
  DOCKER_REGISTRY=$(grep DOCKER_REGISTRY .env.deploy | cut -d= -f2)
  
  # Update the values in .env without duplicating them
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
echo "Pulling latest Docker images..."
docker compose pull

# Apply any changes and restart containers
echo "Starting services..."
docker compose up -d

# Clean up old images
echo "Cleaning up old Docker images..."
docker image prune -f -a --filter "until=24h"

echo "Deployment completed successfully at $(date)" 