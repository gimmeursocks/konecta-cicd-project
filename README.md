![Deploy Status](https://github.com/gimmeursocks/konecta-cicd-project/actions/workflows/ci.yml/badge.svg)

<sub>GitHub Actions workflow (`.github/workflows/ci.yml`) runs the same checks defined in `ci.sh` on every push.</sub>

# Konecta CICD Project

We were tasked with dockerizing a node.js application to track team members availability. This project uses docker volumes for postgresql to ensure data persistence, to fix the issue where previously data was lost when containers were stopped or removed. A full CI/CD bash script pipeline was included, using ESLint, Prettier, Jest, Trivy, and docker compose. Finally the image is pushed to docker hub.

---

## Project Setup

1. Clone the repo:

   ```bash
   git clone https://github.com/gimmeursocks/konecta-cicd-project/
   cd konecta-cicd-project
   ```

   - `.gitignore` file was added to skip ignore large unwanted files

2. Install dependencies for local development:

   ```bash
   npm install
   ```

3. Fill in the `.env.example`, then rename it to `.env`:

   ```bash
   DOCKER_USER=your_dockerhub_username
   DOCKER_PASS=your_dockerhub_password
   IMAGE_NAME=your-username/your-image
   IMAGE_TAG=latest
   
   APP_PORT=3000
   POSTGRES_PORT=5432
   POSTGRES_HOST=postgres
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   ```

---

## Continuous Integration Script (ci.sh)

This script automates the development workflow:

```bash
#!/bin/bash
set -euo pipefail # Exit immediately if any command fails

# load docker environment variables securely
set -o allexport; source .env; set +o allexport

echo "Starting CI process..."

echo "Linting code with ESLint..."
npx eslint . --max-warnings 0

echo "Formatting code with Prettier..."
npx prettier --check .

echo "Running Tests with Jest..."
npm test

echo "Building Docker image..."
docker compose build

echo "Scanning image with Trivy..."
# only show vulnerabilities if found
trivy image \
  --exit-code 1 \
  --quiet \
  --skip-version-check \
  --ignore-unfixed \
  --severity HIGH,CRITICAL \
  --format json "${IMAGE_NAME}:${IMAGE_TAG}" |
  jq '.Results[] | select(.Vulnerabilities | length > 0)'

echo "Pushing image to Docker Hub..."
echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
docker push "${IMAGE_NAME}:${IMAGE_TAG}"

echo "Starting containers..."
docker compose up -d

echo "CI process completed successfully."
```

#### How to run the script

```bash
bash ci.sh
```

##### It will:

1. Lint and format code
2. Run tests
3. Build docker images
4. Scan for vulnerabilities with trivy
5. Push the image to docker hub
6. Start the container with docker compose

---

## Dockerfile

The application is dockerized for portability and persistence using volumes for data.

Key points:

1. Base image: `node:22-alpine` (over 85% reduction in size 390 MB -> 55 MB)
2. Non root user access for security
3. Uses `.dockerignore` to skip unwanted files

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (excluding dev dependencies)
RUN npm ci --omit=dev && npm cache clean --force

# Copy source code
COPY . .

# Best practice to use a non-root user
RUN addgroup -S app && adduser -S app -G app && \
    chown -R app:app /app
USER app

# Expose the port
EXPOSE 3000

# Run the application
CMD ["node", "server.js"]
```

---

## Docker Compose

`docker-compose.yml` orchestrates the app and postgreSQL service:

```yaml
services:
  app:
    image: "${IMAGE_NAME}:${IMAGE_TAG}"
    build: .
    ports:
      - "3000:3000"
    environment:
      - APP_PORT=3000
      - POSTGRES_HOST=postgres
      - POSTGRES_PORT=5432
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    depends_on:
      - postgres

  postgres:
    image: postgres:alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

- Volumes persist database data between container restarts
- Depends_on ensures postgres starts before the app does

---

## Validating the Pipeline

1. Run the CI script

2. Verify that:
   - ESLint and Prettier run without any errors
   - All tests pass `npm test`
   - Trivy vulnerability scan returned nothing
   - Image push to docker hub was successful
   - Docker builds successfully
   - App is accessible through `http://localhost:3000`
3. Check that postgreSQL data persists after stopping containers:

   ```bash
   docker compose down
   docker compose up -d
   ```

   - Data in pgdata should persist and remain intact.
