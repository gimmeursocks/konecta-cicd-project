FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (excluding dev dependencies)
RUN npm ci --omit=dev && npm cache clean --force

# Copy source code
COPY src/ server.js ./

# Best practice to use a non-root user
RUN addgroup -S app && adduser -S app -G app && \
    chown -R app:app /app
USER app

# Expose the port
EXPOSE 3000

# Run the application
CMD ["node", "server.js"]