# Frontend Dockerfile для BeauTips
FROM nginx:alpine

# Копируем все статические файлы
COPY . /usr/share/nginx/html/

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт
EXPOSE 80

# Nginx запустится автоматически
