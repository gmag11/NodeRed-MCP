# syntax=docker/dockerfile:1

FROM node:22-alpine

WORKDIR /app

# Install production dependencies first (layer cache-friendly)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY index.js ./
COPY src/ ./src/
# Copy all skills except openspec-* (excluded via .dockerignore)
COPY .github/skills/ ./.github/skills/

# Run as non-root
USER node

EXPOSE 3000

CMD ["npm", "run", "start:http"]
