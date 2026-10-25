/* 登录 / 注册：使用数据库用户表，密码由后端 PBKDF2 哈希存储 */
(function () {
  'use strict';

  var AUTH_KEY = 'edu_admin_auth';
  var USER_KEY = 'edu_admin_user';
  var ROLE_KEY = 'edu_admin_role';

  function isAuthed() {
    return (
      sessionStorage.getItem(AUTH_KEY) === '1' ||
      localStorage.getItem(AUTH_KEY) === '1'
    );
  }

  if (isAuthed()) {
    window.location.replace('/static/html/index.html');
    return;
  }

  async function apiRequest(url, body) {
    var response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new Error('无法连接服务器，请确认后端已启动');
    }

    var payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error('服务器响应异常（HTTP ' + response.status + '）');
    }

    if (!response.ok) {
      throw new Error('请求失败（HTTP ' + response.status + '）');
    }
    if (payload.code !== 0) {
      throw new Error(payload.msg || '操作失败');
    }
    return payload.data;
  }

  var form = document.getElementById('login-form');
  var usernameInput = document.getElementById('username');
  var passwordInput = document.getElementById('password');
  var rememberInput = document.getElementById('remember');
  var alertBox = document.getElementById('login-alert');
  var submitButton = document.getElementById('login-submit');
  var passwordToggle = document.getElementById('password-toggle');

  function showAlert(message) {
    alertBox.className = 'login-alert';
    alertBox.textContent = message;
    alertBox.hidden = false;
  }

  function showNotice(message) {
    alertBox.className = 'login-alert success';
    alertBox.textContent = message;
    alertBox.hidden = false;
  }

  function hideAlert() {
    alertBox.hidden = true;
    alertBox.textContent = '';
  }

  usernameInput.addEventListener('input', hideAlert);
  passwordInput.addEventListener('input', hideAlert);

  passwordToggle.addEventListener('click', function () {
    var showing = passwordInput.type === 'text';
    passwordInput.type = showing ? 'password' : 'text';
    passwordToggle.textContent = showing ? '显示' : '隐藏';
    passwordInput.focus();
  });

  // ---------------- 注册 ----------------

  var registerModalElement = document.getElementById('register-modal');
  var registerForm = document.getElementById('register-form');
  var registerAlert = document.getElementById('register-alert');
  var registerUsername = document.getElementById('register-username');
  var registerName = document.getElementById('register-name');
  var registerPassword = document.getElementById('register-password');
  var registerConfirm = document.getElementById('register-confirm');
  var registerSubmit = document.getElementById('register-submit');

  function showRegisterAlert(message) {
    registerAlert.className = 'login-alert';
    registerAlert.textContent = message;
    registerAlert.hidden = false;
  }

  function hideRegisterAlert() {
    registerAlert.hidden = true;
    registerAlert.textContent = '';
  }

  [registerUsername, registerName, registerPassword, registerConfirm].forEach(function (input) {
    input.addEventListener('input', hideRegisterAlert);
  });

  document.getElementById('open-register').addEventListener('click', function () {
    registerForm.reset();
    hideRegisterAlert();
    hideAlert();
    bootstrap.Modal.getOrCreateInstance(registerModalElement).show();
  });

  registerForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    var username = registerUsername.value.trim();
    var displayName = registerName.value.trim();
    var password = registerPassword.value;
    var confirmPassword = registerConfirm.value;

    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
      showRegisterAlert('账号需为 3-20 位字母、数字或下划线');
      registerUsername.focus();
      return;
    }
    if (password.length < 6) {
      showRegisterAlert('密码至少需要 6 位');
      registerPassword.focus();
      return;
    }
    if (password !== confirmPassword) {
      showRegisterAlert('两次输入的密码不一致');
      registerConfirm.focus();
      return;
    }

    registerSubmit.disabled = true;
    try {
      await apiRequest('/auth/register', {
        username: username,
        password: password,
        nickname: displayName,
      });

      bootstrap.Modal.getOrCreateInstance(registerModalElement).hide();
      usernameInput.value = username;
      passwordInput.value = '';
      showNotice('注册成功，请使用新账号登录');
      passwordInput.focus();
    } catch (error) {
      showRegisterAlert(error.message);
    } finally {
      registerSubmit.disabled = false;
    }
  });

  // ---------------- 登录 ----------------

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    var username = usernameInput.value.trim();
    var password = passwordInput.value;

    if (!username) {
      showAlert('请输入账号');
      usernameInput.focus();
      return;
    }
    if (!password) {
      showAlert('请输入密码');
      passwordInput.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = '登录中…';

    try {
      var user = await apiRequest('/auth/login', {
        username: username,
        password: password,
      });

      var storage = rememberInput.checked ? localStorage : sessionStorage;
      var displayName = user.nickname || user.username;

      sessionStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(ROLE_KEY);
      localStorage.removeItem(ROLE_KEY);

      storage.setItem(AUTH_KEY, '1');
      storage.setItem(USER_KEY, displayName);
      storage.setItem(ROLE_KEY, user.role || 'teacher');

      window.location.replace('/static/html/index.html');
    } catch (error) {
      showAlert(error.message);
      submitButton.disabled = false;
      submitButton.textContent = '登 录';
      passwordInput.focus();
      passwordInput.select();
    }
  });
})();
