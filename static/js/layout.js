/* 主框架：菜单切换、iframe、面包屑 */
(function () {
  'use strict';

  const PAGES = {
    dashboard: { file: 'dashboard/index.html', title: '概览' },
    student: { file: 'student/index.html', title: '学生管理' },
    checkin: { file: 'checkin/index.html', title: '学生报到' },
    teacher: { file: 'teacher/index.html', title: '教师管理' },
    classes: { file: 'classes/index.html', title: '班级管理' },
    schedule: { file: 'schedule/index.html', title: '课表管理' },
    score: { file: 'score/index.html', title: '成绩管理' },
    subject: { file: 'subject/index.html', title: '课程管理' },
    user: { file: 'user/index.html', title: '用户管理' },
    announcement: { file: 'announcement/index.html', title: '公告管理' },
    about: { file: 'about/index.html', title: '系统信息' },
  };

  const frame = document.getElementById('content-frame');
  const crumb = document.getElementById('crumb');
  const menuItems = Array.prototype.slice.call(document.querySelectorAll('.menu-item'));

  function activate(key, updateHash) {
    if (!PAGES[key]) key = 'dashboard';

    menuItems.forEach(function (item) {
      item.classList.toggle('active', item.dataset.page === key);
    });

    crumb.textContent = PAGES[key].title;
    document.title = PAGES[key].title + ' - 教务管理系统';

    const src = PAGES[key].file;
    if (frame.getAttribute('src') !== src) {
      frame.setAttribute('src', src);
    }

    if (updateHash !== false && location.hash !== '#' + key) {
      history.replaceState(null, '', '#' + key);
    }
  }

  menuItems.forEach(function (item) {
    item.addEventListener('click', function (event) {
      event.preventDefault();
      activate(item.dataset.page);
    });
  });

  document.getElementById('sidebar-toggle').addEventListener('click', function () {
    document.body.classList.toggle('sidebar-collapsed');
  });

  if (window.innerWidth < 768) {
    document.body.classList.add('sidebar-collapsed');
  }

  const currentUser = document.getElementById('current-user');
  if (currentUser) {
    currentUser.textContent =
      sessionStorage.getItem('edu_admin_user') ||
      localStorage.getItem('edu_admin_user') ||
      '管理员';
  }

  const logoutButton = document.getElementById('logout-btn');
  if (logoutButton) {
    logoutButton.addEventListener('click', function () {
      ['edu_admin_auth', 'edu_admin_user'].forEach(function (key) {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      });
      window.location.replace('/static/html/login/index.html');
    });
  }

  const initial = (location.hash || '').replace('#', '') || 'dashboard';
  activate(initial, false);

  window.addEventListener('hashchange', function () {
    activate((location.hash || '').replace('#', ''), false);
  });
})();
