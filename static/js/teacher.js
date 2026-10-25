/* 教师管理 */
(function () {
  'use strict';

  const App = window.App;
  const API = App.API;

  const state = {
    teachers: [],
    subjects: [],
    keyword: '',
    subjectId: '',
    deletingTeacher: null,
    deleteRefs: null,
  };

  const tbody = document.getElementById('teacher-tbody');
  const tableCard = document.getElementById('table-card');
  const subjectFilter = document.getElementById('subject-filter');

  function subjectName(id) {
    const subject = state.subjects.find(function (item) {
      return Number(item.id) === Number(id);
    });
    return subject ? subject.name : '科目 #' + id;
  }

  function detailItem(label, value) {
    return (
      '<div class="detail-item"><div class="label">' + label + '</div><div class="value">' +
      App.escapeHtml(value) + '</div></div>'
    );
  }

  function fillSubjectFilter() {
    const current = subjectFilter.value;
    subjectFilter.innerHTML =
      '<option value="">全部科目</option>' +
      state.subjects
        .map(function (subject) {
          return '<option value="' + subject.id + '">' + App.escapeHtml(subject.name) + '</option>';
        })
        .join('');
    subjectFilter.value = current;
  }

  function render() {
    const keyword = state.keyword.trim().toLowerCase();
    const rows = state.teachers.filter(function (teacher) {
      const matchKeyword =
        !keyword || String(teacher.name || '').toLowerCase().indexOf(keyword) !== -1;
      const matchSubject =
        !state.subjectId || Number(teacher.subject_id) === Number(state.subjectId);
      return matchKeyword && matchSubject;
    });

    document.getElementById('teacher-count').textContent = rows.length;

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="table-empty">暂无教师数据</td></tr>';
      return;
    }

    tbody.innerHTML = rows
      .map(function (teacher) {
        return (
          '<tr>' +
          '<td class="num">' + teacher.id + '</td>' +
          '<td>' + App.escapeHtml(teacher.name) + '</td>' +
          '<td>' + App.escapeHtml(App.fmtGender(teacher.gender)) + '</td>' +
          '<td class="num">' + (teacher.age === null || teacher.age === undefined ? '—' : teacher.age) + '</td>' +
          '<td>' + App.escapeHtml(subjectName(teacher.subject_id)) + '</td>' +
          '<td>' + App.escapeHtml(teacher.phone || '—') + '</td>' +
          '<td class="num">' + (teacher.class_id === null || teacher.class_id === undefined ? '—' : teacher.class_id) + '</td>' +
          '<td class="text-nowrap">' +
          '<button class="btn btn-link btn-sm" type="button" data-action="detail" data-id="' + teacher.id + '">详情</button>' +
          '<button class="btn btn-link btn-sm text-danger" type="button" data-action="delete" data-id="' + teacher.id + '">删除</button>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  async function load() {
    App.setLoading(tableCard, true);
    try {
      const result = await Promise.all([API.get('/tea/all'), API.get('/sub/all')]);
      state.teachers = result[0] || [];
      state.subjects = result[1] || [];
      fillSubjectFilter();
      render();
    } catch (error) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="table-empty">' + App.escapeHtml(error.message) + '</td></tr>';
      App.toast(error.message, 'error');
    } finally {
      App.setLoading(tableCard, false);
    }
  }

  async function openDetail(id) {
    const content = document.getElementById('detail-content');
    content.innerHTML = '<div class="empty-state">加载中…</div>';
    App.showModal('detail-modal');

    try {
      const teacher = await API.get('/tea/one/' + id);
      const students = teacher.stu || [];
      const studentBlock = students.length
        ? '<div class="table-responsive"><table class="table table-sm">' +
          '<thead><tr><th>ID</th><th>姓名</th><th>性别</th><th>年级</th><th>班级</th></tr></thead><tbody>' +
          students
            .map(function (student) {
              return (
                '<tr><td class="num">' + student.id + '</td>' +
                '<td>' + App.escapeHtml(student.name) + '</td>' +
                '<td>' + App.escapeHtml(App.fmtGender(student.gender)) + '</td>' +
                '<td>' + App.escapeHtml(student.grade || '—') + '</td>' +
                '<td class="num">' + (student.class_id === null || student.class_id === undefined ? '—' : student.class_id) + '</td></tr>'
              );
            })
            .join('') +
          '</tbody></table></div>'
        : '<div class="empty-state">该教师名下暂无学生</div>';

      content.innerHTML =
        '<div class="detail-grid">' +
        detailItem('姓名', teacher.name) +
        detailItem('性别', App.fmtGender(teacher.gender)) +
        detailItem('年龄', teacher.age === null || teacher.age === undefined ? '—' : teacher.age) +
        detailItem('任教科目', subjectName(teacher.subject_id)) +
        detailItem('联系电话', teacher.phone || '—') +
        detailItem('班级', teacher.class_id === null || teacher.class_id === undefined ? '—' : teacher.class_id + ' 班') +
        detailItem('创建时间', App.fmtDateTime(teacher.create_time)) +
        '</div>' +
        '<div class="section-title">所带学生</div>' +
        studentBlock;
    } catch (error) {
      content.innerHTML = '<div class="empty-state">' + App.escapeHtml(error.message) + '</div>';
    }
  }

  async function removeTeacher(id) {
    const teacher = state.teachers.find(function (item) {
      return Number(item.id) === Number(id);
    });
    if (!teacher) return;

    let refs;
    try {
      refs = await API.get('/tea/refs/' + id);
    } catch (error) {
      App.toast(error.message, 'error');
      return;
    }

    state.deletingTeacher = teacher;
    state.deleteRefs = refs;

    const info = document.getElementById('delete-info');
    const replaceWrap = document.getElementById('replace-wrap');
    const select = document.getElementById('replace-teacher');
    const confirmButton = document.getElementById('confirm-delete');

    if (refs.students > 0) {
      info.textContent =
        '该教师名下还有 ' + refs.students + ' 名学生，删除前请选择接替教师。' +
        '该教师的 ' + refs.schedules + ' 条排课记录也会一并删除。';

      const options = state.teachers.filter(function (item) {
        return Number(item.id) !== Number(id);
      });

      if (!options.length) {
        select.innerHTML = '<option value="">没有其他教师可以接替</option>';
        select.disabled = true;
        confirmButton.disabled = true;
      } else {
        select.disabled = false;
        select.innerHTML =
          '<option value="">请选择接替教师</option>' +
          options
            .map(function (item) {
              return '<option value="' + item.id + '">' +
                App.escapeHtml(item.name) + '（' + App.escapeHtml(subjectName(item.subject_id)) + '）' +
                '</option>';
            })
            .join('');
        confirmButton.disabled = false;
      }
      replaceWrap.hidden = false;
    } else {
      info.textContent =
        '该教师没有名下学生。该教师的 ' + refs.schedules + ' 条排课记录会一并删除。';
      replaceWrap.hidden = true;
      select.innerHTML = '';
      select.disabled = false;
      confirmButton.disabled = false;
    }

    App.showModal('delete-modal');
  }

  document.getElementById('confirm-delete').addEventListener('click', async function () {
    const teacher = state.deletingTeacher;
    if (!teacher) return;

    const refs = state.deleteRefs || { students: 0, schedules: 0 };
    let url = '/tea/del/' + teacher.id;

    if (refs.students > 0) {
      const replaceId = Number(document.getElementById('replace-teacher').value);
      if (!replaceId) {
        App.toast('请选择接替教师', 'warning');
        return;
      }
      url += '?replace_teacher_id=' + replaceId;
    }

    const button = this;
    button.disabled = true;

    try {
      await API.del(url);
      App.hideModal('delete-modal');
      App.toast('删除成功');
      state.deletingTeacher = null;
      state.deleteRefs = null;
      await load();
    } catch (error) {
      App.toast(error.message, 'error');
    } finally {
      button.disabled = false;
    }
  });

  document.getElementById('search-form').addEventListener('submit', function (event) {
    event.preventDefault();
    state.keyword = document.getElementById('keyword-input').value.trim();
    state.subjectId = subjectFilter.value;
    render();
  });

  document.getElementById('search-form').addEventListener('reset', function () {
    state.keyword = '';
    state.subjectId = '';
    setTimeout(function () {
      subjectFilter.value = '';
      render();
    }, 0);
  });

  subjectFilter.addEventListener('change', function () {
    state.subjectId = subjectFilter.value;
    render();
  });

  document.getElementById('btn-refresh').addEventListener('click', load);

  tbody.addEventListener('click', function (event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const id = Number(button.dataset.id);
    if (button.dataset.action === 'detail') openDetail(id);
    if (button.dataset.action === 'delete') removeTeacher(id);
  });

  load();
})();
