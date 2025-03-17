FROM node:18-alpine

RUN apk add --no-cache ffmpeg 

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

# Create temporary data directory for video storage and processing
RUN mkdir -p /app/temp

CMD ["node", "dist/index.js"]