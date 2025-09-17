#!/bin/bash
set -euo pipefail # Exit immediately if any command fails

echo "Starting CI process..."

echo "Linting code with ESLint..."
npx eslint .

echo "Formatting code with Prettier..."
npx prettier --write .

echo "Running Tests with Jest..."
npm test

echo "Building and starting Docker containers..."
docker compose up --build -d

echo "CI process completed successfully."