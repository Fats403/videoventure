FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency resolution
COPY package.json turbo.json ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies
RUN npm install

# Copy source code
COPY apps/worker/src ./apps/worker/src
COPY apps/worker/tsconfig.json ./apps/worker/
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/

# Copy fonts directory
COPY apps/worker/fonts ./apps/worker/fonts

# Build shared package first, then worker
RUN npm run build -- --filter=@video-venture/shared
RUN npm run build -- --filter=@video-venture/worker

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install ffmpeg
RUN apk add --no-cache ffmpeg

# Copy worker build output
COPY --from=builder /app/apps/worker/dist ./dist
COPY --from=builder /app/apps/worker/package.json ./package.json

# Create fonts directory and copy fonts
RUN mkdir -p ./fonts
COPY --from=builder /app/apps/worker/fonts ./fonts

# Create directory for shared package in node_modules
RUN mkdir -p ./node_modules/@video-venture/shared

# Copy shared package files to the right location
COPY --from=builder /app/packages/shared/dist ./node_modules/@video-venture/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@video-venture/shared/package.json

# Install production dependencies
RUN npm install --production

# Create data directory
RUN mkdir -p /app/data

CMD ["node", "dist/index.js"]