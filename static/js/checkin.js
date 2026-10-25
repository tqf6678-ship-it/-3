/* 学生报到 */
(function () {
  'use strict';

  const App = window.App;
  const API = App.API;

  const state = {
    classes: [],
    classId: 0,
    status: 'all',
    keyword: '',
    page: 1,
    size: 100,
    total: 0,
    rows: [],
    checkingStudent: null,
  };

  const tbody = document.getElementById('checkin-tbody');
  const tableCard = document.getElementById('table-card');
  const notice = document.getElementById('checkin-notice');
  const classSelect = document.getElementById('class-select');
  const statusSelect = document.getElementById('status-select');
  const batchButton = document.getElementById('btn-checkin-all');
  const form = document.getElementById('checkin-form');

  function showNotice(message) {
    notice.textContent = message;
    notice.hidden = false;
  }

  function hideNotice() {
    notice.hidden = true;
    notice.textContent = '';
  }

  function friendlyError(message) {
    if (/1146|doesn't exist|does not exist/i.test(message) && /student_checkins/i.test(message)) {
      return '报到表尚未创建，请先执行 org/sql/student_checkins.sql';
    }
    if (/1062|Duplicate entry/i.test(message)) {
      return '该学生已有报到记录';
    }
    return message;
  }

  function fillClassSelect() {
    classSelect.innerHTML =
      '<option value="0">全部班级</option>' +
      state.classes
        .map(function (item) {
          return '<option value="' + item.id + '">' + App.escapeHtml(item.name) + '（' + App.escapeHtml(item.code) + '）</option>';
        })
        .join('');
    classSelect.value = String(state.classId);
  }

  function updateBatchButton() {
    batchButton.disabled = !state.classId;
  }

  async function loadClasses() {
    try {
      state.classes = (await API.get('/cls/all')) || [];
    } catch (error) {
      state.classes = [];
      App.toast(friendlyError(error.message), 'error');
    }
    fillClassSelect();
  }

  function renderStats(stats) {
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-checked').textContent = stats.checked;
    document.getElementById('stat-unchecked').textContent = stats.unchecked;
    document.getElementById('stat-rate').textContent = stats.rate + '%';
    document.getElementById('stat-rate-bar').style.width = Math.min(100, stats.rate) + '%';
  }

  function renderRows() {
    document.getElementById('checkin-count').textContent = state.total;

    if (!state.rows.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="table-empty">暂无学生数据</td></tr>';
      return;
    }

    tbody.innerHTML = state.rows
      .map(function (student) {
        const checked = Number(student.checked_in) === 1;
        return (
          '<tr>' +
          '<td class="num">' + student.id + '</td>' +
          '<td>' + App.escapeHtml(student.name) + '</td>' +
          '<td>' + App.escapeHtml(App.fmtGender(student.gender)) + '</td>' +
          '<td>' + App.escapeHtml(student.grade || '—') + '</td>' +
          '<td>' + App.escapeHtml(student.class_name || '—') + '</td>' +
          '<td>' + App.escapeHtml(student.teacher_name || '—') + '</td>' +
          '<td>' + (checked ? '<span class="tag tag-green">已报到</span>' : '<span class="tag tag-gray">未报到</span>') + '</td>' +
          '<td class="num">' + App.fmtDateTime(student.checkin_time) + '</td>' +
          '<td>' + App.escapeHtml(student.remark || '—') + '</td>' +
          '<td class="text-nowrap">' +
          (checked
            ? '<button class="btn btn-link btn-sm text-danger" type="button" data-action="undo" data-id="' + student.id + '">撤销</button>'
            : '<button class="btn btn-link btn-sm" type="button" data-action="checkin" data-id="' + student.id + '">报到</button>') +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  async function loadAll() {
    App.setLoading(tableCard, true);

    const statsParams = new URLSearchParams();
    statsParams.set('class_id', state.classId);
    if (state.keyword) statsParams.set('keyword', state.keyword);

    const listParams = new URLSearchParams();
    listParams.set('page', state.page);
    listParams.set('size', state.size);
    listParams.set('class_id', state.classId);
    listParams.set('status', state.status);
    if (state.keyword) listParams.set('keyword', state.keyword);

    try {
      const result = await Promise.all([
        API.get('/chk/stats?' + statsParams.toString()),
        API.get('/chk/list?' + listParams.toString()),
      ]);

      const stats = result[0];
      const data = result[1];

      state.rows = data.rows || [];
      state.total = Number(data.total || 0);
      state.page = Number(data.page || 1);
      state.size = Number(data.size || state.size);

      hideNotice();
      renderStats(stats);
      renderRows();
      App.renderPagination(document.getElementById('checkin-pagination'), data, function (page) {
        state.page = page;
        loadAll();
      });
    } catch (error) {
      const message = friendlyError(error.message);
      showNotice(message);
      renderStats({ total: 0, checked: 0, unchecked: 0, rate: 0 });
      tbody.innerHTML =
        '<tr><td colspan="10" class="table-empty">' + App.escapeHtml(message) + '</td></tr>';
      document.getElementById('checkin-count').textContent = '0';
      document.getElementById('checkin-pagination').innerHTML = '';
      App.toast(message, 'error');
    } finally {
      App.setLoading(tableCard, false);
    }
  }

  function openCheckinModal(student) {
    state.checkingStudent = student;
    document.getElementById('checkin-modal-title').textContent = '学生报到';
    document.getElementById('checkin-student-info').textContent =
      student.name + ' · ' + (student.class_name || '未分班') + ' · ' + (student.grade || '');
    document.getElementById('checkin-remark').value = '';
    App.showModal('checkin-modal');
  }

  async function undoCheckin(student) {
    const confirmed = await App.confirmDialog(
      '确定撤销「' + student.name + '」的报到状态吗？',
      { title: '撤销报到', confirmText: '撤销' }
    );
    if (!confirmed) return;

    try {
      await API.post('/chk/undo', { student_id: student.id });
      App.toast('已撤销报到');
      await loadAll();
    } catch (error) {
      App.toast(friendlyError(error.message), 'error');
    }
  }

  async function checkinAll() {
    if (!state.classId) {
      App.toast('请先在筛选条件中选择一个班级', 'warning');
      return;
    }

    const klass = state.classes.find(function (item) {
      return Number(item.id) === Number(state.classId);
    });
    const className = klass ? klass.name : '当前班级';
    const confirmed = await App.confirmDialog(
      '确定为「' + className + '」中所有未报到的学生办理报到吗？',
      { title: '批量报到', confirmText: '全部报到', danger: false }
    );
    if (!confirmed) return;

    try {
      const data = await API.post('/chk/checkin-all', {
        class_id: state.classId,
        remark: '批量报到',
      });
      App.toast('已完成 ' + (data.count || 0) + ' 名学生的报到');
      await loadAll();
    } catch (error) {
      App.toast(friendlyError(error.message), 'error');
    }
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!state.checkingStudent) return;

    const remark = document.getElementById('checkin-remark').value.trim();
    const submitButton = document.getElementById('checkin-submit');
    submitButton.disabled = true;

    try {
      await API.post('/chk/checkin', {
        student_id: state.checkingStudent.id,
        remark: remark,
      });
      App.hideModal('checkin-modal');
      App.toast('报到成功');
      await loadAll();
    } catch (error) {
      App.toast(friendlyError(error.message), 'error');
    } finally {
      submitButton.disabled = false;
    }
  });

  document.getElementById('search-form').addEventListener('submit', function (event) {
    event.preventDefault();
    state.keyword = document.getElementById('keyword-input').value.trim();
    state.classId = Number(classSelect.value) || 0;
    state.status = statusSelect.value;
    state.page = 1;
    updateBatchButton();
    loadAll();
  });

  document.getElementById('search-form').addEventListener('reset', function () {
    state.keyword = '';
    state.classId = 0;
    state.status = 'all';
    state.page = 1;
    setTimeout(function () {
      classSelect.value = '0';
      statusSelect.value = 'all';
      updateBatchButton();
      loadAll();
    }, 0);
  });

  classSelect.addEventListener('change', function () {
    state.classId = Number(classSelect.value) || 0;
    state.page = 1;
    updateBatchButton();
    loadAll();
  });

  statusSelect.addEventListener('change', function () {
    state.status = statusSelect.value;
    state.page = 1;
    loadAll();
  });

  document.getElementById('btn-refresh').addEventListener('click', loadAll);
  batchButton.addEventListener('click', checkinAll);

  tbody.addEventListener('click', function (event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const id = Number(button.dataset.id);
    const student = state.rows.find(function (item) {
      return Number(item.id) === id;
    });
    if (!student) return;

    if (button.dataset.action === 'checkin') openCheckinModal(student);
    if (button.dataset.action === 'undo') undoCheckin(student);
  });

  async function init() {
    await loadClasses();
    updateBatchButton();
    await loadAll();
  }

  init();
})();
