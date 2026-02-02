#!/bin/bash
set -e

echo "🚀 Starting BeauTips on Railway"
echo "==============================="

# Railway даёт PORT через env
if [ -z "$PORT" ]; then
  echo "⚠️  PORT is not set. Defaulting to 8000 (local run)."
  PORT=8000
fi

echo "✅ Running: python -m uvicorn main:app --host 0.0.0.0 --port $PORT"
exec python -m uvicorn main:app --host 0.0.0.0 --port "$PORT"
