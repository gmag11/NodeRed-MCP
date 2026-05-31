# syntax=docker/dockerfile:1

FROM node:20-alpine

WORKDIR /app

# Install production dependencies first (layer cache-friendly)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY index.js ./
COPY src/ ./src/

# Run as non-root
USER node

EXPOSE 3000

CMD ["npm", "run", "start:http"]
