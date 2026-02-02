#!/bin/bash
set -e

echo "🚀 Starting BeauTips on Railway"
echo "==============================="

# Railway/Render/Vercel-подобные платформы дают PORT через переменную окружения
if [ -z "$PORT" ]; then
  echo "⚠️  PORT is not set. Defaulting to 8000 (local run)."
  PORT=8000
fi

# Если твой файл НЕ main.py — замени main:app на правильный импорт
# Примеры:
#   uvicorn app:app
#   uvicorn backend.main:app
#   uvicorn src.main:app
echo "✅ Running: uvicorn main:app --host 0.0.0.0 --port $PORT"
exec uvicorn main:app --host 0.0.0.0 --port "$PORT"
