![Deploy Status](https://github.com/gimmeursocks/konecta-cicd-project/actions/workflows/ci.yml/badge.svg)

[![Build Status](http://156.193.84.39:8090/buildStatus/icon?job=konecta-cicd)](http://156.193.84.39:8090/job/konecta-cicd/)

<sub>Jenkins pipeline (`Jenkinsfile`) runs the same checks defined in `ci.sh` on every push, using a webhook.</sub>

<sub>GitHub Actions workflow (`.github/workflows/ci.yml`) runs the same checks defined in `ci.sh` on every push. (Currently disabled in favor of Jenkins)</sub>

# Konecta CICD Project

We were tasked with dockerizing a node.js application to track team members availability. This project uses docker volumes for postgresql to ensure data persistence, to fix the issue where previously data was lost when containers were stopped or removed. A full CI/CD bash script pipeline was included, using ESLint, Prettier, Jest, Trivy, and docker compose. Finally the image is pushed to docker hub.

---

## Project Setup

1. Clone the repo:

   ```bash
   git clone https://github.com/gimmeursocks/konecta-cicd-project/
   cd konecta-cicd-project
   ```

   - `.gitignore` file was added to exclude large or unwanted files

2. Install dependencies for local development:

   ```bash
   npm install
   ```

3. Fill in the `.env.example`, then rename it to `.env`:

   ```bash
   IMAGE_NAME=your-username/your-image
   IMAGE_TAG=latest

   APP_PORT=3000
   S3_BUCKET=your-s3-bucket-name
   AWS_REGION=your-aws-region

   # Local development with postgres and dockerhub
   DOCKER_USER=your_dockerhub_username
   DOCKER_PASS=your_dockerhub_password

   POSTGRES_PORT=5432
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

echo "Starting containers and stopping old ones..."
docker compose down || true
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

The application is dockerized for portability and data persistence using Docker volumes

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
    build: .
    image: "${IMAGE_NAME}:${IMAGE_TAG}"
    ports:
      - "${APP_PORT}:${APP_PORT}"
    environment:
      APP_PORT: ${APP_PORT}
      POSTGRES_PORT: ${POSTGRES_PORT}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    depends_on:
      - postgres

  postgres:
    image: postgres:alpine
    ports:
      - "${POSTGRES_PORT}:5432"
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
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

---

## Github Actions workflow

`.github/workflows/ci.yaml` runs the same checks as `ci.sh` but on every push, uses the Github secrets as an online .env file

```bash
name: CI

on:
  push:
    branches: [main]
  pull_request:

env:
  IMAGE_NAME: ${{ secrets.IMAGE_NAME }}
  DOCKER_USER: ${{ secrets.DOCKER_USER }}
  DOCKER_PASS: ${{ secrets.DOCKER_PASS }}
  APP_PORT: 3000
  POSTGRES_PORT: 5432
  POSTGRES_USER: ${{ secrets.POSTGRES_USER }}
  POSTGRES_PASSWORD: ${{ secrets.POSTGRES_PASSWORD }}

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: "22"

      - name: Short commit
        run: echo "IMAGE_TAG=${GITHUB_SHA::7}" >> $GITHUB_ENV

      - name: Install dependencies
        run: npm ci

      - name: Lint with ESLint
        run: npx eslint . --max-warnings 0

      - name: Check formatting with Prettier
        run: npx prettier --check .

      - name: Run tests with Jest
        run: npm test

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build Docker image
        run: docker compose build
        env:
          IMAGE_NAME: ${{ env.IMAGE_NAME }}
          IMAGE_TAG: ${{ env.IMAGE_TAG }}

      - name: Install Trivy
        run: |
          curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh
          sudo mv ./bin/trivy /usr/local/bin/trivy

      - name: Scan image with Trivy
        run: |
          trivy image \
            --exit-code 1 \
            --quiet \
            --skip-version-check \
            --ignore-unfixed \
            --severity HIGH,CRITICAL \
            --format json "${IMAGE_NAME}:${IMAGE_TAG}" |
          jq '.Results[] | select(.Vulnerabilities | length > 0)'

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ env.DOCKER_USER }}
          password: ${{ env.DOCKER_PASS }}

      - name: Push Docker image
        run: docker push "${IMAGE_NAME}:${IMAGE_TAG}"

      - name: Start containers
        run: docker compose up -d
```

---

## Jenkins setup

#### Installation

- Installed Jenkins natively on my local machine, with basic default plugins
- Configured the `jenkins` user in the `docker` group to allow Jenkins to talk with the Docker daemon

#### Configure public access

For testing purposes I exposed my local Jenkins to the public internet so that Github's webhook will be able to reach it:

- Home network + Port forwarding (my setup)
  - Forwarded port 8090 on my home router to the Jenkins server
  - Accessed through `http://<my-public-ip>:8090/`
  - Pros: It is simple and persistent as long as my machine is up
  - Cons: Works only at home and requires keeping the machine up, and to be mindful of security

- Temporary tunnel (alternative)
  - Tools like ngrok, cloudflared tunnel, etc.. create a temporary public URL that can be forwarded to my local Jenkins server
  - Pros: No need for static IP or router access, works anywhere
  - Cons: URL is temporary and the webhook has to be modified every time it changes

---

## Jenkins deployment

`Jenkinsfile` runs the same pipeline as `ci.sh`, using a Github webhook

Key points:

1. Runs natively on my machine
2. Is invoked by a webhook through a Github push
3. Utilizes Jenkins credential management for secrets

| Credential ID  | Type              | Used For                              |
| -------------- | ----------------- | ------------------------------------- |
| `docker-creds` | Username/Password | Docker Hub push                       |
| `pg-creds`     | Username/Password | Postgres user/pass for build & deploy |

```bas
pipeline {
    agent any

    environment {
        IMAGE_NAME = "gimmeursocks/konecta-cicd-project"
        // use the short commit hash from the GitHub webhook as the tag
        IMAGE_TAG  = "${env.GIT_COMMIT.take(7)}"
        APP_PORT       = '3000'
        POSTGRES_PORT  = '5432'
    }

    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npx eslint . --max-warnings 0'
            }
        }

        stage('Prettier Check') {
            steps {
                sh 'npx prettier --check .'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'pg-creds',
                                                 usernameVariable: 'POSTGRES_USER',
                                                 passwordVariable: 'POSTGRES_PASSWORD')]) {
                    sh 'docker compose build'
                }
            }
        }

        stage('Security Scan with Trivy') {
            steps {
                sh '''
                  trivy image \
                    --exit-code 1 \
                    --quiet \
                    --skip-version-check \
                    --ignore-unfixed \
                    --severity HIGH,CRITICAL \
                    --format json "${IMAGE_NAME}:${IMAGE_TAG}" |
                    jq '.Results[] | select(.Vulnerabilities | length > 0)'
                '''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-creds',
                                                 usernameVariable: 'DOCKER_USER',
                                                 passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                      echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                      docker push "${IMAGE_NAME}:${IMAGE_TAG}"
                    '''
                }
            }
        }

        stage('Deploy Containers') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'pg-creds',
                                                 usernameVariable: 'POSTGRES_USER',
                                                 passwordVariable: 'POSTGRES_PASSWORD')]) {
                    sh '''
                      # Stop and remove any existing containers for this project
                      docker compose down || true
                      docker compose up -d
                    '''
                }
            }
        }
    }

    post {
        always {
            echo 'CI process completed.'
        }
        failure {
            echo 'CI process failed!'
        }
    }
}
```

---

## Pre-commit Hook for Auto-Formatting

To keep the codebase clean and consistent, we use a Git pre-commit hook that runs the formatter automatically before each commit:

1. Install Husky

   ```bash
   npm install --save-dev husky
   npx husky init
   ```

2. Create the hook

   ```bash
   echo "npm run format" > .husky/pre-commit
   ```

3. Format script
   In `package.json`:

   ```json
   "scripts": {
     "format": "npx prettier --write ."
   }
   ```

Now every `git commit` will automatically format files with Prettier before the commit is finalized, the CI steps are still kept for errors that might slip through the cracks.

---

## Common Issues & Fixes

| Issue                                  | Symptom / Error                                                                               | Fix                                                                                                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Port 5432 already in use**           | `bind: address already in use` when starting PostgreSQL container                             | I had a local PostgreSQL service running. Stopped it (`sudo systemctl stop postgresql`).                                                                         |
| **Jenkins can’t access Docker daemon** | Build steps fail with `permission denied while trying to connect to the Docker daemon socket` | Added the `jenkins` user to the `docker` group and restarted Jenkins: `sudo usermod -aG docker jenkins && sudo systemctl restart jenkins`.                       |
| **GitHub Webhook not triggering**      | No Jenkins job scheduled after a successful trigger                                           | Double check webhook URL (`http://<my-public-ip>:8090/github-webhook/`), repository “Webhook” settings, and make sure the server is reachable from the internet. |
