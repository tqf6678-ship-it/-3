/* 公共工具：接口请求、格式化、分页、确认框、Toast */
(function () {
  'use strict';

  const API = {
    async request(url, options) {
      const config = Object.assign({ headers: {} }, options || {});
      if (config.body !== undefined && typeof config.body !== 'string') {
        config.headers['Content-Type'] = 'application/json';
        config.body = JSON.stringify(config.body);
      }

      let response;
      try {
        response = await fetch(url, config);
      } catch (error) {
        throw new Error('无法连接服务器，请确认后端已启动');
      }

      let payload;
      try {
        const text = await response.text();
        payload = text ? JSON.parse(text) : {};
      } catch (error) {
        throw new Error('服务器响应格式异常（HTTP ' + response.status + '）');
      }

      if (!response.ok) {
        throw new Error('请求失败（HTTP ' + response.status + '）');
      }
      if (payload.code !== 0) {
        throw new Error(payload.msg || '操作失败');
      }
      return payload.data;
    },

    get(url) {
      return API.request(url);
    },
    post(url, body) {
      return API.request(url, { method: 'POST', body: body });
    },
    put(url, body) {
      return API.request(url, { method: 'PUT', body: body });
    },
    del(url) {
      return API.request(url, { method: 'DELETE' });
    },
  };

  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value).replace(
      /[&<>"']/g,
      function (ch) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        }[ch];
      }
    );
  }

  function fmtDate(value) {
    if (!value) return '—';
    return String(value).slice(0, 10);
  }

  function fmtDateTime(value) {
    if (!value) return '—';
    return String(value).replace('T', ' ').slice(0, 16);
  }

  function fmtGender(value) {
    const map = {
      man: '男',
      male: '男',
      男: '男',
      woman: '女',
      female: '女',
      女: '女',
    };
    const key = String(value === null || value === undefined ? '' : value).trim();
    return map[key] || map[key.toLowerCase()] || key || '—';
  }

  function fmtScore(value) {
    if (value === null || value === undefined || value === '') return '—';
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value);
    return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(1)));
  }

  function toast(message, type) {
    let container = document.getElementById('app-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'app-toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const node = document.createElement('div');
    node.className = 'app-toast ' + (type || 'success');
    node.textContent = message;
    container.appendChild(node);

    setTimeout(function () {
      node.style.opacity = '0';
      node.style.transition = 'opacity .2s';
      setTimeout(function () {
        node.remove();
      }, 220);
    }, 3000);
  }

  function ensureConfirmModal() {
    if (document.getElementById('app-confirm-modal')) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML =
      '<div class="modal fade" id="app-confirm-modal" tabindex="-1" aria-hidden="true">' +
      '  <div class="modal-dialog modal-dialog-centered">' +
      '    <div class="modal-content">' +
      '      <div class="modal-header">' +
      '        <h5 class="modal-title" id="app-confirm-title">提示</h5>' +
      '        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="关闭"></button>' +
      '      </div>' +
      '      <div class="modal-body" id="app-confirm-message"></div>' +
      '      <div class="modal-footer">' +
      '        <button type="button" class="btn btn-default btn-sm" data-bs-dismiss="modal">取消</button>' +
      '        <button type="button" class="btn btn-danger btn-sm" id="app-confirm-ok">确定</button>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(wrapper.firstElementChild);
  }

  function confirmDialog(message, options) {
    options = options || {};
    ensureConfirmModal();

    const element = document.getElementById('app-confirm-modal');
    const titleNode = element.querySelector('#app-confirm-title');
    const messageNode = element.querySelector('#app-confirm-message');
    const okButton = element.querySelector('#app-confirm-ok');

    titleNode.textContent = options.title || '提示';
    messageNode.textContent = message;
    okButton.textContent = options.confirmText || '确定';
    okButton.className =
      'btn btn-sm ' + (options.danger === false ? 'btn-primary' : 'btn-danger');

    const instance = bootstrap.Modal.getOrCreateInstance(element);

    return new Promise(function (resolve) {
      let settled = false;

      function onOk() {
        settled = true;
        instance.hide();
        resolve(true);
      }

      function onHidden() {
        okButton.removeEventListener('click', onOk);
        element.removeEventListener('hidden.bs.modal', onHidden);
        if (!settled) resolve(false);
      }

      okButton.addEventListener('click', onOk);
      element.addEventListener('hidden.bs.modal', onHidden);
      instance.show();
    });
  }

  function showModal(id) {
    const element = document.getElementById(id);
    bootstrap.Modal.getOrCreateInstance(element).show();
  }

  function hideModal(id) {
    const element = document.getElementById(id);
    const instance = bootstrap.Modal.getInstance(element);
    if (instance) instance.hide();
  }

  function renderPagination(container, data, onChange) {
    const total = Number(data.total || 0);
    const size = Number(data.size || 10);
    const page = Number(data.page || 1);
    const pages = Math.max(1, Math.ceil(total / size));
    const start = total === 0 ? 0 : (page - 1) * size + 1;
    const end = Math.min(page * size, total);

    const items = [];
    function add(label, target, disabled, active) {
      items.push(
        '<li class="page-item' +
          (disabled ? ' disabled' : '') +
          (active ? ' active' : '') +
          '"><a class="page-link" href="javascript:void(0)" data-page="' +
          target +
          '">' +
          label +
          '</a></li>'
      );
    }

    add('上一页', page - 1, page <= 1, false);
    const from = Math.max(1, Math.min(page - 2, pages - 4));
    const to = Math.min(pages, from + 4);
    for (let index = from; index <= to; index += 1) {
      add(String(index), index, false, index === page);
    }
    add('下一页', page + 1, page >= pages, false);

    container.innerHTML =
      '<div class="pagination-wrap"><span>共 ' +
      total +
      ' 条，当前 ' +
      start +
      '-' +
      end +
      '</span><ul class="pagination pagination-sm">' +
      items.join('') +
      '</ul></div>';

    container.querySelectorAll('.page-item:not(.disabled) [data-page]').forEach(function (link) {
      link.addEventListener('click', function () {
        const target = Number(link.dataset.page);
        if (target >= 1 && target <= pages && target !== page) {
          onChange(target);
        }
      });
    });
  }

  async function fetchAllStudents() {
    const size = 100;
    let page = 1;
    let rows = [];
    let total = 0;

    while (true) {
      const data = await API.get('/stu/page?page=' + page + '&size=' + size);
      total = Number(data.total || 0);
      rows = rows.concat(data.rows || []);
      if (rows.length >= total || !data.rows || data.rows.length === 0) break;
      page += 1;
    }

    return { rows: rows, total: total };
  }

  function setLoading(element, loading) {
    if (!element) return;
    element.classList.toggle('is-loading', Boolean(loading));
  }

  window.App = {
    API: API,
    escapeHtml: escapeHtml,
    fmtDate: fmtDate,
    fmtDateTime: fmtDateTime,
    fmtGender: fmtGender,
    fmtScore: fmtScore,
    toast: toast,
    confirmDialog: confirmDialog,
    showModal: showModal,
    hideModal: hideModal,
    renderPagination: renderPagination,
    fetchAllStudents: fetchAllStudents,
    setLoading: setLoading,
  };
})();
