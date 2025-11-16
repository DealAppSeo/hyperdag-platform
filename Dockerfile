FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application
COPY dist ./dist
COPY shared ./shared

# Expose port
EXPOSE 5000

# Start the minimal production server
CMD ["node", "dist/server.js"]
