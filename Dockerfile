# Use Node.js 18 with Alpine Linux (lightweight)
FROM node:18-alpine

# Install system dependencies for video processing
RUN apk add --no-cache \
    python3 \
    py3-pip \
    python3-dev \
    py3-virtualenv \
    ffmpeg \
    curl

# Create and use virtual environment for Python packages
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install yt-dlp

# Set working directory
WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install ALL dependencies (including dev) for build
RUN npm install --legacy-peer-deps

# Copy all source code
COPY . .

# Temporarily remove the problematic page
# RUN rm -f app/analyze/page.tsx

# Create temp directory for video processing with proper permissions
RUN mkdir -p temp && chmod 755 temp

# Set NODE_ENV for build
ENV NODE_ENV=production

# Build the Next.js application
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]