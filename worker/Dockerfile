FROM node:18-alpine

RUN apk add --no-cache ffmpeg 

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

# Create temporary data directory
RUN mkdir -p /app/temp

# No volume mounts needed since we're using temporary storage
CMD ["node", "dist/index.js"]