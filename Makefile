.PHONY: help build up down restart logs ps clean test backup

# По умолчанию показываем help
.DEFAULT_GOAL := help

help: ## Показать эту справку
	@echo "BeauTips - Доступные команды:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Собрать Docker образы
	docker-compose build

up: ## Запустить приложение
	docker-compose up -d
	@echo "✅ Приложение запущено!"
	@echo "Frontend: http://localhost"
	@echo "Backend: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"

down: ## Остановить приложение
	docker-compose down
	@echo "✅ Приложение остановлено"

restart: down up ## Перезапустить приложение

logs: ## Показать логи всех сервисов
	docker-compose logs -f

logs-backend: ## Показать логи backend
	docker-compose logs -f backend

logs-frontend: ## Показать логи frontend
	docker-compose logs -f frontend

logs-db: ## Показать логи PostgreSQL
	docker-compose logs -f postgres

ps: ## Показать статус контейнеров
	docker-compose ps

clean: ## Удалить контейнеры и volumes
	docker-compose down -v
	@echo "✅ Контейнеры и volumes удалены"

clean-all: clean ## Удалить всё включая образы
	docker-compose down -v --rmi all
	@echo "✅ Всё удалено"

shell-backend: ## Открыть shell в backend контейнере
	docker-compose exec backend /bin/bash

shell-frontend: ## Открыть shell в frontend контейнере
	docker-compose exec frontend /bin/sh

shell-db: ## Открыть PostgreSQL shell
	docker-compose exec postgres psql -U beautips_user -d beautips_db

backup-db: ## Создать бэкап базы данных
	@mkdir -p backups
	docker-compose exec -T postgres pg_dump -U beautips_user beautips_db > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Бэкап создан в backups/"

restore-db: ## Восстановить бэкап базы данных (использование: make restore-db FILE=backups/backup.sql)
	@if [ -z "$(FILE)" ]; then echo "❌ Укажите файл: make restore-db FILE=backups/backup.sql"; exit 1; fi
	docker-compose exec -T postgres psql -U beautips_user -d beautips_db < $(FILE)
	@echo "✅ Бэкап восстановлен"

test: ## Запустить тесты (если есть)
	@echo "Тесты пока не настроены"

prod-up: ## Запустить в production режиме с HTTPS
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo "✅ Production режим запущен с HTTPS"

prod-down: ## Остановить production
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

prod-logs: ## Логи production
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

health: ## Проверить health check
	@echo "Проверка backend health..."
	@curl -s http://localhost:8000/api/health | python3 -m json.tool || echo "❌ Backend недоступен"

setup: ## Первоначальная настройка (создание .env)
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✅ Файл .env создан. Отредактируйте его перед запуском!"; \
	else \
		echo "⚠️  Файл .env уже существует"; \
	fi

dev: ## Запустить в режиме разработки
	@echo "Запуск в режиме разработки..."
	docker-compose up

install: setup build up ## Полная установка (setup + build + up)
	@echo "✅ Установка завершена!"
	@echo "Откройте http://localhost в браузере"
