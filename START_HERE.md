# 🚀 BeauTips - Быстрый старт для деплоя

## 📦 Содержимое пакета

Вы получили готовый к деплою проект **BeauTips** - полнофункциональное веб-приложение для косметического теста с AI.

### Что входит в пакет:

✅ Backend (FastAPI + PostgreSQL + Google Gemini AI)
✅ Frontend (HTML/CSS/JS + Nginx)
✅ Docker конфигурация
✅ Production-ready настройки
✅ CI/CD конфигурация (GitHub Actions)
✅ Полная документация

---

## ⚡ Запуск за 3 минуты

### Шаг 1: Подготовка

```bash
# Установите Docker (если еще не установлен)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установите Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Шаг 2: Настройка

```bash
# Создайте .env файл
cp .env.example .env

# Отредактируйте .env (ОБЯЗАТЕЛЬНО!)
nano .env
```

**Минимальные настройки для запуска:**

```env
# Придумайте надежные пароли
POSTGRES_PASSWORD=ваш_пароль_для_БД
SECRET_KEY=$(openssl rand -hex 32)

# Получите на https://aistudio.google.com/app/apikey
GOOGLE_API_KEY=ваш_gemini_api_key

# Для Gmail создайте App Password на https://myaccount.google.com/apppasswords
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=ваш_app_password
FROM_EMAIL=your-email@gmail.com
```

### Шаг 3: Запуск

```bash
# Автоматический запуск
./start.sh

# Или используйте Makefile
make install
```

**Готово!** Приложение запущено на:
- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📚 Дополнительная документация

| Документ | Описание |
|----------|----------|
| **DEPLOYMENT.md** | Полное руководство по деплою для всех платформ |
| **DEPLOYMENT_CHECKLIST.md** | Чеклист для проверки деплоя |
| **README_DEPLOY.md** | Подробная техническая документация |
| **QUICK_START.md** | Руководство для разработчиков |

---

## 🛠 Полезные команды

```bash
# Просмотр логов
docker-compose logs -f

# Статус контейнеров
docker-compose ps

# Остановка
./stop.sh
# или
make down

# Перезапуск
make restart

# Бэкап БД
make backup-db

# Production с HTTPS
make prod-up
```

---

## 🎯 Production деплой

### Railway.app (самый простой)
1. Создайте аккаунт на https://railway.app
2. Подключите GitHub репозиторий
3. Добавьте PostgreSQL из Marketplace
4. Добавьте environment variables из .env
5. Deploy!

### DigitalOcean / AWS / VPS
1. Клонируйте проект на сервер
2. Настройте .env
3. Запустите: `./start.sh`
4. Для HTTPS: `make prod-up`

**Подробности**: см. DEPLOYMENT.md

---

## 🔧 Настройка HTTPS (Production)

```bash
# 1. Настройте домен в .env
echo "DOMAIN=yourdomain.com" >> .env
echo "LETSENCRYPT_EMAIL=admin@yourdomain.com" >> .env

# 2. Запустите с HTTPS
make prod-up
```

Let's Encrypt сертификат установится автоматически!

---

## ❓ Часто возникающие вопросы

### Backend не запускается?
```bash
# Проверьте логи
docker-compose logs backend

# Убедитесь что все переменные в .env заполнены
```

### Email не отправляются?
Для Gmail:
1. Включите 2FA в Google аккаунте
2. Создайте App Password: https://myaccount.google.com/apppasswords
3. Используйте 16-значный App Password в `SMTP_PASSWORD`

### База данных не подключается?
```bash
# Проверьте PostgreSQL
docker-compose logs postgres

# Пересоздайте контейнеры
docker-compose down -v
docker-compose up -d
```

---

## 📊 Структура проекта

```
fmp-website/
├── backend/              # FastAPI приложение
├── frontend/             # Статические файлы
├── .github/workflows/    # CI/CD
├── docker-compose.yml    # Docker конфигурация
├── .env.example          # Пример настроек
├── start.sh              # Скрипт запуска
└── *.md                  # Документация
```

---

## 🔒 Безопасность

Перед production деплоем:
- ✅ Смените все дефолтные пароли
- ✅ Сгенерируйте новый SECRET_KEY
- ✅ Включите HTTPS
- ✅ Настройте Firewall
- ✅ Регулярные бэкапы БД

**Полный чеклист**: см. DEPLOYMENT_CHECKLIST.md

---

## 💡 Технологии

- **Backend**: FastAPI, PostgreSQL, Google Gemini AI
- **Frontend**: HTML5, CSS3, JavaScript
- **DevOps**: Docker, Nginx, Let's Encrypt
- **CI/CD**: GitHub Actions

---

## 📞 Поддержка

- 📧 Email: support@beautips.com
- 📚 Документация: см. папку проекта
- 🐛 Issues: создайте issue в GitHub

---

## ✅ Следующие шаги

1. [ ] Настройте .env файл
2. [ ] Запустите приложение: `./start.sh`
3. [ ] Проверьте работу: http://localhost
4. [ ] Прочитайте DEPLOYMENT.md для production
5. [ ] Настройте HTTPS с помощью `make prod-up`

---

**Удачного деплоя! 🚀**

Версия: 2.0.0 | Дата: 2026-02-02
