/* 班级课表 */
(function () {
  'use strict';

  const App = window.App;
  const API = App.API;
  const WEEKDAYS = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
  const PERIODS = 8;
  const CLASS_STORAGE_KEY = 'edu_schedule_class_id';

  const state = {
    classes: [],
    subjects: [],
    teachers: [],
    classId: null,
    entries: [],
    editingId: null,
    slot: null,
    tableMissing: false,
  };

  const classSelect = document.getElementById('class-select');
  const tbody = document.getElementById('timetable-body');
  const theadRow = document.getElementById('timetable-head');
  const notice = document.getElementById('schedule-notice');
  const summary = document.getElementById('schedule-summary');
  const title = document.getElementById('timetable-title');
  const form = document.getElementById('schedule-form');

  function field(name) {
    return form.querySelector('[name="' + name + '"]');
  }

  function friendlyError(message) {
    if (/1146|doesn't exist|does not exist/i.test(message)) {
      if (/class_schedules/i.test(message)) {
        return '课表表尚未创建，请先执行 org/sql/class_schedules.sql';
      }
      if (/classes/i.test(message)) {
        return '班级表尚未创建，请先执行 org/sql/classes.sql';
      }
    }
    if (/1062|Duplicate entry|uk_schedule_slot/i.test(message)) {
      return '该班级在这个时间已有课程';
    }
    if (/1452|foreign key constraint fails/i.test(message)) {
      return '班级、课程或教师不存在，请刷新后重试';
    }
    return message;
  }

  function showNotice(message) {
    notice.textContent = message;
    notice.hidden = false;
  }

  function hideNotice() {
    notice.hidden = true;
    notice.textContent = '';
  }

  function currentClass() {
    return state.classes.find(function (item) {
      return Number(item.id) === Number(state.classId);
    }) || null;
  }

  function fillClassSelect() {
    if (!state.classes.length) {
      classSelect.innerHTML = '<option value="">暂无班级</option>';
      return;
    }
    classSelect.innerHTML = state.classes
      .map(function (item) {
        return '<option value="' + item.id + '">' + App.escapeHtml(item.name) + '（' + App.escapeHtml(item.code) + '）</option>';
      })
      .join('');
    if (state.classId) {
      classSelect.value = String(state.classId);
    }
  }

  function fillModalOptions(entry) {
    field('weekday').innerHTML = WEEKDAYS.map(function (name, index) {
      return '<option value="' + (index + 1) + '">' + name + '</option>';
    }).join('');

    field('period').innerHTML = Array.from({ length: PERIODS }, function (_, index) {
      return '<option value="' + (index + 1) + '">第 ' + (index + 1) + ' 节</option>';
    }).join('');

    field('subject_id').innerHTML =
      '<option value="">请选择课程</option>' +
      state.subjects
        .map(function (subject) {
          return '<option value="' + subject.id + '">' + App.escapeHtml(subject.name) + '</option>';
        })
        .join('');

    field('teacher_id').innerHTML =
      '<option value="">请选择教师</option>' +
      state.teachers
        .map(function (teacher) {
          const subject = state.subjects.find(function (item) {
            return Number(item.id) === Number(teacher.subject_id);
          });
          const label = subject ? teacher.name + '（' + subject.name + '）' : teacher.name;
          return '<option value="' + teacher.id + '">' + App.escapeHtml(label) + '</option>';
        })
        .join('');

    if (entry) {
      field('subject_id').value = String(entry.subject_id);
      field('teacher_id').value = String(entry.teacher_id);
      field('location').value = entry.location || '';
    }
  }

  function renderTimetable() {
    theadRow.innerHTML = '<th>节次</th>' + WEEKDAYS.map(function (name) {
      return '<th>' + name + '</th>';
    }).join('');

    const klass = currentClass();
    title.textContent = klass ? klass.name + ' · 周课表' : '班级课表';
    summary.textContent = klass ? '本周 ' + state.entries.length + ' 节课' : '';

    if (!klass) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="table-empty">暂无班级，请先在「班级管理」中新增班级</td></tr>';
      return;
    }

    const rows = [];
    for (let period = 1; period <= PERIODS; period += 1) {
      const cells = ['<td class="period-label">第 ' + period + ' 节</td>'];

      for (let weekday = 1; weekday <= 7; weekday += 1) {
        const entry = state.entries.find(function (item) {
          return Number(item.weekday) === weekday && Number(item.period) === period;
        });

        if (entry) {
          cells.push(
            '<td><div class="timetable-cell filled" data-weekday="' + weekday + '" data-period="' + period + '">' +
              '<div class="course-name">' + App.escapeHtml(entry.subject_name || '课程') + '</div>' +
              '<div class="course-meta">' + App.escapeHtml(entry.teacher_name || '') + '</div>' +
              (entry.location ? '<div class="course-location">' + App.escapeHtml(entry.location) + '</div>' : '') +
            '</div></td>'
          );
        } else {
          cells.push(
            '<td><div class="timetable-cell empty" data-weekday="' + weekday + '" data-period="' + period + '">+</div></td>'
          );
        }
      }

      rows.push('<tr>' + cells.join('') + '</tr>');
    }

    tbody.innerHTML = rows.join('');
  }

  async function loadEntries() {
    if (!state.classId) {
      state.entries = [];
      renderTimetable();
      return;
    }

    const card = document.getElementById('timetable-card');
    App.setLoading(card, true);
    try {
      const rows = await API.get('/sch/list?class_id=' + state.classId);
      state.entries = rows || [];
      state.tableMissing = false;
      hideNotice();
      renderTimetable();
    } catch (error) {
      const message = friendlyError(error.message);
      state.entries = [];
      state.tableMissing = /课表表尚未创建/.test(message);
      showNotice(message);
      renderTimetable();
      App.toast(message, 'error');
    } finally {
      App.setLoading(card, false);
    }
  }

  async function loadOptions() {
    try {
      const result = await Promise.all([
        API.get('/cls/all'),
        API.get('/sub/all'),
        API.get('/tea/all'),
      ]);
      state.classes = result[0] || [];
      state.subjects = result[1] || [];
      state.teachers = result[2] || [];
    } catch (error) {
      const message = friendlyError(error.message);
      showNotice(message);
      renderTimetable();
      App.toast(message, 'error');
      return;
    }

    const queryClassId = new URLSearchParams(location.search).get('class_id');
    const storedClassId = sessionStorage.getItem(CLASS_STORAGE_KEY);
    const preferred = queryClassId || storedClassId;
    const matched = state.classes.find(function (item) {
      return String(item.id) === String(preferred);
    });

    if (matched) {
      state.classId = Number(matched.id);
    } else if (state.classes.length) {
      state.classId = Number(state.classes[0].id);
    }

    if (state.classId) {
      sessionStorage.setItem(CLASS_STORAGE_KEY, String(state.classId));
    }

    fillClassSelect();
    await loadEntries();
  }

  function openScheduleModal(weekday, period, entry) {
    state.editingId = entry ? Number(entry.id) : null;
    state.slot = { weekday: weekday, period: period };

    form.reset();
    fillModalOptions(entry);

    field('weekday').value = String(weekday);
    field('period').value = String(period);
    field('weekday').disabled = true;
    field('period').disabled = true;

    if (!entry) {
      field('subject_id').value = '';
      field('teacher_id').value = '';
      field('location').value = '';
    }

    document.getElementById('schedule-modal-title').textContent = entry ? '编辑课程' : '添加课程';
    document.getElementById('schedule-delete').hidden = !entry;
    App.showModal('schedule-modal');
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!state.classId || !state.slot) return;

    const subjectId = Number(field('subject_id').value);
    const teacherId = Number(field('teacher_id').value);
    const location = field('location').value.trim();

    if (!subjectId) {
      App.toast('请选择课程', 'warning');
      return;
    }
    if (!teacherId) {
      App.toast('请选择教师', 'warning');
      return;
    }

    const submitButton = document.getElementById('schedule-submit');
    submitButton.disabled = true;

    const payload = {
      class_id: state.classId,
      subject_id: subjectId,
      teacher_id: teacherId,
      weekday: state.slot.weekday,
      period: state.slot.period,
      location: location,
    };

    try {
      if (state.editingId) {
        payload.schedule_id = state.editingId;
        await API.put('/sch/update', payload);
        App.toast('课表已修改');
      } else {
        await API.post('/sch/add', payload);
        App.toast('课程已添加');
      }

      App.hideModal('schedule-modal');
      await loadEntries();
    } catch (error) {
      App.toast(friendlyError(error.message), 'error');
    } finally {
      submitButton.disabled = false;
    }
  });

  document.getElementById('schedule-delete').addEventListener('click', async function () {
    if (!state.editingId) return;

    const entry = state.entries.find(function (item) {
      return Number(item.id) === Number(state.editingId);
    });
    const confirmed = await App.confirmDialog(
      '确定删除「' + (entry ? entry.subject_name : '该课程') + '」这节课吗？',
      { title: '删除确认', confirmText: '删除' }
    );
    if (!confirmed) return;

    try {
      await API.del('/sch/del/' + state.editingId);
      App.hideModal('schedule-modal');
      App.toast('删除成功');
      await loadEntries();
    } catch (error) {
      App.toast(friendlyError(error.message), 'error');
    }
  });

  field('subject_id').addEventListener('change', function () {
    const subjectId = Number(field('subject_id').value);
    if (!subjectId) return;

    const selectedTeacher = state.teachers.find(function (teacher) {
      return Number(teacher.id) === Number(field('teacher_id').value);
    });
    if (selectedTeacher && Number(selectedTeacher.subject_id) === subjectId) return;

    const matchedTeacher = state.teachers.find(function (teacher) {
      return Number(teacher.subject_id) === subjectId;
    });
    if (matchedTeacher) {
      field('teacher_id').value = String(matchedTeacher.id);
    }
  });

  classSelect.addEventListener('change', function () {
    const nextClassId = Number(classSelect.value);
    if (!nextClassId) return;
    state.classId = nextClassId;
    sessionStorage.setItem(CLASS_STORAGE_KEY, String(nextClassId));
    loadEntries();
  });

  document.getElementById('btn-refresh').addEventListener('click', loadEntries);

  tbody.addEventListener('click', function (event) {
    const cell = event.target.closest('[data-weekday][data-period]');
    if (!cell || !state.classId) return;

    const weekday = Number(cell.dataset.weekday);
    const period = Number(cell.dataset.period);
    const entry = state.entries.find(function (item) {
      return Number(item.weekday) === weekday && Number(item.period) === period;
    }) || null;

    openScheduleModal(weekday, period, entry);
  });

  loadOptions();
})();
