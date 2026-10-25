/* 前端登录守卫（演示用途，真实鉴权需后端会话/令牌） */
(function () {
  'use strict';

  var AUTH_KEY = 'edu_admin_auth';
  var AUTHED =
    sessionStorage.getItem(AUTH_KEY) === '1' ||
    localStorage.getItem(AUTH_KEY) === '1';

  if (!AUTHED) {
    var loginUrl = '/static/html/login/index.html';
    if (window.top && window.top !== window) {
      window.top.location.replace(loginUrl);
    } else {
      window.location.replace(loginUrl);
    }
  }
})();
