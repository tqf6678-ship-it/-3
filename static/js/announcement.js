/* 公告管理 */
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
  };

  const form = document.getElementById('announcement-form');
  const tbody = document.getElementById('announcement-tbody');
  const tableCard = document.getElementById('table-card');
  const statusFilter = document.getElementById('status-filter');

  function field(name) {
    return form.querySelector('[name="' + name + '"]');
  }

  function statusTag(status) {
    return Number(status) === 1
      ? '<span class="tag tag-green">已发布</span>'
      : '<span class="tag tag-gray">草稿</span>';
  }

  function renderRows() {
    document.getElementById('announcement-count').textContent = state.total;

    if (!state.rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">暂无公告</td></tr>';
      return;
    }

    tbody.innerHTML = state.rows
      .map(function (item) {
        return (
          '<tr>' +
          '<td class="num">' + item.id + '</td>' +
          '<td class="announcement-title-cell" title="' + App.escapeHtml(item.title) + '">' +
          App.escapeHtml(item.title) + '</td>' +
          '<td>' + statusTag(item.status) + '</td>' +
          '<td class="num">' + App.fmtDateTime(item.create_time) + '</td>' +
          '<td class="num">' + App.fmtDateTime(item.update_time) + '</td>' +
          '<td class="text-nowrap">' +
          '<button class="btn btn-link btn-sm" type="button" data-action="view" data-id="' + item.id + '">查看</button>' +
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

    const params = new URLSearchParams();
    params.set('page', state.page);
    params.set('size', state.size);
    if (state.keyword) params.set('keyword', state.keyword);
    if (state.status !== -1) params.set('status', state.status);

    try {
      const data = await API.get('/ann/list?' + params.toString());
      state.rows = data.rows || [];
      state.total = Number(data.total || 0);
      state.page = Number(data.page || 1);
      state.size = Number(data.size || state.size);

      renderRows();
      App.renderPagination(
        document.getElementById('announcement-pagination'),
        data,
        function (page) {
          state.page = page;
          loadList();
        }
      );
    } catch (error) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="table-empty">' + App.escapeHtml(error.message) + '</td></tr>';
      document.getElementById('announcement-count').textContent = '0';
      document.getElementById('announcement-pagination').innerHTML = '';
      App.toast(error.message, 'error');
    } finally {
      App.setLoading(tableCard, false);
    }
  }

  function openAdd() {
    state.editingId = null;
    form.reset();
    field('title').value = '';
    field('content').value = '';
    field('status').value = '1';
    document.getElementById('announcement-modal-title').textContent = '新增公告';
    App.showModal('announcement-modal');
  }

  function openEdit(id) {
    const item = state.rows.find(function (row) {
      return Number(row.id) === Number(id);
    });
    if (!item) return;

    state.editingId = item.id;
    field('title').value = item.title || '';
    field('content').value = item.content || '';
    field('status').value = String(item.status);
    document.getElementById('announcement-modal-title').textContent = '编辑公告';
    App.showModal('announcement-modal');
  }

  function openView(id) {
    const item = state.rows.find(function (row) {
      return Number(row.id) === Number(id);
    });
    if (!item) return;

    document.getElementById('view-title').textContent = item.title || '';
    document.getElementById('view-meta').textContent =
      (Number(item.status) === 1 ? '已发布' : '草稿') +
      ' · 创建：' + App.fmtDateTime(item.create_time) +
      ' · 更新：' + App.fmtDateTime(item.update_time);
    document.getElementById('view-content').textContent = item.content || '';
    App.showModal('view-modal');
  }

  async function removeAnnouncement(id) {
    const item = state.rows.find(function (row) {
      return Number(row.id) === Number(id);
    });
    const confirmed = await App.confirmDialog(
      '确定删除公告「' + (item ? item.title : id) + '」吗？此操作不可恢复。',
      { title: '删除确认', confirmText: '删除' }
    );
    if (!confirmed) return;

    try {
      await API.del('/ann/del/' + id);
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

    const title = field('title').value.trim();
    const content = field('content').value.trim();
    const status = Number(field('status').value);

    if (!title) {
      App.toast('请输入公告标题', 'warning');
      return;
    }
    if (!content) {
      App.toast('请输入公告内容', 'warning');
      return;
    }

    const submitButton = document.getElementById('announcement-submit');
    submitButton.disabled = true;

    try {
      if (state.editingId) {
        await API.put('/ann/update', {
          announcement_id: state.editingId,
          title: title,
          content: content,
          status: status,
        });
        App.toast('公告已修改');
      } else {
        await API.post('/ann/add', {
          title: title,
          content: content,
          status: status,
        });
        App.toast('公告已新增');
        state.page = 1;
      }

      App.hideModal('announcement-modal');
      await loadList();
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
    if (button.dataset.action === 'view') openView(id);
    if (button.dataset.action === 'edit') openEdit(id);
    if (button.dataset.action === 'delete') removeAnnouncement(id);
  });

  loadList();
})();
