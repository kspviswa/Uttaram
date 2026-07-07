#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

VERSION=$(node -p "require('./package.json').version")
IMAGE="kspviswa/uttaram"

echo "==> Building $IMAGE:$VERSION ..."
docker build -t "$IMAGE:$VERSION" -t "$IMAGE:latest" .

echo "==> Stopping existing containers ..."
docker compose down

echo "==> Starting new container ..."
docker compose up -d

echo "==> Done. Running on port 7777 -> 3000"
