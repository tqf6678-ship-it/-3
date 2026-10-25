/* 用户管理 */
(function () {
  'use strict';

  const App = window.App;
  const API = App.API;

  const state = {
    page: 1,
    size: 10,
    keyword: '',
    status: -1,
    total: 0,
    rows: [],
    editingId: null,
    resettingUser: null,
  };

  const form = document.getElementById('user-form');
  const tbody = document.getElementById('user-tbody');
  const tableCard = document.getElementById('table-card');
  const statusFilter = document.getElementById('status-filter');
  const passwordForm = document.getElementById('password-form');

  function field(name) {
    return form.querySelector('[name="' + name + '"]');
  }

  function roleTag(role) {
    return role === 'admin'
      ? '<span class="tag tag-blue">管理员</span>'
      : '<span class="tag tag-gray">教师</span>';
  }

  function statusTag(status) {
    return Number(status) === 1
      ? '<span class="tag tag-green">正常</span>'
      : '<span class="tag tag-gray">停用</span>';
  }

  function renderRows() {
    document.getElementById('user-count').textContent = state.total;

    if (!state.rows.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="table-empty">暂无用户</td></tr>';
      return;
    }

    tbody.innerHTML = state.rows
      .map(function (user) {
        const isProtected = user.username === 'admin';
        const statusAction = Number(user.status) === 1 ? '停用' : '启用';
        const statusClass = Number(user.status) === 1 ? 'text-danger' : '';
        return (
          '<tr>' +
          '<td class="num">' + user.id + '</td>' +
          '<td>' + App.escapeHtml(user.username) + '</td>' +
          '<td>' + App.escapeHtml(user.nickname || '—') + '</td>' +
          '<td>' + roleTag(user.role) + '</td>' +
          '<td>' + App.escapeHtml(user.phone || '—') + '</td>' +
          '<td>' + statusTag(user.status) + '</td>' +
          '<td class="num">' + App.fmtDateTime(user.last_login_time) + '</td>' +
          '<td class="num">' + App.fmtDateTime(user.create_time) + '</td>' +
          '<td class="row-actions">' +
          '<button class="btn btn-link btn-sm" type="button" data-action="edit" data-id="' + user.id + '">编辑</button>' +
          '<button class="btn btn-link btn-sm" type="button" data-action="password" data-id="' + user.id + '">重置密码</button>' +
          (isProtected
            ? '<button class="btn btn-link btn-sm" type="button" disabled title="内置管理员不能停用">停用</button>'
            : '<button class="btn btn-link btn-sm ' + statusClass + '" type="button" data-action="status" data-id="' + user.id + '">' + statusAction + '</button>') +
          (isProtected
            ? '<button class="btn btn-link btn-sm" type="button" disabled title="内置管理员不能删除">删除</button>'
            : '<button class="btn btn-link btn-sm text-danger" type="button" data-action="delete" data-id="' + user.id + '">删除</button>') +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  async function loadList() {
    App.setLoading(tableCard, true);

    const params = new URLSearchParams();
    params.set('page', state.page);
    params.set('size', state.size);
    if (state.keyword) params.set('keyword', state.keyword);
    if (state.status !== -1) params.set('status', state.status);

    try {
      const data = await API.get('/usr/list?' + params.toString());
      state.rows = data.rows || [];
      state.total = Number(data.total || 0);
      state.page = Number(data.page || 1);
      state.size = Number(data.size || state.size);

      renderRows();
      App.renderPagination(document.getElementById('user-pagination'), data, function (page) {
        state.page = page;
        loadList();
      });
    } catch (error) {
      tbody.innerHTML =
        '<tr><td colspan="9" class="table-empty">' + App.escapeHtml(error.message) + '</td></tr>';
      document.getElementById('user-count').textContent = '0';
      document.getElementById('user-pagination').innerHTML = '';
      App.toast(error.message, 'error');
    } finally {
      App.setLoading(tableCard, false);
    }
  }

  function openAdd() {
    state.editingId = null;
    form.reset();
    field('username').disabled = false;
    field('username').value = '';
    field('nickname').value = '';
    field('password').value = '';
    field('password').required = true;
    field('role').value = 'teacher';
    field('phone').value = '';
    field('email').value = '';
    field('status').value = '1';
    document.getElementById('user-password-wrap').hidden = false;
    document.getElementById('user-edit-hint').hidden = true;
    document.getElementById('user-modal-title').textContent = '新增用户';
    App.showModal('user-modal');
  }

  function openEdit(id) {
    const user = state.rows.find(function (item) {
      return Number(item.id) === Number(id);
    });
    if (!user) return;

    state.editingId = user.id;
    field('username').value = user.username || '';
    field('username').disabled = true;
    field('nickname').value = user.nickname || '';
    field('password').value = '';
    field('password').required = false;
    field('role').value = user.role || 'teacher';
    field('phone').value = user.phone || '';
    field('email').value = user.email || '';
    field('status').value = String(user.status);
    document.getElementById('user-password-wrap').hidden = true;
    document.getElementById('user-edit-hint').hidden = false;
    document.getElementById('user-modal-title').textContent = '编辑用户';
    App.showModal('user-modal');
  }

  function openResetPassword(user) {
    state.resettingUser = user;
    passwordForm.reset();
    document.getElementById('password-user-info').textContent =
      '用户：' + user.username + (user.nickname ? '（' + user.nickname + '）' : '');
    App.showModal('password-modal');
  }

  async function toggleStatus(user) {
    const nextStatus = Number(user.status) === 1 ? 0 : 1;
    const action = nextStatus === 1 ? '启用' : '停用';
    const confirmed = await App.confirmDialog(
      '确定' + action + '用户「' + user.username + '」吗？',
      { title: action + '用户', confirmText: action, danger: nextStatus === 0 }
    );
    if (!confirmed) return;

    try {
      await API.put('/usr/status', { user_id: user.id, status: nextStatus });
      App.toast('用户已' + action);
      await loadList();
    } catch (error) {
      App.toast(error.message, 'error');
    }
  }

  async function removeUser(user) {
    const confirmed = await App.confirmDialog(
      '确定删除用户「' + user.username + '」吗？此操作不可恢复。',
      { title: '删除确认', confirmText: '删除' }
    );
    if (!confirmed) return;

    try {
      await API.del('/usr/del/' + user.id);
      App.toast('删除成功');
      if (state.rows.length === 1 && state.page > 1) {
        state.page -= 1;
      }
      await loadList();
    } catch (error) {
      App.toast(error.message, 'error');
    }
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = field('username').value.trim();
    const nickname = field('nickname').value.trim();
    const password = field('password').value;
    const role = field('role').value;
    const phone = field('phone').value.trim();
    const email = field('email').value.trim();
    const status = Number(field('status').value);

    if (!state.editingId) {
      if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
        App.toast('用户名需为 3-20 位字母、数字或下划线', 'warning');
        return;
      }
      if (password.length < 6) {
        App.toast('密码至少需要 6 位', 'warning');
        return;
      }
    }

    const submitButton = document.getElementById('user-submit');
    submitButton.disabled = true;

    try {
      if (state.editingId) {
        await API.put('/usr/update', {
          user_id: state.editingId,
          nickname: nickname,
          role: role,
          phone: phone,
          email: email,
          status: status,
        });
        App.toast('用户信息已修改');
      } else {
        await API.post('/usr/add', {
          username: username,
          password: password,
          nickname: nickname,
          role: role,
          phone: phone,
          email: email,
          status: status,
        });
        App.toast('用户已新增');
      }

      App.hideModal('user-modal');
      await loadList();
    } catch (error) {
      App.toast(error.message, 'error');
    } finally {
      submitButton.disabled = false;
    }
  });

  passwordForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!state.resettingUser) return;

    const password = document.getElementById('new-password').value;
    const confirm = document.getElementById('confirm-password').value;
    if (password.length < 6) {
      App.toast('密码至少需要 6 位', 'warning');
      return;
    }
    if (password !== confirm) {
      App.toast('两次输入的密码不一致', 'warning');
      return;
    }

    const submitButton = document.getElementById('password-submit');
    submitButton.disabled = true;

    try {
      await API.put('/usr/password', {
        user_id: state.resettingUser.id,
        password: password,
      });
      App.hideModal('password-modal');
      App.toast('密码重置成功');
    } catch (error) {
      App.toast(error.message, 'error');
    } finally {
      submitButton.disabled = false;
    }
  });

  document.getElementById('search-form').addEventListener('submit', function (event) {
    event.preventDefault();
    state.keyword = document.getElementById('keyword-input').value.trim();
    state.status = Number(statusFilter.value);
    state.page = 1;
    loadList();
  });

  document.getElementById('search-form').addEventListener('reset', function () {
    state.keyword = '';
    state.status = -1;
    state.page = 1;
    setTimeout(function () {
      statusFilter.value = '-1';
      loadList();
    }, 0);
  });

  document.getElementById('btn-add').addEventListener('click', openAdd);
  document.getElementById('btn-refresh').addEventListener('click', loadList);

  tbody.addEventListener('click', function (event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const id = Number(button.dataset.id);
    const user = state.rows.find(function (item) {
      return Number(item.id) === id;
    });
    if (!user) return;

    if (button.dataset.action === 'edit') openEdit(id);
    if (button.dataset.action === 'password') openResetPassword(user);
    if (button.dataset.action === 'status') toggleStatus(user);
    if (button.dataset.action === 'delete') removeUser(user);
  });

  loadList();
})();
