/* 成绩管理 */
(function () {
  'use strict';

  const App = window.App;
  const API = App.API;

  const state = {
    students: [],
    currentStudent: null,
    studentPage: 1,
    studentSize: 10,
    listPage: 1,
    listSize: 10,
  };

  const studentNoInput = document.getElementById('keyword-student-no');
  const nameInput = document.getElementById('keyword-name');
  const resultCard = document.getElementById('result-card');
  const tbody = document.getElementById('score-tbody');
  const subjectTbody = document.getElementById('score-subject-tbody');
  const studentInfo = document.getElementById('score-student-info');

  function renderResults() {
    if (!state.students.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-empty">未找到匹配的学生</td></tr>';
      return;
    }

    tbody.innerHTML = state.students
      .map(function (student) {
        return (
          '<tr>' +
          '<td class="num">' + student.id + '</td>' +
          '<td>' + App.escapeHtml(student.name) + '</td>' +
          '<td>' + App.escapeHtml(App.fmtGender(student.gender)) + '</td>' +
          '<td>' + App.escapeHtml(student.grade || '—') + '</td>' +
          '<td>' + App.escapeHtml(student.class_name || '—') + '</td>' +
          '<td>' + App.escapeHtml(student.teacher_name || '—') + '</td>' +
          '<td class="text-nowrap">' +
          '<button class="btn btn-link btn-sm" type="button" data-action="score" data-id="' + student.id + '">录入成绩</button>' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  async function searchStudents() {
    const studentNo = studentNoInput.value.trim();
    const name = nameInput.value.trim();

    const params = new URLSearchParams();
    params.set('page', state.studentPage);
    params.set('size', state.studentSize);
    if (studentNo) params.set('student_no', studentNo);
    if (name) params.set('name', name);

    App.setLoading(resultCard, true);
    try {
      const data = await API.get('/sco/students?' + params.toString());
      state.students = data.rows || [];
      state.studentPage = Number(data.page || 1);
      state.studentSize = Number(data.size || state.studentSize);

      document.getElementById('score-count').textContent = data.total;
      renderResults();
      App.renderPagination(document.getElementById('student-pagination'), data, function (page) {
        state.studentPage = page;
        searchStudents();
      });
    } catch (error) {
      state.students = [];
      document.getElementById('score-count').textContent = '0';
      tbody.innerHTML =
        '<tr><td colspan="7" class="table-empty">' + App.escapeHtml(error.message) + '</td></tr>';
      document.getElementById('student-pagination').innerHTML = '';
      App.toast(error.message, 'error');
    } finally {
      App.setLoading(resultCard, false);
    }
  }

  function renderStudentInfo(student) {
    studentInfo.textContent =
      '学号：' + student.id +
      '　姓名：' + student.name +
      '　年级：' + (student.grade || '—') +
      '　班级：' + (student.class_name || '—');
  }

  function renderSubjects(subjects) {
    if (!subjects.length) {
      subjectTbody.innerHTML =
        '<tr><td colspan="4" class="table-empty">暂无可录入的科目</td></tr>';
      return;
    }

    subjectTbody.innerHTML = subjects
      .map(function (item) {
        const current =
          item.score_num === null || item.score_num === undefined
            ? '—'
            : App.fmtScore(item.score_num);
        const inputValue =
          item.score_num === null || item.score_num === undefined ? '' : item.score_num;
        return (
          '<tr>' +
          '<td>' + App.escapeHtml(item.subject_name) + '</td>' +
          '<td>' + App.escapeHtml(item.teacher_names || '—') + '</td>' +
          '<td class="score-current">' + App.escapeHtml(current) + '</td>' +
          '<td>' +
          '<input class="form-control form-control-sm score-input" type="number" min="0" max="150" step="0.5" ' +
          'data-subject-id="' + item.subject_id + '" ' +
          'data-subject-name="' + App.escapeHtml(item.subject_name) + '" ' +
          'value="' + App.escapeHtml(inputValue) + '">' +
          '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  async function loadSubjects(student) {
    subjectTbody.innerHTML = '<tr><td colspan="4" class="table-empty">加载中…</td></tr>';
    try {
      const data = await API.get('/sco/subjects?student_id=' + student.id);
      state.currentStudent = data.student || student;
      renderStudentInfo(state.currentStudent);
      renderSubjects(data.subjects || []);
    } catch (error) {
      subjectTbody.innerHTML =
        '<tr><td colspan="4" class="table-empty">' + App.escapeHtml(error.message) + '</td></tr>';
      App.toast(error.message, 'error');
    }
  }

  function openScoreModal(student) {
    state.currentStudent = student;
    renderStudentInfo(student);
    document.getElementById('score-modal-title').textContent = '成绩录入 · ' + student.name;
    subjectTbody.innerHTML = '<tr><td colspan="4" class="table-empty">加载中…</td></tr>';
    App.showModal('score-modal');
    loadSubjects(student);
  }

  async function saveScores() {
    if (!state.currentStudent) return;

    const inputs = Array.from(subjectTbody.querySelectorAll('.score-input'));
    const scores = [];
    let invalid = false;

    inputs.forEach(function (input) {
      const raw = input.value.trim();
      if (!raw) return;

      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0 || value > 150) {
        invalid = true;
        App.toast('「' + input.dataset.subjectName + '」成绩需在 0-150 之间', 'warning');
        input.focus();
        return;
      }

      scores.push({
        subject_id: Number(input.dataset.subjectId),
        score: value,
      });
    });

    if (invalid) return;
    if (!scores.length) {
      App.toast('请至少填写一科成绩', 'warning');
      return;
    }

    const saveButton = document.getElementById('score-save');
    saveButton.disabled = true;

    try {
      await API.post('/sco/save', {
        student_id: state.currentStudent.id,
        scores: scores,
      });
      App.toast('已保存 ' + scores.length + ' 科成绩');
      await loadSubjects(state.currentStudent);
    } catch (error) {
      App.toast(error.message, 'error');
    } finally {
      saveButton.disabled = false;
    }
  }

  document.getElementById('search-form').addEventListener('submit', function (event) {
    event.preventDefault();
    state.studentPage = 1;
    searchStudents();
  });

  document.getElementById('search-form').addEventListener('reset', function () {
    state.studentPage = 1;
    setTimeout(searchStudents, 0);
  });

  tbody.addEventListener('click', function (event) {
    const button = event.target.closest('[data-action="score"]');
    if (!button) return;

    const id = Number(button.dataset.id);
    const student = state.students.find(function (item) {
      return Number(item.id) === id;
    });
    if (student) openScoreModal(student);
  });

  document.getElementById('score-save').addEventListener('click', saveScores);

  // ---------------- 成绩查询 ----------------

  function renderScoreList(rows) {
    const listBody = document.getElementById('score-list-tbody');

    if (!rows.length) {
      listBody.innerHTML = '<tr><td colspan="6" class="table-empty">暂无成绩数据</td></tr>';
      return;
    }

    listBody.innerHTML = rows
      .map(function (row) {
        const score =
          row.score_num === null || row.score_num === undefined
            ? row.score
            : row.score_num;
        return (
          '<tr>' +
          '<td class="num">' + row.student_id + '</td>' +
          '<td>' + App.escapeHtml(row.student_name) + '</td>' +
          '<td>' + App.escapeHtml(row.grade || '—') + '</td>' +
          '<td>' + App.escapeHtml(row.class_name || '—') + '</td>' +
          '<td>' + App.escapeHtml(row.subject_name) + '</td>' +
          '<td class="num score-list-score">' + App.escapeHtml(App.fmtScore(score)) + '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  async function loadFilterOptions() {
    try {
      const result = await Promise.all([API.get('/cls/all'), API.get('/sub/all')]);
      const classes = result[0] || [];
      const subjects = result[1] || [];

      document.getElementById('filter-class').innerHTML =
        '<option value="0">全部班级</option>' +
        classes
          .map(function (item) {
            return '<option value="' + item.id + '">' + App.escapeHtml(item.name) + '</option>';
          })
          .join('');

      document.getElementById('filter-subject').innerHTML =
        '<option value="0">全部科目</option>' +
        subjects
          .map(function (item) {
            return '<option value="' + item.id + '">' + App.escapeHtml(item.name) + '</option>';
          })
          .join('');
    } catch (error) {
      App.toast('筛选条件加载失败：' + error.message, 'error');
    }
  }

  async function loadScoreList() {
    const studentNo = document.getElementById('filter-student-no').value.trim();
    const name = document.getElementById('filter-name').value.trim();
    const classId = Number(document.getElementById('filter-class').value) || 0;
    const subjectId = Number(document.getElementById('filter-subject').value) || 0;
    const minRaw = document.getElementById('filter-min').value.trim();
    const maxRaw = document.getElementById('filter-max').value.trim();
    const minScore = minRaw === '' ? null : Number(minRaw);
    const maxScore = maxRaw === '' ? null : Number(maxRaw);

    if (minScore !== null && (!Number.isFinite(minScore) || minScore < 0 || minScore > 150)) {
      App.toast('最低分需在 0-150 之间', 'warning');
      return;
    }
    if (maxScore !== null && (!Number.isFinite(maxScore) || maxScore < 0 || maxScore > 150)) {
      App.toast('最高分需在 0-150 之间', 'warning');
      return;
    }
    if (minScore !== null && maxScore !== null && minScore > maxScore) {
      App.toast('最低分不能大于最高分', 'warning');
      return;
    }

    const params = new URLSearchParams();
    params.set('page', state.listPage);
    params.set('size', state.listSize);
    if (studentNo) params.set('student_no', studentNo);
    if (name) params.set('name', name);
    if (classId) params.set('class_id', classId);
    if (subjectId) params.set('subject_id', subjectId);
    if (minScore !== null) params.set('min_score', minScore);
    if (maxScore !== null) params.set('max_score', maxScore);

    const card = document.getElementById('score-list-card');
    App.setLoading(card, true);

    try {
      const data = await API.get('/sco/list?' + params.toString());
      state.listPage = Number(data.page || 1);
      state.listSize = Number(data.size || state.listSize);

      document.getElementById('score-list-count').textContent = data.total;
      renderScoreList(data.rows || []);
      App.renderPagination(document.getElementById('score-list-pagination'), data, function (page) {
        state.listPage = page;
        loadScoreList();
      });
    } catch (error) {
      document.getElementById('score-list-tbody').innerHTML =
        '<tr><td colspan="6" class="table-empty">' + App.escapeHtml(error.message) + '</td></tr>';
      document.getElementById('score-list-count').textContent = '0';
      document.getElementById('score-list-pagination').innerHTML = '';
      App.toast(error.message, 'error');
    } finally {
      App.setLoading(card, false);
    }
  }

  document.getElementById('score-filter-form').addEventListener('submit', function (event) {
    event.preventDefault();
    state.listPage = 1;
    loadScoreList();
  });

  document.getElementById('score-filter-form').addEventListener('reset', function () {
    state.listPage = 1;
    setTimeout(loadScoreList, 0);
  });

  async function init() {
    await Promise.all([loadFilterOptions(), searchStudents(), loadScoreList()]);
  }

  init();
})();
