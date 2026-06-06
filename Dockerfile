# syntax=docker/dockerfile:1

FROM node:22-alpine

WORKDIR /app

# Install production dependencies first (layer cache-friendly)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY index.js ./
COPY src/ ./src/
# Copy Node-RED skills (only nodered-* directories)
COPY .github/skills/nodered-flow-builder/ ./.github/skills/nodered-flow-builder/
COPY .github/skills/nodered-fundamentals/ ./.github/skills/nodered-fundamentals/
COPY .github/skills/nodered-node-reference/ ./.github/skills/nodered-node-reference/
COPY .github/skills/nodered-patterns/ ./.github/skills/nodered-patterns/

# Run as non-root
USER node

EXPOSE 3000

CMD ["npm", "run", "start:http"]
