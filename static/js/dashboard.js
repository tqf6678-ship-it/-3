/* 概览页 */
(function () {
  'use strict';

  const App = window.App;
  const API = App.API;
  const root = document.getElementById('dashboard-root');
  const GRADE_ORDER = ['高一', '高二', '高三'];

  function sortGrades(a, b) {
    const ia = GRADE_ORDER.indexOf(a);
    const ib = GRADE_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b, 'zh-CN');
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  }

  function countBy(rows, key) {
    const map = {};
    rows.forEach(function (row) {
      const value = row[key] === null || row[key] === undefined ? '未设置' : String(row[key]);
      map[value] = (map[value] || 0) + 1;
    });
    return map;
  }

  function progressRows(entries, total, unit) {
    if (!entries.length) {
      return '<div class="empty-state">暂无数据</div>';
    }
    return entries
      .map(function (entry) {
        const percent = total ? Math.round((entry[1] / total) * 100) : 0;
        return (
          '<div class="progress-row">' +
          '<span class="progress-label" title="' + App.escapeHtml(entry[0]) + '">' +
          App.escapeHtml(entry[0]) +
          '</span>' +
          '<div class="progress"><div class="progress-bar" style="width:' + percent + '%"></div></div>' +
          '<span class="progress-value">' + entry[1] + ' ' + unit + '</span>' +
          '</div>'
        );
      })
      .join('');
  }

  function render(students, total, teachers, subjects, announcements) {
    const gradeMap = countBy(students, 'grade');
    const gradeEntries = Object.keys(gradeMap)
      .sort(sortGrades)
      .map(function (key) {
        return [key, gradeMap[key]];
      });

    const classMap = countBy(students, 'class_id');
    const classEntries = Object.keys(classMap)
      .sort(function (a, b) {
        return Number(a) - Number(b);
      })
      .map(function (key) {
        return [key + ' 班', classMap[key]];
      });

    const teacherCountBySubject = {};
    teachers.forEach(function (teacher) {
      const key = String(teacher.subject_id);
      teacherCountBySubject[key] = (teacherCountBySubject[key] || 0) + 1;
    });

    const subjectRows = subjects
      .map(function (subject) {
        return (
          '<tr>' +
          '<td>' + App.escapeHtml(subject.name) + '</td>' +
          '<td><span class="tag ' + (subject.sort === '必修' ? 'tag-blue' : 'tag-gray') + '">' +
          App.escapeHtml(subject.sort || '—') + '</span></td>' +
          '<td class="num">' + (subject.points === null || subject.points === undefined ? '—' : subject.points) + '</td>' +
          '<td class="num">' + (teacherCountBySubject[String(subject.id)] || 0) + ' 人</td>' +
          '</tr>'
        );
      })
      .join('');

    const recent = students
      .slice()
      .sort(function (a, b) {
        return b.id - a.id;
      })
      .slice(0, 6)
      .map(function (student) {
        return (
          '<li>' +
          '<span><span class="recent-name">' + App.escapeHtml(student.name) + '</span> ' +
          '<span class="recent-meta">' + App.escapeHtml(App.fmtGender(student.gender)) + ' · ' +
          App.escapeHtml(student.grade || '—') + ' · ' + App.escapeHtml(student.class_id) + ' 班</span></span>' +
          '<span class="recent-meta">' + App.fmtDate(student.enrollment_date) + '</span>' +
          '</li>'
        );
      })
      .join('');

    const announcementItems = announcements
      .map(function (item) {
        return (
          '<li>' +
          '<span><span class="recent-name">' + App.escapeHtml(item.title) + '</span> ' +
          '<span class="recent-meta">' + (Number(item.status) === 1 ? '已发布' : '草稿') + '</span></span>' +
          '<span class="recent-meta">' + App.fmtDate(item.create_time) + '</span>' +
          '</li>'
        );
      })
      .join('');

    root.innerHTML =
      '<div class="kpi-grid">' +
      '  <div class="kpi-card"><div class="kpi-label">学生总数</div><div class="kpi-value">' + total + '</div><div class="kpi-hint">在校学生</div></div>' +
      '  <div class="kpi-card"><div class="kpi-label">教师总数</div><div class="kpi-value">' + teachers.length + '</div><div class="kpi-hint">任课教师</div></div>' +
      '  <div class="kpi-card"><div class="kpi-label">课程总数</div><div class="kpi-value">' + subjects.length + '</div><div class="kpi-hint">已开设课程</div></div>' +
      '  <div class="kpi-card"><div class="kpi-label">班级数量</div><div class="kpi-value">' + Object.keys(classMap).length + '</div><div class="kpi-hint">按 class_id 统计</div></div>' +
      '</div>' +
      '<div class="dashboard-grid">' +
      '  <section class="dashboard-card"><div class="card-head"><h2>年级分布</h2><span>共 ' + total + ' 人</span></div>' +
      '    <div class="card-body">' + progressRows(gradeEntries, total, '人') + '</div></section>' +
      '  <section class="dashboard-card"><div class="card-head"><h2>班级人数</h2><span>共 ' + Object.keys(classMap).length + ' 个班级</span></div>' +
      '    <div class="card-body">' + progressRows(classEntries, total, '人') + '</div></section>' +
      '  <section class="dashboard-card"><div class="card-head"><h2>课程概况</h2><span>共 ' + subjects.length + ' 门</span></div>' +
      '    <div class="card-body"><table class="subject-table"><thead><tr><th>课程</th><th>类型</th><th>学分</th><th>任课教师</th></tr></thead>' +
      '    <tbody>' + (subjectRows || '<tr><td colspan="4" class="table-empty">暂无课程</td></tr>') + '</tbody></table></div></section>' +
      '  <section class="dashboard-card"><div class="card-head"><h2>最近新增学生</h2><a href="javascript:void(0)" data-nav="student">进入学生管理</a></div>' +
      '    <div class="card-body">' + (recent ? '<ul class="recent-list">' + recent + '</ul>' : '<div class="empty-state">暂无学生</div>') + '</div></section>' +
      '</div>' +
      '<section class="dashboard-card dashboard-full">' +
      '  <div class="card-head"><h2>最新公告</h2><a href="javascript:void(0)" data-nav="announcement">查看全部</a></div>' +
      '  <div class="card-body">' + (announcementItems ? '<ul class="recent-list">' + announcementItems + '</ul>' : '<div class="empty-state">暂无公告</div>') + '</div>' +
      '</section>';

    root.querySelectorAll('[data-nav]').forEach(function (link) {
      link.addEventListener('click', function () {
        const target = link.dataset.nav;
        if (window.parent && window.parent !== window) {
          window.parent.location.hash = target;
        } else {
          location.href = '../' + target + '/index.html';
        }
      });
    });
  }

  async function load() {
    try {
      const announcementsPromise = API.get('/ann/list?page=1&size=5&status=1').catch(function () {
        return { rows: [] };
      });

      const result = await Promise.all([
        App.fetchAllStudents(),
        API.get('/tea/all'),
        API.get('/sub/all'),
        announcementsPromise,
      ]);

      const studentsResult = result[0];
      const announcements = result[3] && result[3].rows ? result[3].rows : [];

      render(
        studentsResult.rows,
        studentsResult.total,
        result[1] || [],
        result[2] || [],
        announcements
      );
    } catch (error) {
      root.innerHTML =
        '<div class="card"><div class="empty-state">概览加载失败：' +
        App.escapeHtml(error.message) +
        '</div></div>';
      App.toast(error.message, 'error');
    }
  }

  load();
})();
