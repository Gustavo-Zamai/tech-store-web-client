/* =============================================
   TECH STORE — UI Utilities
   ============================================= */

// ── Toast notifications ───────────────────────
const Toast = {
  show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) {
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
  const formData = new FormData(formEl);
  
  formData.forEach((v, k) => {
    if (v !== '' && v !== null && v !== undefined) {
      // Se for string, tenta converter para número
      if (typeof v === 'string' && v.trim() !== '') {
        const num = parseFloat(v);
        // Se for um número válido, guarda como número
        if (!isNaN(num) && v.trim() !== '') {
          data[k] = num;
        } else {
          data[k] = v;
        }
      } else {
        data[k] = v;
      }
    }
  });
  
  return data;
}

/**
 * Converte uma data para o formato ISO com timezone (para envio ao backend)
 * Exemplo: "2026-07-01T10:30:00-03:00"
 */
function formatDateToISO(dateStr) {
  if (!dateStr) return null;
  
  try {
    // Se for string, tenta criar um objeto Date
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    
    // Verifica se é uma data válida
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return null;
    }
    
    // Formata para ISO com timezone local (-03:00 para Brasil)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    // Obtém o offset do timezone em horas
    const offset = -date.getTimezoneOffset();
    const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
    const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, '0');
    const offsetSign = offset >= 0 ? '+' : '-';
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
  } catch (e) {
    console.warn('Erro ao formatar data:', e);
    return null;
  }
}

/**
 * Formata uma data para exibição no frontend
 * Exemplo: "20/06/2026, 16:00"
 */
function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr; // Retorna a string original se não for uma data válida
    }
    
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Obtém a data atual formatada para envio ao backend
 */
function getCurrentDateTimeISO() {
  return formatDateToISO(new Date());
}

function fillForm(formEl, obj) {
  if (!obj) return;
  Object.entries(obj).forEach(([k, v]) => {
    const field = formEl.elements[k];
    if (field) {
      // Se for campo de data, formata para o formato do input
      if (field.type === 'datetime-local' && v) {
        try {
          const date = new Date(v);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            field.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            return;
          }
        } catch (e) {}
      }
      field.value = v ?? '';
    }
  });
}

function clearForm(formEl) { formEl.reset(); }

// ── Loading state on buttons ──────────────────
function setLoading(btn, loading) {
  if (!btn) return;
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


/**
 * Converte uma data para o formato ISO com timezone (para envio ao backend)
 * Exemplo: "2026-07-01T10:30:00-03:00"
 */
/**
 * Converte uma data para o formato ISO sem timezone (para envio ao backend)
 * Exemplo: "2026-07-01T22:45:30"
 */
function formatDateToISO(dateStr) {
  if (!dateStr) return null;
  
  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return null;
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    // Retornar sem timezone (formato aceito por LocalDateTime)
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  } catch (e) {
    console.warn('Erro ao formatar data:', e);
    return null;
  }
}
// ── Exportar para uso global ──────────────────
window.Toast = Toast;
window.Modal = Modal;
window.confirmDelete = confirmDelete;
window.formToObject = formToObject;
window.formatDateToISO = formatDateToISO;
window.formatDateDisplay = formatDateDisplay;
window.getCurrentDateTimeISO = getCurrentDateTimeISO;
window.fillForm = fillForm;
window.clearForm = clearForm;
window.setLoading = setLoading;
window.formatCurrency = formatCurrency;
window.filterTable = filterTable;
window.setupApiUrlModal = setupApiUrlModal;
window.emptyRow = emptyRow;