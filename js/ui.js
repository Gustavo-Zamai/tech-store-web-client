/* =============================================
   TECH STORE — UI Utilities
   ============================================= */

// ── Toast notifications ───────────────────────
const Toast = {
  show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) {
      // Criar container se não existir
      const newContainer = document.createElement('div');
      newContainer.id = 'toast-container';
      newContainer.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:400px;width:100%;';
      document.body.appendChild(newContainer);
    }
    const containerEl = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    containerEl.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0';
      el.style.transform = 'translateX(110%)';
      setTimeout(() => el.remove(), 300);
    }, duration);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error:   (msg) => Toast.show(msg, 'error', 5000),
  info:    (msg) => Toast.show(msg, 'info'),
};

// ── Modal helpers ────────────────────────────
const Modal = {
  _stack: [],

  open(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('hidden');
    this._stack.push(id);
    document.body.style.overflow = 'hidden';
  },

  close(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('hidden');
    this._stack = this._stack.filter(s => s !== id);
    if (this._stack.length === 0) document.body.style.overflow = '';
  },

  closeAll() {
    document.querySelectorAll('.modal-overlay').forEach(el => el.classList.add('hidden'));
    this._stack = [];
    document.body.style.overflow = '';
  },
};

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    Modal.closeAll();
  }
});

// ── Confirm dialog ────────────────────────────
function confirmDelete(name, onConfirm) {
  const modal = document.getElementById('modal-confirm');
  if (!modal) {
    // Criar modal de confirmação se não existir
    const html = `
      <div class="modal-overlay hidden" id="modal-confirm">
        <div class="modal" style="max-width:400px">
          <h2>Confirmar Exclusão</h2>
          <p id="confirm-text" style="margin:1rem 0;color:var(--text-secondary)"></p>
          <div style="display:flex;justify-content:flex-end;gap:.75rem">
            <button class="btn btn-secondary" onclick="Modal.close('modal-confirm')">Cancelar</button>
            <button class="btn btn-danger" id="confirm-ok">Excluir</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }
  
  document.getElementById('confirm-text').textContent =
    `Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`;
  Modal.open('modal-confirm');

  const btn = document.getElementById('confirm-ok');
  const newBtn = btn.cloneNode(true);
  btn.parentNode.replaceChild(newBtn, btn);
  newBtn.addEventListener('click', () => {
    Modal.close('modal-confirm');
    onConfirm();
  });
}

// ── Form helpers ─────────────────────────────
function formToObject(formEl) {
  const data = {};
  new FormData(formEl).forEach((v, k) => {
    if (v !== '') {
      // Tenta converter para número se for um número
      const num = parseFloat(v);
      data[k] = !isNaN(num) && v.trim() !== '' ? num : v;
    }
  });
  return data;
}

function fillForm(formEl, obj) {
  Object.entries(obj).forEach(([k, v]) => {
    const field = formEl.elements[k];
    if (field) field.value = v ?? '';
  });
}

function clearForm(formEl) { formEl.reset(); }

// ── Loading state on buttons ──────────────────
function setLoading(btn, loading) {
  if (loading) {
    btn.disabled = true;
    btn._original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Aguarde...';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn._original || btn.innerHTML;
  }
}

// ── Format currency ───────────────────────────
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

// ── Format date ───────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

// ── Filter table rows ─────────────────────────
function filterTable(tableId, query) {
  const q = query.toLowerCase().trim();
  const rows = document.querySelectorAll(`#${tableId} tbody tr`);
  rows.forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

// ── API base URL setting ──────────────────────
function setupApiUrlModal() {
  const input = document.getElementById('api-url-input');
  if (input) input.value = API.getBaseURL();
}

// ── Render empty row ─────────────────────────
function emptyRow(colspan, msg = 'Nenhum registro encontrado.') {
  return `<tr><td colspan="${colspan}" style="text-align:center;color:var(--text-muted);padding:2rem">${msg}</td></tr>`;
}

// ── Exportar para uso global ──────────────────
window.Toast = Toast;
window.Modal = Modal;
window.confirmDelete = confirmDelete;
window.formToObject = formToObject;
window.fillForm = fillForm;
window.clearForm = clearForm;
window.setLoading = setLoading;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.filterTable = filterTable;
window.setupApiUrlModal = setupApiUrlModal;
window.emptyRow = emptyRow;