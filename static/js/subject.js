/* 课程管理 */
(function () {
  'use strict';

  const App = window.App;
  const API = App.API;

  const state = {
    subjects: [],
    teachers: [],
    keyword: '',
    editingId: null,
  };

  const form = document.getElementById('subject-form');
  const tbody = document.getElementById('subject-tbody');
  const tableCard = document.getElementById('table-card');

  function field(name) {
    return form.querySelector('[name="' + name + '"]');
  }

  function friendlyError(message) {
    if (/1451|foreign key|Cannot delete or update a parent row/i.test(message)) {
      return '该课程仍被教师或成绩记录引用，无法删除';
    }
    return message;
  }

  function render() {
    const keyword = state.keyword.trim().toLowerCase();
    const rows = state.subjects.filter(function (subject) {
      return !keyword || String(subject.name || '').toLowerCase().indexOf(keyword) !== -1;
    });

    document.getElementById('subject-count').textContent = rows.length;

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">暂无课程数据</td></tr>';
      return;
    }

    const teacherCount = {};
    state.teachers.forEach(function (teacher) {
      const key = String(teacher.subject_id);
      teacherCount[key] = (teacherCount[key] || 0) + 1;
    });

    tbody.innerHTML = rows
      .map(function (subject) {
        return (
          '<tr>' +
          '<td class="num">' + subject.id + '</td>' +
          '<td>' + App.escapeHtml(subject.name) + '</td>' +
          '<td><span class="tag ' + (subject.sort === '必修' ? 'tag-blue' : 'tag-gray') + '">' +
          App.escapeHtml(subject.sort || '—') + '</span></td>' +
          '<td class="num">' + (subject.points === null || subject.points === undefined ? '—' : subject.points) + '</td>' +
          '<td class="num">' + (teacherCount[String(subject.id)] || 0) + ' 人</td>' +
          '<td class="text-nowrap">' +
          '<button class="btn btn-link btn-sm" type="button" data-action="edit" data-id="' + subject.id + '">编辑</button>' +
          '<button class="btn btn-link btn-sm text-danger" type="button" data-action="delete" data-id="' + subject.id + '">删除</button>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  async function load() {
    App.setLoading(tableCard, true);
    try {
      const result = await Promise.all([API.get('/sub/all'), API.get('/tea/all')]);
      state.subjects = result[0] || [];
      state.teachers = result[1] || [];
      render();
    } catch (error) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="table-empty">' + App.escapeHtml(error.message) + '</td></tr>';
      App.toast(error.message, 'error');
    } finally {
      App.setLoading(tableCard, false);
    }
  }

  function openAdd() {
    state.editingId = null;
    form.reset();
    field('name').value = '';
    field('sort').value = '必修';
    field('sort').disabled = false;
    field('points').value = '3';
    document.getElementById('subject-edit-hint').style.display = 'none';
    document.getElementById('subject-modal-title').textContent = '新增课程';
    App.showModal('subject-modal');
  }

  function openEdit(id) {
    const subject = state.subjects.find(function (item) {
      return Number(item.id) === Number(id);
    });
    if (!subject) return;

    state.editingId = subject.id;
    field('name').value = subject.name || '';
    field('sort').value = subject.sort || '必修';
    field('sort').disabled = true;
    field('points').value = subject.points === null || subject.points === undefined ? '3' : subject.points;
    document.getElementById('subject-edit-hint').style.display = 'block';
    document.getElementById('subject-modal-title').textContent = '编辑课程';
    App.showModal('subject-modal');
  }

  async function removeSubject(id) {
    const subject = state.subjects.find(function (item) {
      return Number(item.id) === Number(id);
    });
    const confirmed = await App.confirmDialog(
      '确定删除课程「' + (subject ? subject.name : id) + '」吗？若仍被教师或成绩引用，将无法删除。',
      { title: '删除确认', confirmText: '删除' }
    );
    if (!confirmed) return;

    try {
      await API.del('/sub/del/' + id);
      App.toast('删除成功');
      await load();
    } catch (error) {
      App.toast(friendlyError(error.message), 'error');
    }
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const name = field('name').value.trim();
    const points = Number(field('points').value);

    if (!name) {
      App.toast('请输入课程名称', 'warning');
      return;
    }
    if (!Number.isInteger(points) || points < 0 || points > 150) {
      App.toast('学分需为 0 - 150 之间的整数', 'warning');
      return;
    }

    const submitButton = document.getElementById('subject-submit');
    submitButton.disabled = true;

    try {
      if (state.editingId) {
        await API.put('/sub/update', {
          subject_id: state.editingId,
          name: name,
          points: points,
        });
        App.toast('课程信息已修改');
      } else {
        await API.post('/sub/add', {
          name: name,
          sort: field('sort').value,
          points: points,
        });
        App.toast('课程已新增');
      }

      App.hideModal('subject-modal');
      await load();
    } catch (error) {
      App.toast(friendlyError(error.message), 'error');
    } finally {
      submitButton.disabled = false;
    }
  });

  document.getElementById('search-form').addEventListener('submit', function (event) {
    event.preventDefault();
    state.keyword = document.getElementById('keyword-input').value.trim();
    render();
  });

  document.getElementById('search-form').addEventListener('reset', function () {
    state.keyword = '';
    setTimeout(render, 0);
  });

  document.getElementById('btn-add').addEventListener('click', openAdd);
  document.getElementById('btn-refresh').addEventListener('click', load);

  tbody.addEventListener('click', function (event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const id = Number(button.dataset.id);
    if (button.dataset.action === 'edit') openEdit(id);
    if (button.dataset.action === 'delete') removeSubject(id);
  });

  load();
})();
