#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

IMAGE="kspviswa/uttaram"

echo "==> Building $IMAGE:latest ..."
docker build -t "$IMAGE:latest" .

echo "==> Stopping existing containers ..."
docker compose down

echo "==> Starting new container ..."
docker compose up -d

echo "==> Done. Running on port 7777 -> 3000"
