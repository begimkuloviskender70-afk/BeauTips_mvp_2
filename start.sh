#!/bin/bash
set -e

echo "🚀 Starting BeauTips on Railway"
echo "==============================="

if [ -z "$PORT" ]; then
  PORT=8000
fi

exec python -m uvicorn backend.main:app --host 0.0.0.0 --port "$PORT"
