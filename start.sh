#!/bin/bash

# BeauTips Quick Start Script
# Скрипт для быстрого запуска приложения

set -e

echo "🚀 BeauTips Deployment Script"
echo "=============================="

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker и Docker Compose найдены"

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo "⚠️  Файл .env не найден. Создаем из .env.example..."
    cp .env.example .env
    echo "📝 Пожалуйста, отредактируйте файл .env с вашими настройками:"
    echo "   - DATABASE_URL"
    echo "   - SECRET_KEY"
    echo "   - GOOGLE_API_KEY"
    echo "   - SMTP настройки"
    echo ""
    echo "Затем запустите скрипт снова: ./start.sh"
    exit 0
fi

echo "✅ Файл .env найден"

# Остановка существующих контейнеров
echo "🛑 Остановка существующих контейнеров..."
docker-compose down

# Сборка и запуск контейнеров
echo "🔨 Сборка Docker образов..."
docker-compose build

echo "🚀 Запуск контейнеров..."
docker-compose up -d

# Ожидание запуска базы данных
echo "⏳ Ожидание запуска PostgreSQL..."
sleep 5

# Проверка статуса
echo "📊 Проверка статуса контейнеров..."
docker-compose ps

echo ""
echo "✅ Приложение запущено!"
echo ""
echo "🌐 Доступные URL:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📝 Просмотр логов:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Остановка приложения:"
echo "   docker-compose down"
echo ""
