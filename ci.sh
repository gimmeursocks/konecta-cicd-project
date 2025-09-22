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