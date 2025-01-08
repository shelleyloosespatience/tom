# Stage 1: Build the Node.js app
FROM node:18-alpine as builder

WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
RUN npm ci

# Copy application code and build
COPY . .
RUN npm run build

# Stage 2: Runtime environment
FROM node:18-alpine

WORKDIR /app

# Copy the built application from the builder stage
COPY --from=builder /app/dist .

# Install system dependencies for Roblox and automation
RUN apk add --no-cache \
    xvfb \
    x11vnc \
    wine \
    curl \
    py3-pip && \
    pip install pyautogui opencv-python-headless

# Download and install Roblox Player
RUN wget -q https://setup.roblox.com/RobloxPlayerLauncher.exe && \
    xvfb-run --auto-servernum wine RobloxPlayerLauncher.exe /S && \
    rm -f RobloxPlayerLauncher.exe

# Install Node.js runtime dependencies
RUN npm install --silent selenium-webdriver puppeteer

# Expose the app's port
EXPOSE 3000

# Set environment variables
ENV ROBLOX_COOKIE=${ROBLOX_COOKIE}
ENV TOKEN=${TOKEN}
ENV MONGODB_URI=${MONGODB_URI}

# Start the application
CMD ["npm", "run", "start:docker"]
