FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency resolution
COPY package.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies
RUN npm install

# Copy source code
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/

# Build shared package first, then API
RUN npm run build -- --filter=@video-venture/shared
RUN npm run build -- --filter=@video-venture/api

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy API build output
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json

# Create directory for shared package in node_modules
RUN mkdir -p ./node_modules/@video-venture/shared

# Copy shared package files to the right location
COPY --from=builder /app/packages/shared/dist ./node_modules/@video-venture/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@video-venture/shared/package.json

# Install production dependencies
RUN npm install --production

EXPOSE 6969

CMD ["node", "dist/index.js"]