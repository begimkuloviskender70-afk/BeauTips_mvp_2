// Results page - Display AI recommendations from history

document.addEventListener('DOMContentLoaded', () => {
    // Принудительно скрываем экран загрузки при загрузке страницы
    const loading = document.getElementById('loading-state');
    if (loading) {
        loading.style.display = 'none';
        console.log('🔒 Экран загрузки скрыт при инициализации');
    }
    
    loadResults();
});

async function loadResults() {
    // Get session ID and recommendation ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    const recommendationId = urlParams.get('recommendation_id');

    if (!sessionId) {
        showError('Не указан ID сессии');
        return;
    }

    try {
        // Проверяем авторизацию
        if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
            localStorage.setItem('redirect_after_login', window.location.pathname + window.location.search);
            window.location.href = './register.html';
            return;
        }

        // Сначала проверяем, есть ли уже рекомендации в истории (БЕЗ показа загрузки)
        let data;
        let recommendationsReady = false;
        
        try {
            // Формируем URL с recommendation_id если он указан
            let apiUrl = `/api/history/${sessionId}`;
            if (recommendationId) {
                apiUrl += `?recommendation_id=${recommendationId}`;
            }
            
            data = await apiRequest(apiUrl, {
                method: 'GET'
            });
            
            console.log('📋 Данные сессии получены:', data);
            
            // Проверяем, есть ли рекомендации (может быть null, пустой объект или объект с данными)
            // Проверяем наличие ключевых полей: analysis, products, routine и т.д.
            const hasRecommendations = data.recommendations && 
                                      data.recommendations !== null && 
                                      typeof data.recommendations === 'object' &&
                                      (
                                          Object.keys(data.recommendations).length > 0 &&
                                          (
                                              data.recommendations.analysis ||
                                              (data.recommendations.products && Array.isArray(data.recommendations.products) && data.recommendations.products.length > 0) ||
                                              data.recommendations.routine ||
                                              (data.recommendations.key_ingredients && Array.isArray(data.recommendations.key_ingredients) && data.recommendations.key_ingredients.length > 0)
                                          )
                                      );
            
            console.log('📊 Проверка рекомендаций:', {
                hasRecommendations,
                recommendations: data.recommendations,
                keys: data.recommendations ? Object.keys(data.recommendations) : null
            });
            
            if (hasRecommendations) {
                // Если рекомендации уже есть - сразу показываем их, без экрана загрузки
                console.log('🚀 Показываем результаты сразу, без загрузки');
                displayResults(data.recommendations);
                return; // Выходим, не показывая экран загрузки
            } else {
                console.log('⚠️ Рекомендаций нет, будет показан экран загрузки');
                throw new Error('Рекомендаций еще нет');
            }
        } catch (historyErr) {
            console.log('📤 Ошибка при получении истории:', historyErr.message);
            
            // Если ошибка 404 или 500, но сессия может быть в списке истории - пробуем через список
            if (historyErr.message.includes('404') || historyErr.message.includes('500') || historyErr.message.includes('Failed') || historyErr.message.includes('not found')) {
                console.log('🔄 Пробуем найти сессию через список истории...');
                try {
                    // Пробуем получить через список истории
                    const historyList = await apiRequest('/api/history/?page=1&page_size=100', {
                        method: 'GET'
                    });
                    
                    console.log('📋 Список истории получен, ищем сессию:', sessionId);
                    
                    // Ищем нужную сессию в списке
                    const foundSession = historyList.items?.find(item => item.session_id === sessionId);
                    
                    if (foundSession) {
                        console.log('✅ Сессия найдена в списке!', foundSession);
                        
                        if (foundSession.has_recommendations) {
                            console.log('✅ У сессии есть рекомендации, пробуем загрузить детали...');
                            // Пробуем ещё раз получить детали
                            try {
                                data = await apiRequest(`/api/history/${sessionId}`, {
                                    method: 'GET'
                                });
                                if (data.recommendations && Object.keys(data.recommendations).length > 0) {
                                    console.log('✅ Рекомендации загружены из детального endpoint');
                                    displayResults(data.recommendations);
                                    return;
                                }
                            } catch (retryErr) {
                                console.log('⚠️ Повторная попытка не удалась:', retryErr.message);
                                // Если детальный endpoint не работает, но сессия есть - показываем сообщение
                                showError('Рекомендации для этой сессии не найдены. Возможно, они ещё не были сгенерированы.');
                                return;
                            }
                        } else {
                            console.log('⚠️ У сессии нет рекомендаций');
                            throw new Error('Рекомендаций еще нет');
                        }
                    } else {
                        console.log('⚠️ Сессия не найдена в списке истории');
                        throw historyErr; // Пробрасываем оригинальную ошибку
                    }
                } catch (listErr) {
                    console.log('⚠️ Не удалось получить список истории:', listErr.message);
                    throw historyErr; // Пробрасываем оригинальную ошибку
                }
            }
            // Только если рекомендаций нет - показываем экран загрузки
            startProgressAnimation();
            // Если рекомендаций еще нет, отправляем на AI
            console.log('📤 Рекомендаций еще нет, отправляем на AI...');
            updateProgressBar(20, 'Отправляем данные на обработку...');
            
            // Проверяем, что функция доступна
            if (typeof submitQuizForAI === 'function') {
                // Отправляем на AI асинхронно (не ждем завершения)
                submitQuizForAI(sessionId).catch(err => {
                    console.error('Ошибка отправки на AI:', err);
                });
                
                updateProgressBar(30, 'Анализируем ваши ответы...');
                
                // Polling: проверяем наличие рекомендаций каждые 2 секунды
                let attempts = 0;
                const maxAttempts = 60; // Максимум 60 попыток (около 2 минут)
                
                while (attempts < maxAttempts && !recommendationsReady) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Обновляем прогресс-бар постепенно (от 30% до 90%)
                    const progressStep = 30 + Math.min((attempts / maxAttempts) * 60, 60);
                    const messages = [
                        { progress: 40, text: 'Определяем тип кожи...' },
                        { progress: 55, text: 'Подбираем ингредиенты...' },
                        { progress: 70, text: 'Формируем рутину...' },
                        { progress: 85, text: 'Завершаем рекомендации...' }
                    ];
                    
                    const messageIndex = Math.min(Math.floor(attempts / (maxAttempts / 4)), messages.length - 1);
                    updateProgressBar(progressStep, messages[messageIndex].text);
                    
                    try {
                        data = await apiRequest(`/api/history/${sessionId}`, {
                            method: 'GET'
                        });
                        
                        if (data.recommendations && Object.keys(data.recommendations).length > 0) {
                            recommendationsReady = true;
                            break; // Рекомендации готовы
                        }
                    } catch (err) {
                        // Продолжаем ждать, если ошибка 404 (еще не готово)
                        if (err.message && !err.message.includes('404')) {
                            console.error('Ошибка при проверке статуса:', err);
                        }
                    }
                    
                    attempts++;
                }
            } else {
                throw new Error('Функция submitQuizForAI недоступна');
            }
        }

        if (!recommendationsReady) {
            throw new Error('Рекомендации не были сгенерированы. Попробуйте еще раз.');
        }

        // Завершаем прогресс-бар до 100%
        completeProgressBar();

        // Небольшая задержка для плавного перехода
        setTimeout(() => {
            displayResults(data.recommendations);
        }, 800);

    } catch (err) {
        console.error('Error loading results:', err);
        
        // Скрываем экран загрузки при ошибке
        const loading = document.getElementById('loading-state');
        if (loading) {
            loading.style.display = 'none';
        }
        
        // Завершаем прогресс-бар только если он был запущен
        if (currentProgressValue > 0) {
            completeProgressBar();
        }
        
        showError('Не удалось загрузить результаты: ' + (err.message || 'Неизвестная ошибка'));
    }
}

// Прогресс-бар анимация (привязана к реальному статусу)
let progressAnimationInterval = null;
let currentProgressValue = 0;

function startProgressAnimation() {
    // Показываем экран загрузки
    const loading = document.getElementById('loading-state');
    if (loading) {
        loading.style.display = 'block';
    }
    
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressMessage = document.getElementById('progressMessage');
    
    if (!progressFill || !progressText || !progressMessage) return;

    currentProgressValue = 0;
    
    // Плавная анимация прогресса до 90% (не показываем 100% пока не готово)
    const animateProgress = () => {
        if (currentProgressValue < 90) {
            currentProgressValue += 0.3;
            progressFill.style.width = `${currentProgressValue}%`;
            progressText.textContent = `${Math.floor(currentProgressValue)}%`;
            requestAnimationFrame(animateProgress);
        } else {
            // Достигли 90%, останавливаем анимацию
            currentProgressValue = 90;
            progressFill.style.width = '90%';
            progressText.textContent = '90%';
        }
    };

    // Начинаем с базового прогресса
    progressMessage.textContent = 'Анализируем ваши ответы...';
    animateProgress();
}

function updateProgressBar(progress, message) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressMessage = document.getElementById('progressMessage');
    
    if (!progressFill || !progressText || !progressMessage) return;

    // Обновляем прогресс плавно
    const targetProgress = Math.min(progress, 95); // Максимум 95% пока не готово
    
    const animateToTarget = () => {
        if (currentProgressValue < targetProgress) {
            currentProgressValue += 1;
            progressFill.style.width = `${currentProgressValue}%`;
            progressText.textContent = `${Math.floor(currentProgressValue)}%`;
            requestAnimationFrame(animateToTarget);
        } else {
            currentProgressValue = targetProgress;
            progressFill.style.width = `${targetProgress}%`;
            progressText.textContent = `${Math.floor(targetProgress)}%`;
        }
    };
    
    progressMessage.textContent = message;
    animateToTarget();
}

function completeProgressBar() {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressMessage = document.getElementById('progressMessage');
    
    if (!progressFill || !progressText || !progressMessage) return;

    // Плавно доводим до 100%
    const animateToComplete = () => {
        if (currentProgressValue < 100) {
            currentProgressValue += 2;
            progressFill.style.width = `${currentProgressValue}%`;
            progressText.textContent = `${Math.floor(currentProgressValue)}%`;
            requestAnimationFrame(animateToComplete);
        } else {
            currentProgressValue = 100;
            progressFill.style.width = '100%';
            progressText.textContent = '100%';
            progressMessage.textContent = 'Готово!';
        }
    };
    
    animateToComplete();
}

// Удалена функция completeProgress, теперь используется completeProgressBar

function displayResults(recommendations) {
    console.log('📊 Отображение результатов:', recommendations);
    
    const container = document.getElementById('ai-results-container');
    const loading = document.getElementById('loading-state');

    // Скрываем экран загрузки, если он был показан
    if (loading) {
        loading.style.display = 'none';
        console.log('✅ Экран загрузки скрыт');
    }

    // Use existing AI results rendering from script_chat.js structure
    const resultsHTML = `
    <div class="ai-results-wrapper">
      <div class="ai-results-header">
        <h1>Ваши результаты анализа кожи</h1>
        <a href="./history.html" class="back-to-history-btn">← Назад к истории</a>
      </div>

      <!-- Analysis Section -->
      <div class="ai-section">
        <h2 class="ai-section-title">📋 Анализ</h2>
        <p class="ai-analysis-text">${recommendations.analysis || 'Нет анализа'}</p>
      </div>

      <!-- Key Ingredients Section -->
      ${recommendations.key_ingredients && recommendations.key_ingredients.length > 0 ? `
      <div class="ai-section">
        <h2 class="ai-section-title">🧪 Ключевые ингредиенты</h2>
        <ul class="ai-ingredients-list">
          ${recommendations.key_ingredients.map(ing => `<li>${ing}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      <!-- Products Section -->
      ${recommendations.products && recommendations.products.length > 0 ? `
      <div class="ai-section">
        <h2 class="ai-section-title">🛍️ Рекомендованные продукты</h2>
        <div class="ai-products-grid">
          ${recommendations.products.map(product => `
            <div class="ai-product-card">
              <h3 class="product-name">${product.name || 'Без названия'}</h3>
              ${product.brand ? `<p class="product-brand">${product.brand}</p>` : ''}
              <p class="product-reason">${product.reason || ''}</p>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Routine Section -->
      ${recommendations.routine ? `
      <div class="ai-section">
        <h2 class="ai-section-title">🌅 Утренняя рутина</h2>
        <ol class="ai-routine-list">
          ${(recommendations.routine.morning || []).map(step => `<li>${step}</li>`).join('')}
        </ol>

        <h2 class="ai-section-title">🌙 Вечерняя рутина</h2>
        <ol class="ai-routine-list">
          ${(recommendations.routine.evening || []).map(step => `<li>${step}</li>`).join('')}
        </ol>
      </div>
      ` : ''}

      <!-- Lifestyle Tips Section -->
      ${recommendations.lifestyle_tips && recommendations.lifestyle_tips.length > 0 ? `
      <div class="ai-section">
        <h2 class="ai-section-title">💡 Советы по образу жизни</h2>
        <ul class="ai-tips-list">
          ${recommendations.lifestyle_tips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      <!-- Disclaimer -->
      ${recommendations.disclaimer ? `
      <div class="ai-disclaimer">
        <p>${recommendations.disclaimer}</p>
      </div>
      ` : ''}

      <!-- Actions -->
      <div class="ai-actions">
        <a href="./chat.html" class="ai-btn ai-btn-primary">Пройти новый анализ</a>
        <a href="./history.html" class="ai-btn ai-btn-secondary">Вернуться к истории</a>
      </div>
    </div>
  `;

    container.innerHTML = resultsHTML;
}

function showError(message) {
    const container = document.getElementById('ai-results-container');
    container.innerHTML = `
    <div class="error-container">
      <h2>Ошибка</h2>
      <p>${message}</p>
      <a href="./history.html" class="back-btn">← Назад к истории</a>
    </div>
  `;
}
