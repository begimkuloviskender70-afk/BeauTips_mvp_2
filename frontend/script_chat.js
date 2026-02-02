document.addEventListener("DOMContentLoaded", () => {
  // 🔍 ДИАГНОСТИКА: Изменим фон на миг, чтобы понять, что скрипт ЖИВ
  document.body.style.backgroundColor = "#e0e0ff";
  setTimeout(() => { document.body.style.backgroundColor = ""; }, 200);
  console.log("🚀 BeauTips Chat Script Start");

  // 🆕 Создаем новый session ID для каждого прохождения квиза
  if (typeof resetSessionId === 'function') {
    const newSessionId = resetSessionId();
    console.log("🆕 Создан новый session ID:", newSessionId);
  }

  try {
    // ===============================
    // ✅ 1) ПОЛНЫЙ СБРОС ВИЗУАЛЬНОГО СОСТОЯНИЯ
    // ===============================
    document.querySelectorAll(".selected").forEach((el) => el.classList.remove("selected"));

    // ===============================
    // ✅ 2) СОСТОЯНИЕ/ДАННЫЕ
    // ===============================
    let currentStep = 0;
    let selectedAction = null;
    let isInitialLoad = true; // Флаг для первой загрузки

    // ✅ Структура данных пользователя для ИИ
    const userAnswers = {
      scenario: null,
      profile: {
        skinConditions: [],
        skinType: null
      },
      scenarioData: {
        "skin-care": {
          allergy: {
            type: null,
            details: ""
          },
          problemDuration: null,
          budget: null, // ✅ НОВОЕ ПОЛЕ
          conditionDetails: {
            pigmentationType: null,
            sensitivityType: null,
            dehydrationSymptoms: [],
            dullCauses: [],
            inflammationTypes: []
          }
        },
        "product-compatibility": {
          products: [],
          notes: ""
        },
        "routine-analysis": {
          products: [],
          routineType: null,
          notes: ""
        },
        "product-guide": {
          productName: "",
          productBrand: "",
          productPhoto: null,
          notes: ""
        }
      },
      timestamp: null
    };

    // ✅ Улучшение: объединяем все тексты помощника в одну структуру
    const stepsData = {
      0: { chatText: "Выбери, что ты хочешь сделать?" },
      1: { chatText: "Что тебя беспокоит в коже сейчас?" },
      "dehydrated": { chatText: "Как проявляется обезвоженность?" },
      "sensitive": { chatText: "Как именно реагирует твоя кожа?" },
      "pigmentation": { chatText: "Какой тип пятен тебя беспокоит?" },
      "dull": { chatText: "С чем ты связываешь тусклость кожи?" },
      "inflammation": { chatText: "Какие воспаления преобладают?" },
      2: { chatText: "А как твоя кожа обычно ведёт себя?" },
      3: { chatText: "Есть ли у тебя аллергия на какие-то компоненты?" },
      4: { chatText: "Как давно тебя беспокоит эта проблема?" },
      5: { chatText: "В каком бюджете подбирать средства?" },
      "results": { chatText: "Готово! Вот мои рекомендации для тебя 💜" }
    };

    // ===============================
    // ✅ 3) DOM ЭЛЕМЕНТЫ
    // ===============================
    const step0 = document.getElementById("step0");
    const step1 = document.getElementById("step1");
    const stepPigmentationType = document.getElementById("stepPigmentationType");
    const stepSensitivityType = document.getElementById("stepSensitivityType");
    const stepDehydrationType = document.getElementById("stepDehydrationType");
    const stepDullType = document.getElementById("stepDullType");
    const stepInflammationType = document.getElementById("stepInflammationType");
    const step2 = document.getElementById("step2");
    const stepAllergy = document.getElementById("stepAllergy");
    const stepDuration = document.getElementById("stepDuration");
    const stepBudget = document.getElementById("stepBudget");
    const stepResults = document.getElementById("stepResults"); // ✅ НОВЫЙ ЭЛЕМЕНТ
    const allergyInput = document.getElementById("allergyInput");
    const allergyTextarea = document.querySelector(".allergy-textarea");

    const chatHelper = document.getElementById("chatHelper");
    const chatText = document.getElementById("chatText");
    const backBtn = document.getElementById("backBtn");
    const nextBtn = document.getElementById("nextBtn");

    // ===============================
    // ✅ 4) ФУНКЦИИ СОХРАНЕНИЯ
    // ===============================

    async function saveToBackend() {
      try {
        userAnswers.timestamp = new Date().toISOString();

        // Отправляем только на сервер
        await saveQuizToBackend(userAnswers);

        console.log("💾 Сохранено на сервер:", userAnswers);
      } catch (e) {
        console.warn("⚠️ Не удалось сохранить данные на сервер:", e);
      }
    }

    function loadFromStorage() {
      try {
        const raw = localStorage.getItem("beautips_userAnswers");
        if (!raw) return;

        const data = JSON.parse(raw);

        // ✅ Улучшение: более безопасная проверка структуры данных
        if (!data || typeof data !== 'object') return;

        // Восстанавливаем только валидные данные
        if (data.scenario && typeof data.scenario === 'string') {
          userAnswers.scenario = data.scenario;
          selectedAction = data.scenario;
        }

        if (data.profile && typeof data.profile === 'object') {
          if (Array.isArray(data.profile.skinConditions)) {
            userAnswers.profile.skinConditions = data.profile.skinConditions.filter(item =>
              typeof item === 'string'
            );
          }
          if (data.profile.skinType && typeof data.profile.skinType === 'string') {
            userAnswers.profile.skinType = data.profile.skinType;
          }
        }

        if (data.scenarioData && typeof data.scenarioData === 'object') {
          // ✅ Улучшение: безопасное копирование данных для каждого сценария
          Object.keys(userAnswers.scenarioData).forEach(key => {
            if (data.scenarioData[key]) {
              // Для skin-care восстанавливаем с проверкой вложенных структур
              if (key === "skin-care" && data.scenarioData[key]) {
                const sc = data.scenarioData[key];

                if (sc.allergy && typeof sc.allergy === 'object') {
                  if (sc.allergy.type && typeof sc.allergy.type === 'string') {
                    userAnswers.scenarioData[key].allergy.type = sc.allergy.type;
                  }
                  if (typeof sc.allergy.details === 'string') {
                    userAnswers.scenarioData[key].allergy.details = sc.allergy.details;
                  }
                }

                if (sc.problemDuration && typeof sc.problemDuration === 'string') {
                  userAnswers.scenarioData[key].problemDuration = sc.problemDuration;
                }

                // ✅ НОВОЕ: восстановление бюджета
                if (sc.budget && typeof sc.budget === 'string') {
                  userAnswers.scenarioData[key].budget = sc.budget;
                }

                if (sc.conditionDetails && typeof sc.conditionDetails === 'object') {
                  const cd = sc.conditionDetails;
                  const targetCd = userAnswers.scenarioData[key].conditionDetails;

                  if (cd.pigmentationType && typeof cd.pigmentationType === 'string') {
                    targetCd.pigmentationType = cd.pigmentationType;
                  }
                  if (cd.sensitivityType && typeof cd.sensitivityType === 'string') {
                    targetCd.sensitivityType = cd.sensitivityType;
                  }
                  if (Array.isArray(cd.dehydrationSymptoms)) {
                    targetCd.dehydrationSymptoms = cd.dehydrationSymptoms.filter(item =>
                      typeof item === 'string'
                    );
                  }
                  if (Array.isArray(cd.dullCauses)) {
                    targetCd.dullCauses = cd.dullCauses.filter(item =>
                      typeof item === 'string'
                    );
                  }
                  if (Array.isArray(cd.inflammationTypes)) {
                    targetCd.inflammationTypes = cd.inflammationTypes.filter(item =>
                      typeof item === 'string'
                    );
                  }
                }
              }

              // Для других сценариев просто сохраняем, если структура совпадает
              if (key !== "skin-care") {
                Object.keys(userAnswers.scenarioData[key]).forEach(subKey => {
                  if (data.scenarioData[key][subKey] !== undefined) {
                    userAnswers.scenarioData[key][subKey] = data.scenarioData[key][subKey];
                  }
                });
              }
            }
          });
        }

        if (data.timestamp) {
          userAnswers.timestamp = data.timestamp;
        }
      } catch (e) {
        console.warn("⚠️ Ошибка загрузки данных, сбрасываем:", e);
        clearAllData();
      }
    }

    function restoreUIFromAnswers() {
      // Восстановить выбранный сценарий (шаг 0)
      if (userAnswers.scenario) {
        document.querySelectorAll(".menu-item").forEach((item) => {
          if (item.getAttribute("data-action") === userAnswers.scenario) {
            item.classList.add("selected");
          }
        });
      }

      // Восстановить состояния кожи (шаг 1)
      if (Array.isArray(userAnswers.profile.skinConditions)) {
        userAnswers.profile.skinConditions.forEach((val) => {
          const el = document.querySelector(`#step1 .skin-card[data-value="${val}"]`);
          if (el) el.classList.add("selected");
        });
      }

      // ✅ Исправление: правильный селектор для типа кожи (шаг 2)
      if (userAnswers.profile.skinType && step2) {
        const opt = step2.querySelector(`.option-item[data-value="${userAnswers.profile.skinType}"], .skin-card[data-value="${userAnswers.profile.skinType}"]`);
        if (opt) opt.classList.add("selected");
      }

      // Восстановить аллергию (шаг 3)
      const allergyData = userAnswers.scenarioData["skin-care"].allergy;
      if (allergyData.type) {
        const allergyCard = document.querySelector(`#stepAllergy .skin-card[data-value="${allergyData.type}"]`);
        if (allergyCard) {
          allergyCard.classList.add("selected");
        }
        if (allergyData.type === "known" && allergyInput) {
          allergyInput.classList.remove("hidden");
        }
      }
      if (allergyData.details && allergyTextarea) {
        allergyTextarea.value = allergyData.details;
      }

      // Восстановить длительность проблемы (шаг 4)
      const durationValue = userAnswers.scenarioData["skin-care"].problemDuration;
      if (durationValue) {
        const durationCard = document.querySelector(`#stepDuration .skin-card[data-value="${durationValue}"]`);
        if (durationCard) {
          durationCard.classList.add("selected");
        }
      }

      // ✅ НОВОЕ: Восстановить бюджет (шаг 5)
      const budgetValue = userAnswers.scenarioData["skin-care"].budget;
      if (budgetValue) {
        const budgetCard = document.querySelector(`#stepBudget .skin-card[data-value="${budgetValue}"]`);
        if (budgetCard) {
          budgetCard.classList.add("selected");
        }
      }

      // ✅ Улучшение: создаем вспомогательную функцию для восстановления карточек
      function restoreCards(stepElementId, values, isArray = false) {
        if (!values) return;
        const stepElement = document.getElementById(stepElementId);
        if (!stepElement) return;

        if (isArray && Array.isArray(values)) {
          values.forEach(val => {
            const card = stepElement.querySelector(`.skin-card[data-value="${val}"]`);
            if (card) card.classList.add("selected");
          });
        } else if (typeof values === 'string') {
          const card = stepElement.querySelector(`.skin-card[data-value="${values}"]`);
          if (card) card.classList.add("selected");
        }
      }

      // Восстанавливаем уточняющие шаги с помощью вспомогательной функции
      const cd = userAnswers.scenarioData["skin-care"].conditionDetails;
      restoreCards("stepPigmentationType", cd.pigmentationType);
      restoreCards("stepSensitivityType", cd.sensitivityType);
      restoreCards("stepDehydrationType", cd.dehydrationSymptoms, true);
      restoreCards("stepDullType", cd.dullCauses, true);
      restoreCards("stepInflammationType", cd.inflammationTypes, true);
    }

    function clearAllData() {
      try {
        localStorage.removeItem("beautips_userAnswers");
      } catch (e) {
        console.warn("⚠️ Не удалось очистить localStorage:", e);
      }

      // Сброс данных
      userAnswers.scenario = null;
      userAnswers.profile.skinConditions = [];
      userAnswers.profile.skinType = null;
      userAnswers.timestamp = null;
      selectedAction = null;
      currentStep = 0;

      // Сброс данных всех сценариев
      Object.keys(userAnswers.scenarioData).forEach(key => {
        if (key === "skin-care") {
          userAnswers.scenarioData[key].allergy.type = null;
          userAnswers.scenarioData[key].allergy.details = "";
          userAnswers.scenarioData[key].problemDuration = null;
          userAnswers.scenarioData[key].budget = null; // ✅ НОВОЕ
          userAnswers.scenarioData[key].conditionDetails = {
            pigmentationType: null,
            sensitivityType: null,
            dehydrationSymptoms: [],
            dullCauses: [],
            inflammationTypes: []
          };
        } else {
          Object.keys(userAnswers.scenarioData[key]).forEach(subKey => {
            if (Array.isArray(userAnswers.scenarioData[key][subKey])) {
              userAnswers.scenarioData[key][subKey] = [];
            } else if (typeof userAnswers.scenarioData[key][subKey] === 'string') {
              userAnswers.scenarioData[key][subKey] = "";
            } else {
              userAnswers.scenarioData[key][subKey] = null;
            }
          });
        }
      });

      // Сброс UI
      document.querySelectorAll(".selected").forEach((el) => el.classList.remove("selected"));
      if (allergyTextarea) allergyTextarea.value = "";
      if (allergyInput) allergyInput.classList.add("hidden");

      // ✅ Улучшение: сбрасываем сессию для новой записи в истории
      if (typeof resetSessionId === 'function') {
        const newSid = resetSessionId();
        console.log("🆕 Создана новая сессия для истории:", newSid);
      }

      // ✅ Улучшение: возвращаем на начальный шаг
      showStep(0);

      console.log("🗑️ Данные очищены");
    }

    function getDataForAI() {
      const scenario = userAnswers.scenario;

      if (!scenario) {
        console.warn("⚠️ Сценарий не выбран");
        return null;
      }

      const result = {
        scenario: scenario,
        profile: {
          skinConditions: [...userAnswers.profile.skinConditions],
          skinType: userAnswers.profile.skinType
        },
        timestamp: userAnswers.timestamp
      };

      // ✅ Улучшение: глубокое копирование данных сценария
      if (userAnswers.scenarioData[scenario]) {
        result.scenarioData = JSON.parse(JSON.stringify(userAnswers.scenarioData[scenario]));
      }

      return result;
    }

    // Глобальный доступ к данным
    window.beautipsData = {
      get: getDataForAI,
      getAll: () => JSON.parse(JSON.stringify(userAnswers)),
      clear: clearAllData,
      save: saveToBackend,
      // Removed loadFromStorage - data comes from backend
      restoreUI: restoreUIFromAnswers
    };

    // ===============================
    // ✅ 5) ФУНКЦИИ ОТОБРАЖЕНИЯ ШАГОВ
    // ===============================

    function showStep(stepNum) {
      // ✅ ПРОВЕРЯЕМ РЕДИРЕКТ НА РЕЗУЛЬТАТЫ ПЕРВЫМ ДЕЛОМ
      if (stepNum === "results") {
        console.log("🎉 Переход на страницу результатов");

        const sessionId = getOrCreateSessionId();

        // Сохраняем ответы и сразу редиректим на страницу с прогресс-баром
        // Прогресс-бар и отправка на AI будут на results.html
        saveToBackend()
          .then(() => {
            console.log("📤 Ответы сохранены. Редирект на results.html");
            window.location.href = `./results.html?session=${sessionId}`;
          })
          .catch(err => {
            console.error("❌ Ошибка сохранения, но редиректим:", err);
            // Редиректим в любом случае - на results.html будет обработка
            window.location.href = `./results.html?session=${sessionId}`;
          });

        return; // ПРЕРЫВАЕМ выполнение (не пытаемся искать DOM элементы шага results)
      }

      // ✅ Улучшение: создаем массив всех шагов для удобного управления
      const allSteps = [
        { id: "step0", element: step0 },
        { id: "step1", element: step1 },
        { id: "stepPigmentationType", element: stepPigmentationType },
        { id: "stepSensitivityType", element: stepSensitivityType },
        { id: "stepDehydrationType", element: stepDehydrationType },
        { id: "stepDullType", element: stepDullType },
        { id: "stepInflammationType", element: stepInflammationType },
        { id: "step2", element: step2 },
        { id: "stepAllergy", element: stepAllergy },
        { id: "stepDuration", element: stepDuration },
        { id: "stepBudget", element: stepBudget }
        // ❌ УБРАЛИ stepResults из списка
      ];

      // Находим текущий активный шаг
      const currentActiveStep = allSteps.find(step => 
        step.element && !step.element.classList.contains("hidden")
      );

      // Определяем, какой шаг показать
      let stepToShow = null;
      if (stepNum === 0) stepToShow = step0;
      else if (stepNum === 1) stepToShow = step1;
      else if (stepNum === "pigmentation") stepToShow = stepPigmentationType;
      else if (stepNum === "sensitive") stepToShow = stepSensitivityType;
      else if (stepNum === "dehydrated") stepToShow = stepDehydrationType;
      else if (stepNum === "dull") stepToShow = stepDullType;
      else if (stepNum === "inflammation") stepToShow = stepInflammationType;
      else if (stepNum === 2) stepToShow = step2;
      else if (stepNum === 3) stepToShow = stepAllergy;
      else if (stepNum === 4) stepToShow = stepDuration;
      else if (stepNum === 5) stepToShow = stepBudget;

      // Анимация перехода между шагами
      if (currentActiveStep && currentActiveStep.element && currentActiveStep.element !== stepToShow) {
        // Анимация выхода
        currentActiveStep.element.classList.add("step-exiting");
        
        setTimeout(() => {
          currentActiveStep.element.classList.remove("step-exiting");
          currentActiveStep.element.classList.add("hidden");
          
          // Анимация входа нового шага
          if (stepToShow) {
            stepToShow.classList.remove("hidden");
            stepToShow.classList.add("step-entering");
            
              // Убираем класс анимации после завершения
              setTimeout(() => {
                stepToShow.classList.remove("step-entering");
              }, 500);
          }
        }, 400);
      } else {
        // Первый шаг или нет предыдущего - просто показываем
        allSteps.forEach(step => {
          if (step.element) step.element.classList.add("hidden");
        });
        
        if (stepToShow) {
          stepToShow.classList.remove("hidden");
          
          // Анимация только если не первая загрузка
          if (!isInitialLoad) {
            stepToShow.classList.add("step-entering");
            
            setTimeout(() => {
              stepToShow.classList.remove("step-entering");
            }, 100);
          }
        }
      }
      
      // Сбрасываем флаг после первой загрузки
      if (isInitialLoad) {
        setTimeout(() => {
          isInitialLoad = false;
        }, 100);
      }

      // Управляем помощником
      if (chatHelper) {
        if (stepNum === 0) {
          chatHelper.classList.remove("visible");
        } else {
          chatHelper.classList.add("visible");
          if (chatText && stepsData[stepNum]) {
            chatText.textContent = stepsData[stepNum].chatText;
          }
        }
      }

      // ✅ Показываем кнопки навигации (т.к. results обрабатывается выше)
      if (backBtn) backBtn.style.display = "";
      if (nextBtn) nextBtn.style.display = "";

      currentStep = stepNum;

      // Вызываем сохранение без блокировки UI
      saveToBackend();
    }

    // ===============================
    // ✅ 6) АНИМАЦИИ КНОПОК
    // ===============================

    function animateButton(btn, callback) {
      if (!btn) {
        if (callback) callback();
        return;
      }

      const circle = btn.querySelector(".nav-btn-circle");
      if (!circle) {
        if (callback) setTimeout(callback, 100);
        return;
      }

      try {
        const btnStyles = getComputedStyle(btn);
        const paddingLeft = parseFloat(btnStyles.paddingLeft) || 0;
        const paddingRight = parseFloat(btnStyles.paddingRight) || 0;
        const btnWidth = btn.offsetWidth;
        const circleWidth = circle.offsetWidth;
        const isBackButton = btn.classList.contains("nav-btn--back");

        const shift = isBackButton
          ? -(btnWidth - paddingLeft - circleWidth - paddingRight)
          : btnWidth - paddingRight - circleWidth - paddingLeft;

        circle.style.setProperty("--circle-shift", shift + "px");
        btn.classList.add("animating");

        setTimeout(() => {
          if (callback) callback();
          setTimeout(() => {
            btn.classList.remove("animating");
            circle.style.setProperty("--circle-shift", "0px");
          }, 50);
        }, 400);
      } catch (e) {
        console.warn("⚠️ Ошибка анимации кнопки:", e);
        if (callback) callback();
      }
    }

    function animateAndNavigate(btn, href) {
      if (!btn || !href) return;

      const circle = btn.querySelector(".nav-btn-circle");
      if (!circle) {
        window.location.href = href;
        return;
      }

      try {
        const btnStyles = getComputedStyle(btn);
        const paddingLeft = parseFloat(btnStyles.paddingLeft) || 0;
        const paddingRight = parseFloat(btnStyles.paddingRight) || 0;
        const btnWidth = btn.offsetWidth;
        const circleWidth = circle.offsetWidth;
        const isBackButton = btn.classList.contains("nav-btn--back");

        const shift = isBackButton
          ? -(btnWidth - paddingLeft - circleWidth - paddingRight)
          : btnWidth - paddingRight - circleWidth - paddingLeft;

        circle.style.setProperty("--circle-shift", shift + "px");
        btn.classList.add("animating");

        setTimeout(() => {
          window.location.href = href;
        }, 500);
      } catch (e) {
        console.warn("⚠️ Ошибка анимации навигации:", e);
        window.location.href = href;
      }
    }

    // ===============================
    // ✅ 7) ШАГ 0: ВЫБОР СЦЕНАРИЯ
    // ===============================
    const menuItems = document.querySelectorAll(".menu-item");
    menuItems.forEach((item) => {
      if (!item) return;

      item.addEventListener("click", () => {
        const action = item.getAttribute("data-action");
        if (!action) return;

        const isSelected = item.classList.contains("selected");

        if (isSelected) {
          item.classList.remove("selected");
          selectedAction = null;
          userAnswers.scenario = null;
        } else {
          menuItems.forEach((i) => i.classList.remove("selected"));
          item.classList.add("selected");
          selectedAction = action;
          userAnswers.scenario = action;
        }

        saveToBackend();
      });
    });

    // ===============================
    // ✅ 8) ШАГ 1: СОСТОЯНИЯ КОЖИ
    // ===============================
    const skinCards = document.querySelectorAll("#step1 .skin-card");
    skinCards.forEach((card) => {
      if (!card) return;

      card.addEventListener("click", () => {
        const value = card.getAttribute("data-value");
        if (!value) return;

        if (card.classList.contains("selected")) {
          card.classList.remove("selected");
          userAnswers.profile.skinConditions = userAnswers.profile.skinConditions.filter((v) => v !== value);
        } else {
          card.classList.add("selected");
          if (!userAnswers.profile.skinConditions.includes(value)) {
            userAnswers.profile.skinConditions.push(value);
          }
        }

        saveToBackend();
      });
    });

    // ===============================
    // ✅ 9) ШАГ 2: ТИП КОЖИ
    // ===============================
    const options = document.querySelectorAll(".option-item, #step2 .skin-card");
    options.forEach((option) => {
      if (!option) return;

      option.addEventListener("click", () => {
        const value = option.getAttribute("data-value");
        if (!value) return;

        const isSelected = option.classList.contains("selected");

        if (isSelected) {
          option.classList.remove("selected");
          userAnswers.profile.skinType = null;
        } else {
          // ✅ Исправление: снимаем выделение только с элементов в том же контейнере
          const parent = option.closest('.options-list');
          if (parent) {
            parent.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
          }
          option.classList.add("selected");
          userAnswers.profile.skinType = value;
        }

        saveToBackend();
      });
    });

    // ===============================
    // ✅ 10) ШАГ 3: АЛЛЕРГИЯ
    // ===============================
    const allergyCards = document.querySelectorAll("#stepAllergy .skin-card");
    allergyCards.forEach((card) => {
      if (!card) return;

      card.addEventListener("click", () => {
        const value = card.getAttribute("data-value");
        if (!value) return;

        const isSelected = card.classList.contains("selected");
        const allergyData = userAnswers.scenarioData["skin-care"].allergy;

        allergyCards.forEach((c) => c.classList.remove("selected"));

        if (isSelected) {
          allergyData.type = null;
          if (allergyInput) {
            allergyInput.classList.add("hidden");
          }
        } else {
          card.classList.add("selected");
          allergyData.type = value;

          if (allergyInput) {
            if (value === "known") {
              allergyInput.classList.remove("hidden");
              if (allergyTextarea) {
                setTimeout(() => allergyTextarea.focus(), 100);
              }
            } else {
              allergyInput.classList.add("hidden");
              allergyData.details = "";
              if (allergyTextarea) {
                allergyTextarea.value = "";
              }
            }
          }
        }

        saveToBackend();
      });
    });

    if (allergyTextarea) {
      allergyTextarea.addEventListener("input", () => {
        userAnswers.scenarioData["skin-care"].allergy.details = allergyTextarea.value.trim();
        saveToBackend();
      });

      allergyTextarea.addEventListener("blur", () => {
        userAnswers.scenarioData["skin-care"].allergy.details = allergyTextarea.value.trim();
        saveToBackend();
      });
    }

    // ===============================
    // ✅ 11) ШАГ 4: ДЛИТЕЛЬНОСТЬ ПРОБЛЕМЫ
    // ===============================
    const durationCards = document.querySelectorAll("#stepDuration .skin-card");
    durationCards.forEach((card) => {
      if (!card) return;

      card.addEventListener("click", () => {
        const value = card.getAttribute("data-value");
        if (!value) return;

        const isSelected = card.classList.contains("selected");
        durationCards.forEach((c) => c.classList.remove("selected"));

        if (isSelected) {
          userAnswers.scenarioData["skin-care"].problemDuration = null;
        } else {
          card.classList.add("selected");
          userAnswers.scenarioData["skin-care"].problemDuration = value;
        }

        saveToBackend();
      });
    });

    // ===============================
    // ✅ 11.1) ШАГ 5: БЮДЖЕТ (НОВЫЙ)
    // ===============================
    const budgetCards = document.querySelectorAll("#stepBudget .skin-card");
    budgetCards.forEach((card) => {
      if (!card) return;

      card.addEventListener("click", () => {
        const value = card.getAttribute("data-value");
        if (!value) return;

        const isSelected = card.classList.contains("selected");
        budgetCards.forEach((c) => c.classList.remove("selected"));

        if (isSelected) {
          userAnswers.scenarioData["skin-care"].budget = null;
        } else {
          card.classList.add("selected");
          userAnswers.scenarioData["skin-care"].budget = value;
        }

        saveToBackend();
      });
    });

    // ===============================
    // ✅ 12) УТОЧНЯЮЩИЕ ШАГИ ПО СОСТОЯНИЯМ КОЖИ
    // ===============================

    // ✅ Улучшение: создаем универсальные обработчики для single и multi select
    function setupSingleSelectCards(selector, saveCallback) {
      const cards = document.querySelectorAll(selector);
      cards.forEach((card) => {
        if (!card) return;

        card.addEventListener("click", () => {
          const value = card.getAttribute("data-value");
          if (!value) return;

          const isSelected = card.classList.contains("selected");
          const parent = card.closest('.skin-cards-grid');


          if (parent) {
            parent.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
          }

          if (isSelected) {
            saveCallback(null);
          } else {
            card.classList.add("selected");
            saveCallback(value);
          }

          saveToBackend();
        });
      });
    }

    function setupMultiSelectCards(selector, saveCallback) {
      const cards = document.querySelectorAll(selector);
      cards.forEach((card) => {
        if (!card) return;

        card.addEventListener("click", () => {
          const value = card.getAttribute("data-value");
          if (!value) return;

          const isSelected = card.classList.contains("selected");

          if (isSelected) {
            card.classList.remove("selected");
            saveCallback(value, false);
          } else {
            card.classList.add("selected");
            saveCallback(value, true);
          }

          saveToBackend();
        });
      });
    }

    // Настройка обработчиков для уточняющих шагов
    setupSingleSelectCards("#stepPigmentationType .skin-card", (value) => {
      userAnswers.scenarioData["skin-care"].conditionDetails.pigmentationType = value;
    });

    setupSingleSelectCards("#stepSensitivityType .skin-card", (value) => {
      userAnswers.scenarioData["skin-care"].conditionDetails.sensitivityType = value;
    });

    setupMultiSelectCards("#stepDehydrationType .skin-card", (value, add) => {
      const symptoms = userAnswers.scenarioData["skin-care"].conditionDetails.dehydrationSymptoms;
      if (add && !symptoms.includes(value)) {
        symptoms.push(value);
      } else if (!add) {
        const index = symptoms.indexOf(value);
        if (index > -1) symptoms.splice(index, 1);
      }
    });

    setupMultiSelectCards("#stepDullType .skin-card", (value, add) => {
      const causes = userAnswers.scenarioData["skin-care"].conditionDetails.dullCauses;
      if (add && !causes.includes(value)) {
        causes.push(value);
      } else if (!add) {
        const index = causes.indexOf(value);
        if (index > -1) causes.splice(index, 1);
      }
    });

    setupMultiSelectCards("#stepInflammationType .skin-card", (value, add) => {
      const types = userAnswers.scenarioData["skin-care"].conditionDetails.inflammationTypes;
      if (add && !types.includes(value)) {
        types.push(value);
      } else if (!add) {
        const index = types.indexOf(value);
        if (index > -1) types.splice(index, 1);
      }
    });

    // ===============================
    // ✅ 13) ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ===============================

    const conditionStepsOrder = ["dehydrated", "sensitive", "inflammation", "pigmentation", "dull"];

    function needsConditionDetails() {
      const conditions = userAnswers.profile.skinConditions;
      for (const step of conditionStepsOrder) {
        if (conditions.includes(step)) {
          return step;
        }
      }
      return null;
    }

    function getNextConditionStep(currentConditionStep) {
      const conditions = userAnswers.profile.skinConditions;
      const currentIndex = conditionStepsOrder.indexOf(currentConditionStep);

      for (let i = currentIndex + 1; i < conditionStepsOrder.length; i++) {
        if (conditions.includes(conditionStepsOrder[i])) {
          return conditionStepsOrder[i];
        }
      }

      return null;
    }

    function getPrevConditionStep(currentConditionStep) {
      const conditions = userAnswers.profile.skinConditions;
      const currentIndex = conditionStepsOrder.indexOf(currentConditionStep);

      for (let i = currentIndex - 1; i >= 0; i--) {
        if (conditions.includes(conditionStepsOrder[i])) {
          return conditionStepsOrder[i];
        }
      }

      return null;
    }

    function getLastConditionStep() {
      const conditions = userAnswers.profile.skinConditions;

      for (let i = conditionStepsOrder.length - 1; i >= 0; i--) {
        if (conditions.includes(conditionStepsOrder[i])) {
          return conditionStepsOrder[i];
        }
      }

      return null;
    }

    // ✅ Улучшение: функция валидации текущего шага
    function validateCurrentStep() {
      switch (currentStep) {
        case 0:
          return selectedAction !== null;

        case 1:
          return userAnswers.profile.skinConditions.length > 0;

        case "pigmentation":
          return userAnswers.scenarioData["skin-care"].conditionDetails.pigmentationType !== null;

        case "sensitive":
          return userAnswers.scenarioData["skin-care"].conditionDetails.sensitivityType !== null;

        case "dehydrated":
          return userAnswers.scenarioData["skin-care"].conditionDetails.dehydrationSymptoms.length > 0;

        case "dull":
          return userAnswers.scenarioData["skin-care"].conditionDetails.dullCauses.length > 0;

        case "inflammation":
          return userAnswers.scenarioData["skin-care"].conditionDetails.inflammationTypes.length > 0;

        case 2:
          return userAnswers.profile.skinType !== null;

        case 3:
          return userAnswers.scenarioData["skin-care"].allergy.type !== null;

        case 4:
          return userAnswers.scenarioData["skin-care"].problemDuration !== null;

        case 5: // ✅ НОВЫЙ ШАГ
          return userAnswers.scenarioData["skin-care"].budget !== null;

        default:
          return true;
      }
    }

    // ===============================
    // ✅ 14) НАВИГАЦИЯ "ДАЛЕЕ"
    // ===============================
    if (nextBtn) {
      nextBtn.addEventListener("click", (e) => {
        e.preventDefault();

        // ✅ Улучшение: валидация текущего шага
        if (!validateCurrentStep()) {
          console.log("⚠️ Заполните текущий шаг");
          // Можно добавить визуальную индикацию ошибки
          nextBtn.classList.add("shake");
          setTimeout(() => nextBtn.classList.remove("shake"), 500);
          return;
        }

        // Определяем следующий шаг
        let nextStep = null;

        if (currentStep === 0) {
          nextStep = 1;
        } else if (currentStep === 1) {
          if (selectedAction === "skin-care") {
            const conditionStep = needsConditionDetails();
            nextStep = conditionStep || 2;
          } else {
            nextStep = 2;
          }
        } else if (typeof currentStep === "string") {
          const nextCondition = getNextConditionStep(currentStep);
          nextStep = nextCondition || 2;
        } else if (currentStep === 2) {
          nextStep = (selectedAction === "skin-care") ? 3 : "results";
        } else if (currentStep === 3) {
          nextStep = 4;
        } else if (currentStep === 4) {
          nextStep = 5;
        } else if (currentStep === 5) {
          nextStep = "results"; // ✅ Теперь переходим на шаг результатов
        }

        // Выполняем переход
        if (nextStep !== null) {
          console.log(`➡️ Переход: ${currentStep} -> ${nextStep}`);
          if (nextStep === "results") {
            saveToBackend();
            console.log("📤 Данные для ИИ:", getDataForAI());
          }
          animateButton(nextBtn, () => showStep(nextStep));
        }
      });
    }

    // ===============================
    // ✅ 15) НАВИГАЦИЯ "НАЗАД"
    // ===============================
    if (backBtn) {
      backBtn.addEventListener("click", (e) => {
        e.preventDefault();

        let prevStep = null;

        if (currentStep === "results") { // ✅ НОВОЕ: назад с результатов
          prevStep = 5;
        } else if (currentStep === 5) {
          prevStep = 4;
        } else if (currentStep === 4) {
          prevStep = 3;
        } else if (currentStep === 3) {
          prevStep = 2;
        } else if (currentStep === 2) {
          if (selectedAction === "skin-care") {
            const lastCondition = getLastConditionStep();
            prevStep = lastCondition || 1;
          } else {
            prevStep = 1;
          }
        } else if (typeof currentStep === "string") {
          const prevCondition = getPrevConditionStep(currentStep);
          prevStep = prevCondition || 1;
        } else if (currentStep === 1) {
          prevStep = 0;
        } else if (currentStep === 0) {
          animateAndNavigate(backBtn, "index.html");
          return;
        }

        if (prevStep !== null) {
          animateButton(backBtn, () => showStep(prevStep));
        }
      });
    }







    // Функция уведомления
    function showNotification(message) {
      const notification = document.createElement("div");
      notification.className = "notification";
      notification.textContent = message;
      notification.style.cssText = `
    position: fixed;
    top: 100px;
    left: 50 %;
    transform: translateX(-50 %) translateY(-20px);
    background: linear - gradient(135deg, #6E90D0 0 %, #8AAAE5 100 %);
    color: white;
    padding: 16px 28px;
    border - radius: 50px;
    font - size: 16px;
    font - weight: 500;
    box - shadow: 0 8px 32px rgba(110, 144, 208, 0.4);
    z - index: 1001;
    opacity: 0;
    transition: all 0.3s ease;
    `;

      document.body.appendChild(notification);

      requestAnimationFrame(() => {
        notification.style.opacity = "1";
        notification.style.transform = "translateX(-50%) translateY(0)";
      });

      setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transform = "translateX(-50%) translateY(-20px)";
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }



    // ===============================
    // ✅ 17) ИНИЦИАЛИЗАЦИЯ
    // ===============================
    // Auth check - redirect if not logged in
    if (!isAuthenticated()) {
      window.location.href = "./register.html";
      return;
    }
    loadFromStorage();
    restoreUIFromAnswers();

    // ✅ Улучшение: определяем начальный шаг на основе загруженных данных
    if (userAnswers.scenario) {
      if (userAnswers.profile.skinConditions.length > 0) {
        if (userAnswers.profile.skinType) {
          if (userAnswers.scenarioData["skin-care"].allergy.type !== null) {
            if (userAnswers.scenarioData["skin-care"].problemDuration !== null) {
              if (userAnswers.scenarioData["skin-care"].budget !== null) { // ✅ НОВОЕ
                currentStep = 5;
              } else {
                currentStep = 5;
              }
            } else {
              currentStep = 4;
            }
          } else {
            currentStep = 3;
          }
        } else {
          currentStep = 2;
        }
      } else {
        currentStep = 1;
      }
    } else {
      currentStep = 0;
    }

    showStep(currentStep);

    // Перехватываем клики по всей секции выбора для логирования (для отладки)
    const chooseSection = document.querySelector('.choose-section');
    if (chooseSection) {
      chooseSection.addEventListener('click', (e) => {
        const target = e.target.closest('.menu-item, .skin-card, .option-item');
        if (target) {
          console.log("🖱️ Клик по элементу выбора:", target.getAttribute('data-value') || target.getAttribute('data-action'));
        }
      });
    }

    console.log("✅ BeauTips Chat инициализирован");
    console.log("📊 Текущие данные:", getDataForAI());
  } catch (err) {
    console.error("❌ КРИТИЧЕСКАЯ ОШИБКА СКРИПТА:", err);
    if (typeof notifications !== 'undefined') {
        notifications.error("Критическая ошибка: " + err.message, 8000);
    } else {
        alert("Критическая ошибка: " + err.message);
    }
  }
});
