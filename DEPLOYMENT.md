# 🚀 Инструкция по деплою BeauTips

Полное руководство по развертыванию приложения BeauTips в различных окружениях.

## 📋 Содержание

1. [Требования](#требования)
2. [Быстрый старт с Docker](#быстрый-старт-с-docker)
3. [Ручная установка](#ручная-установка)
4. [Production деплой](#production-деплой)
5. [Troubleshooting](#troubleshooting)

---

## Требования

### Минимальные требования системы:
- **CPU**: 2 ядра
- **RAM**: 2 GB (рекомендуется 4 GB)
- **Диск**: 5 GB свободного места
- **ОС**: Linux (Ubuntu 20.04+), macOS, Windows с WSL2

### Необходимое ПО:
- Docker 20.10+ и Docker Compose 2.0+
- Git (для клонирования репозитория)

### API ключи:
- Google Gemini API key (получить на https://aistudio.google.com/app/apikey)
- SMTP credentials (Gmail, Яндекс или другой провайдер)

---

## Быстрый старт с Docker

### 1. Клонирование репозитория

```bash
git clone <your-repo-url>
cd fmp-website
```

### 2. Настройка переменных окружения

```bash
# Создаем .env из примера
cp .env.example .env

# Редактируем .env
nano .env
```

**Обязательные переменные для настройки:**

```env
# База данных
POSTGRES_USER=beautips_user
POSTGRES_PASSWORD=надежный_пароль
POSTGRES_DB=beautips_db

# JWT секрет (сгенерируйте: openssl rand -hex 32)
SECRET_KEY=ваш_очень_длинный_секретный_ключ_32_символа_минимум

# Google Gemini API
GOOGLE_API_KEY=ваш_gemini_api_key

# Email (Gmail)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=ваш_app_password_16_символов
FROM_EMAIL=your-email@gmail.com

# URL приложения
BASE_URL=http://localhost
```

### 3. Запуск приложения

```bash
# Автоматический запуск
./start.sh

# Или вручную
docker-compose up -d
```

### 4. Проверка работы

Откройте в браузере:
- Frontend: http://localhost
- Backend API: http://localhost:8000/docs

### 5. Остановка приложения

```bash
# Используйте скрипт
./stop.sh

# Или вручную
docker-compose down
```

---

## Ручная установка (без Docker)

### Backend

```bash
cd backend

# Создаем виртуальное окружение
python -m venv venv
source venv/bin/activate  # На Windows: venv\Scripts\activate

# Устанавливаем зависимости
pip install -r requirements.txt

# Настраиваем .env
cp env.example .env
nano .env

# Запускаем сервер
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Простой HTTP сервер
python -m http.server 8080

# Или используйте nginx/apache
```

### База данных PostgreSQL

```bash
# Установка PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Создание базы данных
sudo -u postgres psql
CREATE DATABASE beautips_db;
CREATE USER beautips_user WITH PASSWORD 'ваш_пароль';
GRANT ALL PRIVILEGES ON DATABASE beautips_db TO beautips_user;
\q
```

---

## Production деплой

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt-get update && sudo apt-get upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Настройка для production

Отредактируйте `.env`:

```env
# Production URL
BASE_URL=https://yourdomain.com

# Используйте надежные пароли!
POSTGRES_PASSWORD=очень_сложный_пароль_минимум_32_символа
SECRET_KEY=новый_секретный_ключ_для_production
```

### 3. Настройка HTTPS (с Nginx + Let's Encrypt)

Создайте `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  nginx-proxy:
    image: jwilder/nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - ./certs:/etc/nginx/certs
      - ./vhost:/etc/nginx/vhost.d
      - ./html:/usr/share/nginx/html

  letsencrypt:
    image: jrcs/letsencrypt-nginx-proxy-companion
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./certs:/etc/nginx/certs
      - ./vhost:/etc/nginx/vhost.d
      - ./html:/usr/share/nginx/html
    environment:
      - DEFAULT_EMAIL=admin@yourdomain.com
```

### 4. Запуск production

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 5. Настройка автоматических бэкапов

Создайте `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Бэкап базы данных
docker exec beautips_postgres pg_dump -U beautips_user beautips_db > "$BACKUP_DIR/db_$DATE.sql"

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "db_*.sql" -mtime +30 -delete

echo "Backup completed: db_$DATE.sql"
```

Добавьте в crontab:

```bash
# Бэкап каждый день в 3:00
0 3 * * * /path/to/backup.sh
```

---

## Деплой на популярных платформах

### Railway.app

1. Создайте аккаунт на https://railway.app
2. Подключите GitHub репозиторий
3. Добавьте PostgreSQL из Marketplace
4. Настройте environment variables
5. Deploy!

### Render.com

1. Создайте аккаунт на https://render.com
2. Создайте Web Service для backend
3. Создайте Static Site для frontend
4. Добавьте PostgreSQL database
5. Настройте environment variables

### DigitalOcean

1. Создайте Droplet (Ubuntu 22.04)
2. Установите Docker и Docker Compose
3. Клонируйте репозиторий
4. Настройте .env
5. Запустите: `./start.sh`

### AWS EC2

1. Создайте EC2 instance (t2.micro для тестирования)
2. Настройте Security Groups (порты 80, 443, 22)
3. Установите Docker
4. Следуйте инструкциям production деплоя

---

## Мониторинг и логи

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только база данных
docker-compose logs -f postgres
```

### Проверка статуса

```bash
# Статус контейнеров
docker-compose ps

# Использование ресурсов
docker stats
```

### Health checks

Backend имеет встроенный health check endpoint:
```
GET http://localhost:8000/api/health
```

---

## Troubleshooting

### Проблема: База данных не запускается

**Решение:**
```bash
# Проверьте логи
docker-compose logs postgres

# Удалите старый volume и пересоздайте
docker-compose down -v
docker-compose up -d
```

### Проблема: Backend не подключается к БД

**Решение:**
```bash
# Проверьте переменные окружения
docker-compose config

# Убедитесь что postgres готов
docker-compose exec postgres pg_isready
```

### Проблема: Email не отправляются

**Решение для Gmail:**
1. Включите 2FA в Google аккаунте
2. Создайте App Password: https://myaccount.google.com/apppasswords
3. Используйте 16-значный App Password в SMTP_PASSWORD

### Проблема: Frontend не может подключиться к API

**Решение:**
```bash
# Проверьте nginx конфигурацию
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Убедитесь что backend доступен
curl http://localhost:8000/api/health
```

### Проблема: Нехватка памяти

**Решение:**
```bash
# Добавьте swap (Linux)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Или увеличьте RAM сервера
```

---

## Безопасность

### Чеклист для production:

- [ ] Использовать HTTPS (SSL/TLS)
- [ ] Изменить все дефолтные пароли
- [ ] Сгенерировать новый SECRET_KEY
- [ ] Настроить firewall (UFW или iptables)
- [ ] Включить автоматические обновления системы
- [ ] Настроить регулярные бэкапы БД
- [ ] Ограничить доступ к PostgreSQL (только localhost)
- [ ] Использовать environment variables вместо .env в production
- [ ] Настроить rate limiting на API
- [ ] Включить мониторинг и алерты

---

## Дополнительные ресурсы

- [FastAPI документация](https://fastapi.tiangolo.com/)
- [Docker документация](https://docs.docker.com/)
- [PostgreSQL документация](https://www.postgresql.org/docs/)
- [Nginx документация](https://nginx.org/ru/docs/)
- [Google Gemini API](https://ai.google.dev/)

---

## Поддержка

Если возникли проблемы:
1. Проверьте логи: `docker-compose logs`
2. Прочитайте Troubleshooting секцию
3. Создайте issue в GitHub
4. Свяжитесь с командой разработки

---

**Версия документа**: 1.0  
**Дата обновления**: 2026-02-02
