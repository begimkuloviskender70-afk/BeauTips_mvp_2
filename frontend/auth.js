document.addEventListener("DOMContentLoaded", function () {

  // ========== ПЕРЕКЛЮЧЕНИЕ ФОРМ ==========
  const switchLinks = document.querySelectorAll(".auth-switch-link");
  const sections = document.querySelectorAll(".auth-section");

  function switchForm(targetId) {
    // Скрываем все секции
    sections.forEach(section => section.classList.remove("active"));

    // Показываем нужную
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.classList.add("active");
    }

    // Очищаем ошибки при переключении
    document.querySelectorAll(".auth-field--error").forEach(field => {
      field.classList.remove("auth-field--error");
      const errorEl = field.querySelector(".auth-error-message");
      if (errorEl) errorEl.textContent = "";
    });
  }

  // Обработка кликов
  switchLinks.forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.dataset.target;
      switchForm(targetId);
    });
  });

  // Проверка URL параметров (например register.html?mode=login)
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  if (mode === 'login') {
    switchForm('loginSection');
  } else if (mode === 'register') {
    switchForm('registerSection');
  }

  // ========== INTL-TEL-INPUT ==========
  const phoneInput = document.querySelector("#phone");
  let iti = null;

  if (phoneInput && window.intlTelInput) {
    iti = window.intlTelInput(phoneInput, {
      initialCountry: "kg",
      preferredCountries: ["kg", "ru", "kz", "uz", "tj"],
      separateDialCode: true,
      utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.5.3/js/utils.js",
    });
  }

  // ========== TOGGLE ПАРОЛЯ ==========
  const passwordToggles = document.querySelectorAll(".password-toggle");

  passwordToggles.forEach(toggle => {
    const input = toggle.closest(".auth-input-wrapper").querySelector("input");

    // Устанавливаем начальную иконку
    toggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

    toggle.addEventListener("click", function () {
      const type = input.getAttribute("type") === "password" ? "text" : "password";
      input.setAttribute("type", type);
      this.innerHTML = type === "password" ?
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>' :
        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    });
  });

  // ========== ВАЛИДАЦИЯ ==========
  function setFieldError(input, message) {
    const field = input.closest(".auth-field");
    if (!field) return;

    const errorEl = field.querySelector(".auth-error-message");

    if (message) {
      field.classList.add("auth-field--error");
      if (errorEl) errorEl.textContent = message;
    } else {
      field.classList.remove("auth-field--error");
      if (errorEl) errorEl.textContent = "";
    }
  }

  // Валидаторы
  const validators = {
    email: (value) => {
      if (!value.trim()) return "Поле обязательно для заполнения";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) return "Некорректный email";
      return "";
    },
    nickname: (value) => {
      if (!value.trim()) return "Поле обязательно для заполнения";
      if (value.length < 2) return "Минимум 2 символа";
      return "";
    },
    phone: (value) => {
      if (!value.trim()) return "Поле обязательно для заполнения";
      if (iti && !iti.isValidNumber()) return "Некорректный номер телефона";
      return "";
    },
    password: (value) => {
      if (!value.trim()) return "Поле обязательно для заполнения";
      if (value.length < 8) return "Пароль должен содержать не менее 8 символов";
      return "";
    },
  };

  // Привязываем валидацию к полям
  document.querySelectorAll(".auth-field").forEach(field => {
    const input = field.querySelector("input");
    const fieldType = field.dataset.field;

    if (!input || !validators[fieldType]) return;

    input.addEventListener("blur", () => {
      const error = validators[fieldType](input.value);
      setFieldError(input, error);
    });

    input.addEventListener("input", () => {
      if (field.classList.contains("auth-field--error")) {
        const error = validators[fieldType](input.value);
        setFieldError(input, error);
      }
    });
  });

  // ========== ФОРМА РЕГИСТРАЦИИ ==========
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      let isValid = true;

      const fields = this.querySelectorAll(".auth-field");
      fields.forEach(field => {
        const input = field.querySelector("input");
        const fieldType = field.dataset.field;

        if (input && validators[fieldType]) {
          const error = validators[fieldType](input.value);
          setFieldError(input, error);
          if (error) isValid = false;
        }
      });

      if (!isValid) {
        const firstError = this.querySelector(".auth-field--error input");
        if (firstError) firstError.focus();
        return;
      }

      // Get form data
      const email = document.getElementById("reg-email").value.trim();
      const username = document.getElementById("nickname").value.trim();
      let password = document.getElementById("reg-password").value;
      const phone = iti ? iti.getNumber() : phoneInput.value.trim();

      // Show loading state
      const submitBtn = this.querySelector(".auth-submit");
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Регистрация...";

      try {
        // Call API
        const response = await register({ email, username, phone, password });

        // Show success message with email verification info
        if (typeof notifications !== 'undefined') {
          notifications.success("Регистрация успешна! Проверьте вашу почту для подтверждения email.", 7000);
        } else {
          alert("Регистрация успешна! Проверьте вашу почту для подтверждения email.");
        }

        // Switch to login form
        document.getElementById("registerSection").classList.remove("active");
        document.getElementById("loginSection").classList.add("active");

        // Pre-fill email in login form
        document.getElementById("login-email").value = email;

      } catch (error) {
        console.error("Registration error:", error);
        let errorMsg = error.message || "Ошибка регистрации. Попробуйте снова.";
        
        // Улучшаем сообщения об ошибках
        if (errorMsg.includes('already exists') || errorMsg.includes('уже существует')) {
          if (errorMsg.includes('email')) {
            errorMsg = "Пользователь с таким email уже зарегистрирован. Попробуйте войти.";
          } else if (errorMsg.includes('username')) {
            errorMsg = "Пользователь с таким именем уже существует. Выберите другое имя.";
          }
        }
        
        if (typeof notifications !== 'undefined') {
          // Проверяем, нужно ли показать специальное сообщение о верификации
          if (errorMsg.includes('verify') || errorMsg.includes('email')) {
            notifications.warning(errorMsg, 6000);
          } else {
            notifications.error(errorMsg, 6000);
          }
        } else {
          alert(errorMsg);
        }
      } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // ========== ФОРМА ВХОДА ==========
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      let isValid = true;

      const fields = this.querySelectorAll(".auth-field");
      fields.forEach(field => {
        const input = field.querySelector("input");
        const fieldType = field.dataset.field;

        if (input && validators[fieldType]) {
          // Для входа пароль может быть любой длины
          let error;
          if (fieldType === "password") {
            error = input.value.trim() ? "" : "Поле обязательно для заполнения";
          } else {
            error = validators[fieldType](input.value);
          }
          setFieldError(input, error);
          if (error) isValid = false;
        }
      });

      if (!isValid) {
        const firstError = this.querySelector(".auth-field--error input");
        if (firstError) firstError.focus();
        return;
      }

      // Get form data
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      // Show loading state
      const submitBtn = this.querySelector(".auth-submit");
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Вход...";

      try {
        // Call API
        const response = await login({ email, password });

        // Check if there's a saved redirect URL
        const redirectUrl = localStorage.getItem('redirect_after_login');
        if (redirectUrl) {
          localStorage.removeItem('redirect_after_login');
          window.location.href = redirectUrl;
        } else {
          // Default redirect to profile page
          window.location.href = './profile.html';
        }

      } catch (error) {
        console.error("Login error:", error);
        const errorMsg = error.message || "Ошибка входа. Проверьте email и пароль.";
        if (typeof notifications !== 'undefined') {
          // Специальное сообщение для неверифицированного email
          if (errorMsg.includes('verify') || errorMsg.includes('email')) {
            notifications.warning(errorMsg + " Проверьте почту и подтвердите email.", 7000);
          } else {
            notifications.error(errorMsg, 6000);
          }
        } else {
          alert(errorMsg);
        }
      } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
});