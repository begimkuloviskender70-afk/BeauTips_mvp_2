// ============================================
// Quiz Data Transformation for Backend
// ============================================

/**
 * Mapping of question texts in Russian
 */
const questionTexts = {
    scenario: "Выбери, что ты хочешь сделать?",
    skinConditions: "Что тебя беспокоит в коже сейчас?",
    skinType: "А как твоя кожа обычно ведёт себя?",
    allergy: "Есть ли у тебя аллергия на какие-то компоненты?",
    problemDuration: "Как давно тебя беспокоит эта проблема?",
    budget: "В каком бюджете подбирать средства?",

    // Detailed condition questions
    pigmentationType: "Какой тип пятен тебя беспокоит?",
    sensitivityType: "Как именно реагирует твоя кожа?",
    dehydrationType: "Как проявляется обезвоженность?",
    dullType: "С чем ты связываешь тусклость кожи?",
    inflammationType: "Какие воспаления преобладают?"
};

/**
 * Mapping of answer texts in Russian
 */
const answerTexts = {
    // Scenarios
    scenario: {
        "skin-care": "Подобрать уход для моей кожи",
        "product-compatibility": "Можно ли сочетать эти средства?",
        "routine-analysis": "Разобрать мою косметику",
        "product-guide": "Объясни, как использовать средство"
    },

    // Skin conditions
    skinConditions: {
        "dehydrated": "Обезвоженная — Стягивает, не хватает влаги",
        "sensitive": "Чувствительная — Часто реагирует на уход и погоду",
        "inflammation": "С воспалениями — Прыщи, покраснения или болезненность",
        "pigmentation": "С пигментацией — Пятна, следы от солнца или акне",
        "dull": "Тусклая — Нет сияния, выглядит уставшей"
    },

    // Skin types
    skinType: {
        "oily": "Жирная — кожа быстро блестит, особенно в Т-зоне",
        "dry": "Сухая — часто чувствуется стянутость и сухость",
        "combination": "Комбинированная — жирная в Т-зоне, сухая на щеках",
        "normal": "Нормальная — без сильной сухости и жирного блеска"
    },

    // Allergy
    allergy: {
        "known": "Знаю аллерген — У меня есть реакция на конкретные ингредиенты",
        "unknown": "Бывают реакции — Иногда кожа реагирует, но не знаю на что",
        "none": "Нет аллергий — Кожа нормально переносит уход"
    },

    // Problem duration
    problemDuration: {
        "recent": "Недавно — Меньше месяца назад",
        "long": "Давно — Несколько месяцев или лет",
        "periodic": "Периодически — Проблема то появляется, то уходит"
    },

    // Budget
    budget: {
        "500": "До 500 сом — Бюджетный уход",
        "1000": "До 1000 сом — Средний сегмент",
        "1500": "До 1500 сом — Выше среднего",
        "any": "Бюджет не важен — Подберите лучшее"
    },

    // Detailed conditions
    pigmentationType: {
        "sun": "От солнца — Веснушки или солнечные пятна",
        "acne": "Постакне — Следы от прыщей",
        "age": "Возрастные — Пигментные пятна с возрастом",
        "melasma": "Мелазма — Тёмные пятна на лице"
    },

    sensitivityType: {
        "redness": "Покраснения — Кожа часто краснеет",
        "burning": "Жжение — Чувствую жжение от средств",
        "itching": "Зуд — Кожа часто чешется",
        "tightness": "Стянутость — Ощущение стянутости"
    },

    dehydrationType: {
        "tightness": "Стянутость — Кожа стягивается после умывания",
        "flaking": "Шелушение — Появляются сухие участки",
        "fine-lines": "Мелкие морщинки — Видны линии обезвоженности",
        "dullness": "Тусклость — Кожа выглядит безжизненной"
    },

    dullType: {
        "lack-of-sleep": "Недосып — Мало сплю, кожа выглядит уставшей",
        "dehydration": "Обезвоженность — Не хватает влаги",
        "dead-cells": "Ороговевшие клетки — Нужно отшелушивание",
        "poor-circulation": "Плохое кровообращение — Нет румянца"
    },

    inflammationType: {
        "acne": "Акне — Прыщи и воспаления",
        "comedones": "Комедоны — Чёрные точки",
        "papules": "Папулы — Красные бугорки",
        "pustules": "Пустулы — Гнойные прыщи"
    }
};

/**
 * Transform userAnswers to question-answer format for backend
 * @param {object} userAnswers - Current quiz data
 * @returns {object} Transformed data for API
 */
function transformQuizDataForBackend(userAnswers) {
    const questionsAndAnswers = [];

    // 1. Scenario (already handled separately)
    const scenarioData = {
        question: questionTexts.scenario,
        answer: answerTexts.scenario[userAnswers.scenario] || userAnswers.scenario
    };

    // Only process skin-care scenario for now
    if (userAnswers.scenario === 'skin-care') {
        const skinCareData = userAnswers.scenarioData['skin-care'];

        // 2. Skin Conditions
        if (userAnswers.profile.skinConditions && userAnswers.profile.skinConditions.length > 0) {
            const conditionAnswers = userAnswers.profile.skinConditions.map(condition =>
                answerTexts.skinConditions[condition] || condition
            );

            questionsAndAnswers.push({
                question: questionTexts.skinConditions,
                answers: conditionAnswers
            });

            // 2a. Detailed condition questions
            userAnswers.profile.skinConditions.forEach(condition => {
                if (condition === 'pigmentation' && skinCareData.conditionDetails.pigmentationType) {
                    questionsAndAnswers.push({
                        question: questionTexts.pigmentationType,
                        answer: answerTexts.pigmentationType[skinCareData.conditionDetails.pigmentationType] || skinCareData.conditionDetails.pigmentationType
                    });
                }

                if (condition === 'sensitive' && skinCareData.conditionDetails.sensitivityType) {
                    questionsAndAnswers.push({
                        question: questionTexts.sensitivityType,
                        answer: answerTexts.sensitivityType[skinCareData.conditionDetails.sensitivityType] || skinCareData.conditionDetails.sensitivityType
                    });
                }

                if (condition === 'dehydrated' && skinCareData.conditionDetails.dehydrationSymptoms && skinCareData.conditionDetails.dehydrationSymptoms.length > 0) {
                    const symptoms = skinCareData.conditionDetails.dehydrationSymptoms.map(s =>
                        answerTexts.dehydrationType[s] || s
                    );
                    questionsAndAnswers.push({
                        question: questionTexts.dehydrationType,
                        answers: symptoms
                    });
                }

                if (condition === 'dull' && skinCareData.conditionDetails.dullCauses && skinCareData.conditionDetails.dullCauses.length > 0) {
                    const causes = skinCareData.conditionDetails.dullCauses.map(c =>
                        answerTexts.dullType[c] || c
                    );
                    questionsAndAnswers.push({
                        question: questionTexts.dullType,
                        answers: causes
                    });
                }

                if (condition === 'inflammation' && skinCareData.conditionDetails.inflammationTypes && skinCareData.conditionDetails.inflammationTypes.length > 0) {
                    const types = skinCareData.conditionDetails.inflammationTypes.map(t =>
                        answerTexts.inflammationType[t] || t
                    );
                    questionsAndAnswers.push({
                        question: questionTexts.inflammationType,
                        answers: types
                    });
                }
            });
        }

        // 3. Skin Type
        if (userAnswers.profile.skinType) {
            questionsAndAnswers.push({
                question: questionTexts.skinType,
                answer: answerTexts.skinType[userAnswers.profile.skinType] || userAnswers.profile.skinType
            });
        }

        // 4. Allergy
        if (skinCareData.allergy && skinCareData.allergy.type) {
            let allergyAnswer = answerTexts.allergy[skinCareData.allergy.type] || skinCareData.allergy.type;

            // Add details if known allergy
            if (skinCareData.allergy.type === 'known' && skinCareData.allergy.details) {
                allergyAnswer += ` (${skinCareData.allergy.details})`;
            }

            questionsAndAnswers.push({
                question: questionTexts.allergy,
                answer: allergyAnswer
            });
        }

        // 5. Problem Duration
        if (skinCareData.problemDuration) {
            questionsAndAnswers.push({
                question: questionTexts.problemDuration,
                answer: answerTexts.problemDuration[skinCareData.problemDuration] || skinCareData.problemDuration
            });
        }

        // 6. Budget
        if (skinCareData.budget) {
            questionsAndAnswers.push({
                question: questionTexts.budget,
                answer: answerTexts.budget[skinCareData.budget] || `До ${skinCareData.budget} сом`
            });
        }
    }

    return {
        sessionId: getOrCreateSessionId(),
        scenario: scenarioData,
        questionsAndAnswers: questionsAndAnswers,
        timestamp: new Date().toISOString()
    };
}

/**
 * Save quiz data to backend
 * @param {object} userAnswers - Current quiz data
 */
async function saveQuizToBackend(userAnswers) {
    try {
        // Check authentication
        if (!isAuthenticated()) {
            console.warn('User not authenticated, redirecting to login');
            window.location.href = 'register.html';
            return;
        }

        // Transform data
        const transformedData = transformQuizDataForBackend(userAnswers);

        // Save to backend
        console.log('📤 Sending to backend:', transformedData);
        const response = await saveQuizAnswers(transformedData);

        console.log('✅ Quiz saved to backend:', response);
        return response;

    } catch (error) {
        console.error('❌ Error saving quiz to backend:', error);

        // Detailed error message for the user
        let errorMsg = error.message;
        if (errorMsg.includes('Failed to fetch')) {
            errorMsg = "Не удалось связаться с сервером. Убедитесь, что бэкенд запущен (http://127.0.0.1:8000).";
        } else if (errorMsg.includes('HTTP 401')) {
            errorMsg = "Ваша сессия истекла или вы не авторизованы. Пожалуйста, войдите снова.";
            window.location.href = 'register.html';
        } else if (errorMsg.includes('HTTP 422')) {
            errorMsg = "Ошибка валидации данных (422). Проверьте консоль бэкенда.";
        }

        if (typeof notifications !== 'undefined') {
            notifications.error("Ошибка сохранения в БД: " + errorMsg, 7000);
        } else {
            alert("ОШИБКА СОХРАНЕНИЯ В БД:\n" + errorMsg);
        }
        throw error;
    }
}
