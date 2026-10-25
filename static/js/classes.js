/* 班级管理 */
(function () {
  'use strict';

  const App = window.App;
  const API = App.API;

  const state = {
    page: 1,
    size: 10,
    keyword: '',
    total: 0,
    rows: [],
    editingId: null,
  };

  const form = document.getElementById('classes-form');
  const tbody = document.getElementById('classes-tbody');
  const tableCard = document.getElementById('table-card');
  const tableNotice = document.getElementById('classes-table-notice');

  function field(name) {
    return form.querySelector('[name="' + name + '"]');
  }

  function friendlyError(message) {
    if (/1146|doesn't exist|does not exist|Table .*classes/i.test(message)) {
      return '班级表尚未创建，请先执行 org/sql/classes.sql';
    }
    if (/1062|Duplicate entry|uk_classes_code/i.test(message)) {
      return '班级编号已存在，请更换编号';
    }
    if (/1451|foreign key|Cannot delete or update a parent row/i.test(message)) {
      return '该班级仍被其他数据引用，无法删除';
    }
    return message;
  }

  function renderRows() {
    if (!state.rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">暂无班级数据</td></tr>';
      return;
    }

    tbody.innerHTML = state.rows
      .map(function (item) {
        return (
          '<tr>' +
          '<td class="num">' + item.id + '</td>' +
          '<td>' + App.escapeHtml(item.name) + '</td>' +
          '<td>' + App.escapeHtml(item.code) + '</td>' +
          '<td>' + App.escapeHtml(item.address || '—') + '</td>' +
          '<td class="num">' + App.fmtDateTime(item.create_time) + '</td>' +
          '<td class="text-nowrap">' +
          '<button class="btn btn-link btn-sm" type="button" data-action="schedule" data-id="' + item.id + '">课表</button>' +
          '<button class="btn btn-link btn-sm" type="button" data-action="edit" data-id="' + item.id + '">编辑</button>' +
          '<button class="btn btn-link btn-sm text-danger" type="button" data-action="delete" data-id="' + item.id + '">删除</button>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  async function loadList() {
    App.setLoading(tableCard, true);
    try {
      const params = new URLSearchParams();
      params.set('page', state.page);
      params.set('size', state.size);
      if (state.keyword) params.set('keyword', state.keyword);

      const data = await API.get('/cls/page?' + params.toString());
      state.rows = data.rows || [];
      state.total = Number(data.total || 0);
      state.page = Number(data.page || 1);
      state.size = Number(data.size || state.size);

      tableNotice.hidden = true;
      document.getElementById('classes-count').textContent = state.total;
      renderRows();
      App.renderPagination(document.getElementById('classes-pagination'), data, function (page) {
        state.page = page;
        loadList();
      });
    } catch (error) {
      const message = friendlyError(error.message);
      tableNotice.hidden = !/班级表尚未创建/.test(message);
      document.getElementById('classes-count').textContent = '0';
      tbody.innerHTML =
        '<tr><td colspan="6" class="table-empty">' + App.escapeHtml(message) + '</td></tr>';
      document.getElementById('classes-pagination').innerHTML = '';
      App.toast(message, 'error');
    } finally {
      App.setLoading(tableCard, false);
    }
  }

  function openAdd() {
    state.editingId = null;
    form.reset();
    document.getElementById('classes-modal-title').textContent = '新增班级';
    App.showModal('classes-modal');
  }

  function openEdit(id) {
    const item = state.rows.find(function (row) {
      return Number(row.id) === Number(id);
    });
    if (!item) return;

    state.editingId = item.id;
    field('name').value = item.name || '';
    field('code').value = item.code || '';
    field('address').value = item.address || '';
    document.getElementById('classes-modal-title').textContent = '编辑班级';
    App.showModal('classes-modal');
  }

  function openSchedule(id) {
    sessionStorage.setItem('edu_schedule_class_id', String(id));
    if (window.parent && window.parent !== window) {
      window.parent.location.hash = 'schedule';
    } else {
      window.location.href = '../schedule/index.html?class_id=' + id;
    }
  }

  async function removeClass(id) {
    const item = state.rows.find(function (row) {
      return Number(row.id) === Number(id);
    });
    const confirmed = await App.confirmDialog(
      '确定删除班级「' + (item ? item.name : id) + '」吗？此操作不可恢复。',
      { title: '删除确认', confirmText: '删除' }
    );
    if (!confirmed) return;

    try {
      await API.del('/cls/del/' + id);
      App.toast('删除成功');
      if (state.rows.length === 1 && state.page > 1) {
        state.page -= 1;
      }
      await loadList();
    } catch (error) {
      App.toast(friendlyError(error.message), 'error');
    }
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const name = field('name').value.trim();
    const code = field('code').value.trim();
    const address = field('address').value.trim();

    if (!name) {
      App.toast('请输入班级名称', 'warning');
      return;
    }
    if (!code) {
      App.toast('请输入班级编号', 'warning');
      return;
    }

    const submitButton = document.getElementById('classes-submit');
    submitButton.disabled = true;

    try {
      if (state.editingId) {
        await API.put('/cls/update', {
          class_id: state.editingId,
          name: name,
          code: code,
          address: address,
        });
        App.toast('班级信息已修改');
      } else {
        await API.post('/cls/add', {
          name: name,
          code: code,
          address: address,
        });
        App.toast('班级已新增');
        state.page = Math.max(1, Math.ceil((state.total + 1) / state.size));
      }

      App.hideModal('classes-modal');
      await loadList();
    } catch (error) {
      App.toast(friendlyError(error.message), 'error');
    } finally {
      submitButton.disabled = false;
    }
  });

  document.getElementById('search-form').addEventListener('submit', function (event) {
    event.preventDefault();
    state.keyword = document.getElementById('keyword-input').value.trim();
    state.page = 1;
    loadList();
  });

  document.getElementById('search-form').addEventListener('reset', function () {
    state.keyword = '';
    state.page = 1;
    setTimeout(loadList, 0);
  });

  document.getElementById('btn-add').addEventListener('click', openAdd);
  document.getElementById('btn-refresh').addEventListener('click', loadList);

  tbody.addEventListener('click', function (event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const id = Number(button.dataset.id);
    if (button.dataset.action === 'schedule') openSchedule(id);
    if (button.dataset.action === 'edit') openEdit(id);
    if (button.dataset.action === 'delete') removeClass(id);
  });

  loadList();
})();
