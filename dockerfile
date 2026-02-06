# Use Node base image
FROM node:20-slim

# Install Chromium + dependencies
RUN apt-get update && apt-get install -y \
  chromium \
  fonts-liberation \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  libgbm1 \
  libasound2 \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use system Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# App directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
