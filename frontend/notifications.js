/**
 * Красивая система уведомлений для BeauTips
 * Заменяет стандартные alert() на современные toast-уведомления
 */

class NotificationManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Создаём контейнер для уведомлений
        if (!document.getElementById('notifications-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notifications-container';
            this.container.className = 'notifications-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notifications-container');
        }
    }

    /**
     * Показать уведомление
     * @param {string} message - Текст сообщения
     * @param {string} type - Тип: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Длительность в миллисекундах (по умолчанию 5000)
     */
    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Иконки для разных типов
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        // Цвета для разных типов
        const colors = {
            success: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            error: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            warning: 'linear-gradient(135deg, #fad961 0%, #f76b1c 100%)',
            info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type] || icons.info}</span>
                <span class="notification-message">${this.escapeHtml(message)}</span>
                <button class="notification-close" aria-label="Закрыть">×</button>
            </div>
            <div class="notification-progress"></div>
        `;

        // Устанавливаем цвет градиента
        notification.style.background = colors[type] || colors.info;

        // Добавляем в контейнер
        this.container.appendChild(notification);

        // Анимация появления
        setTimeout(() => {
            notification.classList.add('notification-show');
        }, 10);

        // Автоматическое закрытие
        let timeoutId;
        if (duration > 0) {
            timeoutId = setTimeout(() => {
                this.close(notification);
            }, duration);

            // Останавливаем таймер при наведении
            notification.addEventListener('mouseenter', () => {
                clearTimeout(timeoutId);
            });

            // Возобновляем таймер при уходе мыши
            notification.addEventListener('mouseleave', () => {
                timeoutId = setTimeout(() => {
                    this.close(notification);
                }, duration);
            });
        }

        // Закрытие по клику на кнопку
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(timeoutId);
            this.close(notification);
        });

        // Закрытие по клику на само уведомление (опционально)
        notification.addEventListener('click', (e) => {
            if (e.target === notification || e.target.classList.contains('notification-message')) {
                clearTimeout(timeoutId);
                this.close(notification);
            }
        });
    }

    /**
     * Закрыть уведомление
     */
    close(notification) {
        notification.classList.add('notification-hide');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    /**
     * Экранирование HTML для безопасности
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Удобные методы для разных типов
    success(message, duration = 5000) {
        this.show(message, 'success', duration);
    }

    error(message, duration = 6000) {
        this.show(message, 'error', duration);
    }

    warning(message, duration = 5000) {
        this.show(message, 'warning', duration);
    }

    info(message, duration = 4000) {
        this.show(message, 'info', duration);
    }
}

// Создаём глобальный экземпляр
const notifications = new NotificationManager();

// Экспортируем для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = notifications;
}

