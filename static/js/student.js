/* 学生管理 */
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
    teachers: [],
    subjects: [],
    editingId: null,
    subjectsStudent: null,
  };

  const form = document.getElementById('student-form');
  const tbody = document.getElementById('student-tbody');
  const tableCard = document.getElementById('table-card');

  function field(name) {
    return form.querySelector('[name="' + name + '"]');
  }

  function teacherName(id) {
    const teacher = state.teachers.find(function (item) {
      return Number(item.id) === Number(id);
    });
    return teacher ? teacher.name : '#' + id;
  }

  function subjectName(id) {
    const subject = state.subjects.find(function (item) {
      return Number(item.id) === Number(id);
    });
    return subject ? subject.name : '科目 #' + id;
  }

  function friendlyError(message) {
    if (/1451|foreign key|Cannot delete or update a parent row/i.test(message)) {
      return '该学生仍有成绩记录，请先删除其成绩后再删除学生';
    }
    return message;
  }

  function detailItem(label, value) {
    return (
      '<div class="detail-item"><div class="label">' + label + '</div><div class="value">' +
      App.escapeHtml(value) + '</div></div>'
    );
  }

  async function loadRefs() {
    try {
      const result = await Promise.all([API.get('/tea/all'), API.get('/sub/all')]);
      state.teachers = result[0] || [];
      state.subjects = result[1] || [];
    } catch (error) {
      App.toast('基础数据加载失败：' + error.message, 'error');
    }
  }

  function renderRows() {
    if (!state.rows.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="table-empty">暂无学生数据</td></tr>';
      return;
    }

    tbody.innerHTML = state.rows
      .map(function (student) {
        return (
          '<tr>' +
          '<td class="num">' + student.id + '</td>' +
          '<td>' + App.escapeHtml(student.name) + '</td>' +
          '<td>' + App.escapeHtml(App.fmtGender(student.gender)) + '</td>' +
          '<td class="num">' + (student.age === null || student.age === undefined ? '—' : student.age) + '</td>' +
          '<td>' + App.escapeHtml(student.grade || '—') + '</td>' +
          '<td class="num">' + (student.class_id === null || student.class_id === undefined ? '—' : student.class_id) + '</td>' +
          '<td>' + App.escapeHtml(teacherName(student.teacher_id)) + '</td>' +
          '<td>' + App.fmtDate(student.enrollment_date) + '</td>' +
          '<td class="text-nowrap">' +
          '<button class="btn btn-link btn-sm" type="button" data-action="subjects" data-id="' + student.id + '">科目</button>' +
          '<button class="btn btn-link btn-sm" type="button" data-action="detail" data-id="' + student.id + '">详情</button>' +
          '<button class="btn btn-link btn-sm" type="button" data-action="edit" data-id="' + student.id + '">编辑</button>' +
          '<button class="btn btn-link btn-sm text-danger" type="button" data-action="delete" data-id="' + student.id + '">删除</button>' +
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

      const data = await API.get('/stu/page?' + params.toString());
      state.rows = data.rows || [];
      state.total = Number(data.total || 0);
      state.page = Number(data.page || 1);
      state.size = Number(data.size || state.size);

      renderRows();
      App.renderPagination(document.getElementById('student-pagination'), data, function (page) {
        state.page = page;
        loadList();
      });
    } catch (error) {
      tbody.innerHTML =
        '<tr><td colspan="9" class="table-empty">' + App.escapeHtml(error.message) + '</td></tr>';
      document.getElementById('student-pagination').innerHTML = '';
      App.toast(error.message, 'error');
    } finally {
      App.setLoading(tableCard, false);
    }
  }

  function fillTeacherOptions(selectedId) {
    const select = field('teacher_id');
    if (!state.teachers.length) {
      select.innerHTML = '<option value="">暂无教师数据</option>';
      return;
    }
    select.innerHTML = state.teachers
      .map(function (teacher) {
        return '<option value="' + teacher.id + '">' + App.escapeHtml(teacher.name) + '（ID ' + teacher.id + '）</option>';
      })
      .join('');
    if (selectedId !== null && selectedId !== undefined) {
      select.value = String(selectedId);
    }
  }

  function setEditMode(editing) {
    ['gender', 'teacher_id', 'class_id', 'enrollment_date'].forEach(function (name) {
      field(name).disabled = editing;
    });
    document.getElementById('student-edit-hint').style.display = editing ? 'block' : 'none';
  }

  function openAdd() {
    if (!state.teachers.length) {
      App.toast('暂无可选教师，无法新增学生', 'warning');
      return;
    }
    state.editingId = null;
    form.reset();
    field('name').value = '';
    field('gender').value = '男';
    field('age').value = '18';
    field('grade').value = '高一';
    field('class_id').value = '1';
    field('enrollment_date').value = '';
    fillTeacherOptions(null);
    setEditMode(false);
    document.getElementById('student-modal-title').textContent = '新增学生';
    App.showModal('student-modal');
  }

  function openEdit(id) {
    const student = state.rows.find(function (item) {
      return Number(item.id) === Number(id);
    });
    if (!student) return;

    state.editingId = student.id;
    field('name').value = student.name || '';
    field('gender').value = App.fmtGender(student.gender) === '女' ? '女' : '男';
    field('age').value = student.age === null || student.age === undefined ? '' : student.age;
    field('grade').value = student.grade || '高一';
    field('class_id').value = student.class_id === null || student.class_id === undefined ? '1' : student.class_id;
    field('enrollment_date').value = student.enrollment_date ? String(student.enrollment_date).slice(0, 10) : '';
    fillTeacherOptions(student.teacher_id);
    setEditMode(true);
    document.getElementById('student-modal-title').textContent = '编辑学生';
    App.showModal('student-modal');
  }

  async function openDetail(id) {
    const content = document.getElementById('detail-content');
    content.innerHTML = '<div class="empty-state">加载中…</div>';
    App.showModal('detail-modal');

    try {
      const student = await API.get('/stu/one/' + id);
      const scores = student.score || [];
      const scoreBlock = scores.length
        ? '<div class="table-responsive"><table class="table table-sm">' +
          '<thead><tr><th>课程</th><th>成绩</th></tr></thead><tbody>' +
          scores
            .map(function (item) {
              return (
                '<tr><td>' + App.escapeHtml(subjectName(item.subject_id)) + '</td>' +
                '<td class="num">' + App.escapeHtml(App.fmtScore(item.score)) + '</td></tr>'
              );
            })
            .join('') +
          '</tbody></table></div>'
        : '<div class="empty-state">暂无成绩记录</div>';

      content.innerHTML =
        '<div class="detail-grid">' +
        detailItem('姓名', student.name) +
        detailItem('性别', App.fmtGender(student.gender)) +
        detailItem('年龄', student.age === null || student.age === undefined ? '—' : student.age) +
        detailItem('年级', student.grade || '—') +
        detailItem('班级', student.class_id === null || student.class_id === undefined ? '—' : student.class_id + ' 班') +
        detailItem('任课老师', teacherName(student.teacher_id)) +
        detailItem('入学日期', App.fmtDate(student.enrollment_date)) +
        detailItem('创建时间', App.fmtDateTime(student.create_time)) +
        '</div>' +
        '<div class="section-title">成绩记录</div>' +
        scoreBlock;
    } catch (error) {
      content.innerHTML = '<div class="empty-state">' + App.escapeHtml(error.message) + '</div>';
    }
  }

  function renderStudentSubjects(subjects) {
    const container = document.getElementById('subjects-tbody');

    if (!subjects.length) {
      container.innerHTML =
        '<tr><td colspan="3" class="table-empty">暂无科目（班级课表未排课）</td></tr>';
      return;
    }

    container.innerHTML = subjects
      .map(function (item) {
        const source =
          item.source === 'schedule'
            ? '<span class="tag tag-blue">课表</span>'
            : '<span class="tag tag-green">手动添加</span>';
        return (
          '<tr>' +
          '<td>' + App.escapeHtml(item.subject_name) + '</td>' +
          '<td>' + source + '</td>' +
          '<td>' + App.escapeHtml(item.teacher_names || '—') + '</td>' +
          '</tr>'
        );
      })
      .join('');
  }

  function fillSubjectSelect(subjects) {
    const select = document.getElementById('subject-select');
    const addButton = document.getElementById('btn-add-subject');
    const assigned = new Set(
      subjects.map(function (item) {
        return Number(item.subject_id);
      })
    );

    const options = state.subjects.filter(function (item) {
      return !assigned.has(Number(item.id));
    });

    if (!options.length) {
      select.innerHTML = '<option value="">所有科目都已添加</option>';
      select.disabled = true;
      addButton.disabled = true;
      return;
    }

    select.disabled = false;
    addButton.disabled = false;
    select.innerHTML = options
      .map(function (item) {
        const suffix = item.sort ? '（' + item.sort + '）' : '';
        return '<option value="' + item.id + '">' + App.escapeHtml(item.name + suffix) + '</option>';
      })
      .join('');
  }

  async function loadStudentSubjects(student) {
    try {
      const data = await API.get('/stu/subjects/' + student.id);
      const subjects = data.subjects || [];
      renderStudentSubjects(subjects);
      fillSubjectSelect(subjects);
    } catch (error) {
      document.getElementById('subjects-tbody').innerHTML =
        '<tr><td colspan="3" class="table-empty">' + App.escapeHtml(error.message) + '</td></tr>';
      App.toast(error.message, 'error');
    }
  }

  async function openSubjects(id) {
    const student = state.rows.find(function (item) {
      return Number(item.id) === Number(id);
    });
    if (!student) return;

    state.subjectsStudent = student;
    document.getElementById('subjects-modal-title').textContent = '学习科目 · ' + student.name;
    document.getElementById('subjects-student-info').textContent =
      '学号：' + student.id +
      '　姓名：' + student.name +
      '　年级：' + (student.grade || '—') +
      '　班级：' + (student.class_id === null || student.class_id === undefined ? '—' : student.class_id + ' 班');
    document.getElementById('subjects-tbody').innerHTML =
      '<tr><td colspan="3" class="table-empty">加载中…</td></tr>';

    App.showModal('subjects-modal');

    if (!state.subjects.length) {
      try {
        state.subjects = (await API.get('/sub/all')) || [];
      } catch (error) {
        App.toast('科目数据加载失败：' + error.message, 'error');
      }
    }

    await loadStudentSubjects(student);
  }

  async function removeStudent(id) {
    const student = state.rows.find(function (item) {
      return Number(item.id) === Number(id);
    });
    const confirmed = await App.confirmDialog(
      '确定删除学生「' + (student ? student.name : id) + '」吗？' +
      '该学生的成绩、报到记录和补充科目也会一并删除，此操作不可恢复。',
      { title: '删除确认', confirmText: '删除' }
    );
    if (!confirmed) return;

    try {
      await API.del('/stu/del/' + id);
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
    const age = Number(field('age').value);
    const grade = field('grade').value;

    if (!name) {
      App.toast('请输入学生姓名', 'warning');
      return;
    }
    if (!Number.isFinite(age) || age < 0 || age > 150) {
      App.toast('年龄需在 0 - 150 之间', 'warning');
      return;
    }

    const submitButton = document.getElementById('student-submit');
    submitButton.disabled = true;

    try {
      if (state.editingId) {
        await API.put('/stu/update', {
          student_id: state.editingId,
          name: name,
          age: age,
          grade: grade,
        });
        App.toast('学生信息已修改');
      } else {
        const teacherId = Number(field('teacher_id').value);
        const classId = Number(field('class_id').value);
        if (!teacherId) {
          App.toast('请选择任课老师', 'warning');
          return;
        }
        if (!Number.isInteger(classId) || classId < 1) {
          App.toast('班级编号需为正整数', 'warning');
          return;
        }

        await API.post('/stu/add', {
          name: name,
          gender: field('gender').value,
          age: age,
          teacher_id: teacherId,
          grade: grade,
          enrollment_date: field('enrollment_date').value || null,
          class_id: classId,
        });
        App.toast('学生已新增');
        state.page = Math.max(1, Math.ceil((state.total + 1) / state.size));
      }

      App.hideModal('student-modal');
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

  document.getElementById('btn-add-subject').addEventListener('click', async function () {
    if (!state.subjectsStudent) return;

    const select = document.getElementById('subject-select');
    const subjectId = Number(select.value);
    if (!subjectId) {
      App.toast('请选择科目', 'warning');
      return;
    }

    const button = this;
    button.disabled = true;
    try {
      await API.post('/stu/subjects/add', {
        student_id: state.subjectsStudent.id,
        subject_id: subjectId,
      });
      App.toast('科目已添加');
      await loadStudentSubjects(state.subjectsStudent);
    } catch (error) {
      App.toast(error.message, 'error');
    } finally {
      button.disabled = select.disabled;
    }
  });

  tbody.addEventListener('click', function (event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;
    if (action === 'subjects') openSubjects(id);
    if (action === 'detail') openDetail(id);
    if (action === 'edit') openEdit(id);
    if (action === 'delete') removeStudent(id);
  });

  async function init() {
    await loadRefs();
    await loadList();
  }

  init();
})();
