## 1. Dockerfile

- [x] 1.1 Create `Dockerfile` using `node:20-alpine` as the base image
- [x] 1.2 Set `WORKDIR /app` and copy `package*.json` first for layer caching
- [x] 1.3 Run `npm ci --omit=dev` to install only production dependencies
- [x] 1.4 Copy remaining source files (`index.js`, `src/`)
- [x] 1.5 Add `USER node` to run as non-root
- [x] 1.6 Set `EXPOSE 3000` and `CMD ["npm", "run", "start:http"]`

## 2. Docker Compose

- [x] 2.1 Create `docker-compose.yml` with a `nodered-mcp` service that builds from the local `Dockerfile`
- [x] 2.2 Configure `env_file: .env` so all environment variables are injected from the `.env` file
- [x] 2.3 Map the host port to the container port using `${PORT:-3000}:${PORT:-3000}`
- [x] 2.4 Add a `restart: unless-stopped` policy

## 3. Environment Configuration

- [x] 3.1 Verify `.env.example` contains `NODERED_URL`, `NODERED_USER`, `NODERED_PASSWORD`, and `PORT` entries with placeholder values and comments

## 4. Verification

- [x] 4.1 Run `docker build -t nodered-mcp .` and confirm the build succeeds
- [x] 4.2 Run `docker run --rm nodered-mcp whoami` and confirm output is `node`
- [x] 4.3 Run `docker compose up -d` with a valid `.env` and confirm the `/mcp` endpoint responds
