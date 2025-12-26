# Multi-stage build for Node.js backend
FROM node:18 AS builder

# Install build dependencies for native modules like bcrypt
RUN apt-get update && apt-get install -y python3 make g++ postgresql-client

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create entrypoint script
RUN chmod +x ./entrypoint.sh

# Expose port
EXPOSE 5000

# Start the application
CMD ["sh", "-c", "./entrypoint.sh"]