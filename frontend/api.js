// ============================================
// API Configuration
// ============================================
const API_BASE_URL = ''; // Используем пустую строку для относительных путей, если фронтенд и бэкенд на одном порту


// ============================================
// Token Management
// ============================================

/**
 * Get JWT token from localStorage
 */
function getAuthToken() {
    return localStorage.getItem('beautips_token');
}

/**
 * Save JWT token to localStorage
 */
function saveAuthToken(token) {
    localStorage.setItem('beautips_token', token);
}

/**
 * Remove JWT token from localStorage
 */
function removeAuthToken() {
    localStorage.removeItem('beautips_token');
    localStorage.removeItem('beautips_user');
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!getAuthToken();
}

/**
 * Get user data from localStorage
 */
function getCurrentUser() {
    const userJson = localStorage.getItem('beautips_user');
    return userJson ? JSON.parse(userJson) : null;
}

/**
 * Save user data to localStorage
 */
function saveCurrentUser(user) {
    localStorage.setItem('beautips_user', JSON.stringify(user));
}

/**
 * Logout user
 */
function logout() {
    removeAuthToken();
    window.location.href = './register.html?mode=login';
}

// ============================================
// API Request Function
// ============================================

/**
 * Make API request with error handling
 * @param {string} endpoint - API endpoint (e.g., '/api/auth/login')
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Default headers
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    // Add auth token if available
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    try {
        const response = await fetch(url, config);

        // Parse response
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        // Handle errors
        if (!response.ok) {
            // Handle 401 Unauthorized
            if (response.status === 401) {
                removeAuthToken();
                const currentPath = window.location.pathname;
                if (!currentPath.includes('/register.html') && !currentPath.includes('./register.html')) {
                    window.location.href = './register.html?mode=login';
                }
            }

            // Throw error with message from server
            const errorMessage = data.detail || data.message || `HTTP ${response.status}`;
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        // Network error or other issues
        console.error(`❌ API Error for ${url}:`, error);
        if (error.message === 'Failed to fetch') {
            throw new Error('Проблема с подключением к серверу. Убедитесь, что бэкенд запущен.');
        }
        throw error;
    }
}

// ============================================
// Authentication API
// ============================================

/**
 * Register new user
 * @param {object} userData - { email, username, password }
 * @returns {Promise<object>} Registration response
 */
async function register(userData) {
    return await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

/**
 * Login user
 * @param {object} credentials - { email, password }
 * @returns {Promise<object>} Login response with token
 */
async function login(credentials) {
    const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    });

    // Save token and user data
    if (response.access_token) {
        saveAuthToken(response.access_token);
        if (response.user) {
            saveCurrentUser(response.user);
        }
    }

    return response;
}

/**
 * Get current user profile
 * @returns {Promise<object>} User profile data
 */
async function getProfile() {
    return await apiRequest('/api/auth/me', {
        method: 'GET'
    });
}

// ============================================
// Quiz API
// ============================================

/**
 * Save quiz answers to backend
 * @param {object} quizData - Quiz data in question-answer format
 * @returns {Promise<object>} Save response
 */
async function saveQuizAnswers(quizData) {
    return await apiRequest('/api/quiz/save', {
        method: 'POST',
        body: JSON.stringify(quizData)
    });
}

/**
 * Get quiz answers by session ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<object>} Quiz data
 */
async function getQuizAnswers(sessionId) {
    return await apiRequest(`/api/quiz/${sessionId}`, {
        method: 'GET'
    });
}

/**
 * Submit quiz for AI processing
 * @param {string} sessionId - Session ID
 * @returns {Promise<object>} Submit response
 */
async function submitQuizForAI(sessionId) {
    return await apiRequest('/api/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({ sessionId })
    });
}

// ============================================
// UUID Generator
// ============================================

/**
 * Generate UUID v4
 * @returns {string} UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Get or create session ID
 * @returns {string} Session ID
 */
function getOrCreateSessionId() {
    let sessionId = localStorage.getItem('beautips_sessionId');
    if (!sessionId) {
        sessionId = generateUUID();
        localStorage.setItem('beautips_sessionId', sessionId);
    }
    return sessionId;
}

/**
 * Reset session ID to start a new quiz
 */
function resetSessionId() {
    const newSessionId = generateUUID();
    localStorage.setItem('beautips_sessionId', newSessionId);
    return newSessionId;
}
