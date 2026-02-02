/**
 * Enhanced History Page
 * Улучшенная страница истории с пагинацией, фильтрами и поиском
 */

// ============ State Management ============

const historyState = {
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    sortBy: 'date',
    sortOrder: 'desc',
    scenarioFilter: null,
    searchQuery: null,
    dateFrom: null,
    dateTo: null,
    isLoading: false,
    stats: null
};

// ============ Initialization ============

document.addEventListener('DOMContentLoaded', () => {
    initializeFilters();
    loadHistory();
    loadStats();
});

// ============ Main Functions ============

async function loadHistory() {
    if (historyState.isLoading) return;
    
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const empty = document.getElementById('empty');
    const historyList = document.getElementById('historyList');
    const paginationContainer = document.getElementById('pagination');

    // Reset states
    loading.style.display = 'flex';
    error.style.display = 'none';
    empty.style.display = 'none';
    historyList.style.display = 'none';
    if (paginationContainer) paginationContainer.style.display = 'none';

    historyState.isLoading = true;

    try {
        // Проверка авторизации
        if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
            localStorage.setItem('redirect_after_login', window.location.pathname);
            window.location.href = './register.html';
            return;
        }

        // Построение URL с параметрами
        const params = new URLSearchParams({
            page: historyState.currentPage,
            page_size: historyState.pageSize,
            sort_by: historyState.sortBy,
            sort_order: historyState.sortOrder
        });

        // Добавляем фильтры если есть
        if (historyState.scenarioFilter) {
            params.append('scenario_filter', historyState.scenarioFilter);
        }
        if (historyState.searchQuery) {
            params.append('search', historyState.searchQuery);
        }
        if (historyState.dateFrom) {
            params.append('date_from', historyState.dateFrom);
        }
        if (historyState.dateTo) {
            params.append('date_to', historyState.dateTo);
        }

        // API запрос
        const data = await apiRequest(`/api/history/?${params.toString()}`, {
            method: 'GET'
        });

        loading.style.display = 'none';
        historyState.isLoading = false;

        // Обработка пустого результата
        if (data.pagination.total_items === 0) {
            empty.style.display = 'block';
            updateEmptyMessage();
        } else {
            historyList.style.display = 'block';
            renderHistory(data.items);
            
            // Отображаем пагинацию
            if (data.pagination.total_pages > 1 && paginationContainer) {
                paginationContainer.style.display = 'flex';
                renderPagination(data.pagination);
            }
            
            // Обновляем статистику
            if (data.stats) {
                displayStats(data.stats);
            }
        }

    } catch (err) {
        console.error('Error loading history:', err);
        loading.style.display = 'none';
        error.style.display = 'block';
        historyState.isLoading = false;
        
        const errorMessageEl = document.getElementById('errorMessage');
        if (errorMessageEl) {
            errorMessageEl.textContent = err.message || 'Не удалось загрузить историю. Попробуйте позже.';
        }
    }
}

async function loadStats() {
    try {
        const data = await apiRequest('/api/history/stats', {
            method: 'GET'
        });
        
        if (data.success && data.stats) {
            displayStats(data.stats);
        }
    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

// ============ Rendering Functions ============

function renderHistory(items) {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    items.forEach((item, index) => {
        const card = createHistoryCard(item, index);
        historyList.appendChild(card);
    });
}

function createHistoryCard(item, index) {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.setAttribute('data-session-id', item.session_id);

    const date = new Date(item.created_at);
    const formattedDate = formatDate(date);
    const relativeTime = getRelativeTime(date);

    // Иконка сценария
    const scenarioIcon = getScenarioIcon(item.scenario);

    card.innerHTML = `
        <div class="history-card-header">
            <div class="history-card-badge">
                <span class="scenario-icon">${scenarioIcon}</span>
                <span class="scenario-text">${item.scenario || 'Консультация'}</span>
            </div>
            <div class="history-card-date">
                <span class="date-main">${formattedDate}</span>
                <span class="date-relative">${relativeTime}</span>
            </div>
        </div>
        
        <div class="history-card-body">
            <div class="analysis-preview">
                ${item.analysis_preview || 'Анализ не найден'}
            </div>
            
            <div class="card-meta">
                <div class="meta-item">
                    <span class="meta-icon">🛍️</span>
                    <span class="meta-text">${item.products_count} ${pluralize(item.products_count, 'товар', 'товара', 'товаров')}</span>
                </div>
                ${item.has_recommendations ? 
                    '<span class="badge badge-success">✓ Есть рекомендации</span>' : 
                    '<span class="badge badge-warning">⚠ Без рекомендаций</span>'
                }
            </div>
        </div>
        
        <div class="history-card-footer">
            <button class="btn btn-primary" onclick="viewDetails('${item.session_id}', ${item.id})">
                <span>Подробнее</span>
                <span class="btn-icon">→</span>
            </button>
            <button class="btn btn-secondary btn-icon-only" onclick="shareSession('${item.session_id}')" title="Поделиться">
                <span>📤</span>
            </button>
            <button class="btn btn-danger btn-icon-only" onclick="deleteSession('${item.session_id}')" title="Удалить">
                <span>🗑️</span>
            </button>
        </div>
    `;

    // Анимация появления
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    setTimeout(() => {
        card.style.transition = 'all 0.3s ease-out';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, index * 50);

    return card;
}

function renderPagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    const { page, total_pages, has_prev, has_next } = pagination;

    // Кнопка "Назад"
    const prevBtn = createPaginationButton('«', page - 1, !has_prev);
    paginationContainer.appendChild(prevBtn);

    // Номера страниц
    const pageNumbers = generatePageNumbers(page, total_pages);
    pageNumbers.forEach(pageNum => {
        if (pageNum === '...') {
            const dots = document.createElement('span');
            dots.className = 'pagination-dots';
            dots.textContent = '...';
            paginationContainer.appendChild(dots);
        } else {
            const pageBtn = createPaginationButton(
                pageNum, 
                pageNum, 
                false, 
                pageNum === page
            );
            paginationContainer.appendChild(pageBtn);
        }
    });

    // Кнопка "Вперед"
    const nextBtn = createPaginationButton('»', page + 1, !has_next);
    paginationContainer.appendChild(nextBtn);

    // Информация о текущей странице
    const pageInfo = document.createElement('div');
    pageInfo.className = 'pagination-info';
    pageInfo.textContent = `Страница ${page} из ${total_pages}`;
    paginationContainer.appendChild(pageInfo);
}

function createPaginationButton(text, page, disabled = false, active = false) {
    const btn = document.createElement('button');
    btn.className = `pagination-btn ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`;
    btn.textContent = text;
    btn.disabled = disabled;
    
    if (!disabled) {
        btn.onclick = () => goToPage(page);
    }
    
    return btn;
}

function generatePageNumbers(current, total) {
    const pages = [];
    const delta = 2; // Показывать по 2 страницы с каждой стороны

    if (total <= 7) {
        // Если страниц мало, показываем все
        for (let i = 1; i <= total; i++) {
            pages.push(i);
        }
    } else {
        // Всегда показываем первую страницу
        pages.push(1);

        // Логика показа средних страниц
        if (current > delta + 2) {
            pages.push('...');
        }

        const start = Math.max(2, current - delta);
        const end = Math.min(total - 1, current + delta);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (current < total - delta - 1) {
            pages.push('...');
        }

        // Всегда показываем последнюю страницу
        pages.push(total);
    }

    return pages;
}

// ============ Filters & Search ============

function initializeFilters() {
    // Поиск
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                historyState.searchQuery = e.target.value || null;
                historyState.currentPage = 1;
                loadHistory();
            }, 500); // Debounce 500ms
        });
    }

    // Фильтр по сценарию
    const scenarioSelect = document.getElementById('scenarioFilter');
    if (scenarioSelect) {
        scenarioSelect.addEventListener('change', (e) => {
            historyState.scenarioFilter = e.target.value || null;
            historyState.currentPage = 1;
            loadHistory();
        });
    }

    // Сортировка
    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const [sortBy, sortOrder] = e.target.value.split('-');
            historyState.sortBy = sortBy;
            historyState.sortOrder = sortOrder;
            historyState.currentPage = 1;
            loadHistory();
        });
    }

    // Фильтр по датам
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');
    
    if (dateFromInput) {
        dateFromInput.addEventListener('change', (e) => {
            historyState.dateFrom = e.target.value || null;
            historyState.currentPage = 1;
            loadHistory();
        });
    }
    
    if (dateToInput) {
        dateToInput.addEventListener('change', (e) => {
            historyState.dateTo = e.target.value || null;
            historyState.currentPage = 1;
            loadHistory();
        });
    }

    // Кнопка сброса фильтров
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
}

function resetFilters() {
    historyState.searchQuery = null;
    historyState.scenarioFilter = null;
    historyState.dateFrom = null;
    historyState.dateTo = null;
    historyState.sortBy = 'date';
    historyState.sortOrder = 'desc';
    historyState.currentPage = 1;

    // Сброс UI
    const searchInput = document.getElementById('searchInput');
    const scenarioSelect = document.getElementById('scenarioFilter');
    const sortSelect = document.getElementById('sortBy');
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');

    if (searchInput) searchInput.value = '';
    if (scenarioSelect) scenarioSelect.value = '';
    if (sortSelect) sortSelect.value = 'date-desc';
    if (dateFromInput) dateFromInput.value = '';
    if (dateToInput) dateToInput.value = '';

    loadHistory();
}

// ============ Stats Display ============

function displayStats(stats) {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;

    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${stats.total_quizzes}</div>
            <div class="stat-label">Всего квизов</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.completed_quizzes}</div>
            <div class="stat-label">Завершено</div>
        </div>
        ${stats.most_popular_scenario ? `
            <div class="stat-card">
                <div class="stat-value">${getScenarioIcon(stats.most_popular_scenario)}</div>
                <div class="stat-label">Популярный сценарий</div>
            </div>
        ` : ''}
        ${stats.avg_frequency_days ? `
            <div class="stat-card">
                <div class="stat-value">${stats.avg_frequency_days} дн</div>
                <div class="stat-label">Частота квизов</div>
            </div>
        ` : ''}
    `;

    statsContainer.style.display = 'grid';
}

// ============ Actions ============

function goToPage(page) {
    historyState.currentPage = page;
    loadHistory();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function viewDetails(sessionId, recommendationId = null) {
    let url = `./results.html?session=${sessionId}`;
    if (recommendationId) {
        url += `&recommendation_id=${recommendationId}`;
    }
    window.location.href = url;
}

async function deleteSession(sessionId) {
    if (!confirm('Вы уверены, что хотите удалить эту сессию? Это действие нельзя отменить.')) {
        return;
    }

    try {
        await apiRequest(`/api/history/${sessionId}`, {
            method: 'DELETE'
        });

        // Показываем успех
        showToast('Сессия успешно удалена', 'success');

        // Перезагружаем список
        loadHistory();
        loadStats();

    } catch (err) {
        console.error('Error deleting session:', err);
        showToast('Не удалось удалить сессию', 'error');
    }
}

function shareSession(sessionId) {
    const url = `${window.location.origin}/results.html?session=${sessionId}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'BeauTips - Мои рекомендации',
            text: 'Посмотри мои рекомендации по уходу за кожей',
            url: url
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: копируем в буфер обмена
        navigator.clipboard.writeText(url).then(() => {
            showToast('Ссылка скопирована в буфер обмена', 'success');
        }).catch(err => {
            console.error('Error copying:', err);
            showToast('Не удалось скопировать ссылку', 'error');
        });
    }
}

async function exportToCSV() {
    try {
        const response = await fetch('/api/history/export/csv', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `beautips_history_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        showToast('История экспортирована', 'success');

    } catch (err) {
        console.error('Error exporting:', err);
        showToast('Не удалось экспортировать историю', 'error');
    }
}

// ============ Helper Functions ============

function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day}.${month}.${year} в ${hours}:${minutes}`;
}

function getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед назад`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} мес назад`;
    return `${Math.floor(diffDays / 365)} г назад`;
}

function getScenarioIcon(scenario) {
    const icons = {
        'Подобрать уход для моей кожи': '✨',
        'Можно ли сочетать эти средства?': '🔬',
        'Разобрать мою косметику': '🔍',
        'Объясни, как использовать средство': '📖'
    };
    
    return icons[scenario] || '💡';
}

function pluralize(count, one, few, many) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
}

function updateEmptyMessage() {
    const empty = document.getElementById('empty');
    if (!empty) return;

    // Проверяем, активны ли фильтры
    const hasFilters = historyState.searchQuery || 
                      historyState.scenarioFilter || 
                      historyState.dateFrom || 
                      historyState.dateTo;

    if (hasFilters) {
        empty.innerHTML = `
            <div class="empty-icon">🔍</div>
            <h2>Ничего не найдено</h2>
            <p>Попробуйте изменить фильтры или сбросить их</p>
            <button onclick="resetFilters()" class="btn btn-primary">Сбросить фильтры</button>
        `;
    } else {
        empty.innerHTML = `
            <div class="empty-icon">📋</div>
            <h2>Пока нет истории</h2>
            <p>Пройдите квиз, чтобы получить первые рекомендации</p>
            <a href="./chat.html" class="btn btn-primary">Пройти квиз</a>
        `;
    }
}

function showToast(message, type = 'info') {
    // Простая реализация toast уведомлений
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideInUp 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutDown 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Экспорт функций для глобального использования
window.viewDetails = viewDetails;
window.deleteSession = deleteSession;
window.shareSession = shareSession;
window.exportToCSV = exportToCSV;
window.resetFilters = resetFilters;
window.goToPage = goToPage;