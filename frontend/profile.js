document.addEventListener('DOMContentLoaded', async () => {

    // 1. Проверяем авторизацию
    if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
        // Если токена нет, сохраняем текущий URL и редиректим на страницу входа
        localStorage.setItem('redirect_after_login', window.location.href);
        window.location.href = './register.html';
        return;
    }

    // 2. Загружаем данные пользователя
    try {
        let userData;
        
        // Пытаемся использовать getProfile из api.js, если доступна
        if (typeof getProfile === 'function') {
            userData = await getProfile();
        } else if (typeof apiRequest === 'function') {
            // Fallback на apiRequest
            userData = await apiRequest('/api/auth/me', {
                method: 'GET'
            });
        } else {
            throw new Error('API functions not available');
        }

        // 3. Отображаем данные
        const nameEl = document.getElementById('profileName');
        const emailEl = document.getElementById('profileEmail');
        const phoneEl = document.getElementById('profilePhone');
        const idEl = document.getElementById('profileId');
        
        if (nameEl) nameEl.textContent = userData.username || 'Пользователь';
        if (emailEl) emailEl.textContent = userData.email || '-';
        if (phoneEl) phoneEl.textContent = userData.phone || 'Не указан';
        if (idEl) idEl.textContent = userData.id || '-';

    } catch (error) {
        console.error('Error loading profile:', error);
        const errorMessage = error.message || 'Ошибка загрузки профиля';
        
        // Не перенаправляем автоматически при ошибке - пусть пользователь сам решит
        const nameEl = document.getElementById('profileName');
        if (nameEl) nameEl.textContent = 'Ошибка загрузки';
        
        if (typeof notifications !== 'undefined') {
            notifications.error(`${errorMessage}. Пожалуйста, войдите снова.`, 6000);
        } else {
            alert(`${errorMessage}. Пожалуйста, войдите снова.`);
        }
        
        // Только если это 401 ошибка, перенаправляем
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            handleLogout();
        }
    }

    // 4. Обработчик выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }

    function handleLogout() {
        console.log('Logout initiated');
        
        // Удаляем токен и данные пользователя
        if (typeof removeAuthToken === 'function') {
            removeAuthToken();
        } else {
            localStorage.removeItem('beautips_token');
            localStorage.removeItem('beautips_user');
        }
        
        // Перенаправляем на страницу входа
        window.location.href = './register.html?mode=login';
    }
});
