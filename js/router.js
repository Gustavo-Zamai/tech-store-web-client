/* =============================================
   TECH STORE — Router / Navigation
   ============================================= */

import Pages from './pages.js';

const Router = (() => {

  const pages = {
    dashboard:    { label: 'Dashboard',    load: Pages.dashboard },
    produtos:     { label: 'Produtos',     load: Pages.produtos },
    clientes:     { label: 'Clientes',     load: Pages.clientes },
    vendas:       { label: 'Vendas',       load: Pages.vendas },
    funcionarios: { label: 'Funcionários', load: Pages.funcionarios },
    empresas:     { label: 'Empresas',     load: Pages.empresas },
    fornecedores: { label: 'Fornecedores', load: Pages.fornecedores },
    categorias:   { label: 'Categorias',   load: Pages.categorias },
  };

  let current = null;

  function navigate(page) {
    if (!(page in pages)) page = 'dashboard';

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // Update topbar title
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.textContent = pages[page].label;

    // Hide all views, show target
    document.querySelectorAll('.view-page').forEach(el => el.classList.remove('active'));
    const view = document.getElementById(`view-${page}`);
    if (view) view.classList.add('active');

    // Load page data
    if (pages[page].load) pages[page].load();

    current = page;

    // Close mobile sidebar
    document.querySelector('.sidebar')?.classList.remove('open');
  }

  function init() {
    // Wire nav buttons
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.page));
    });

    // Hamburger
    const ham = document.getElementById('hamburger');
    const sidebar = document.querySelector('.sidebar');
    if (ham && sidebar) {
      ham.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    // API URL modal
    document.getElementById('btn-api-settings')?.addEventListener('click', () => {
      setupApiUrlModal();
      Modal.open('modal-api-settings');
    });
    document.getElementById('btn-save-api-url')?.addEventListener('click', () => {
      const val = document.getElementById('api-url-input').value.trim();
      if (val) {
        API.setBaseURL(val);
        Toast.success('URL da API salva!');
        Modal.close('modal-api-settings');
        checkApiStatus();
      }
    });

    // Default page
    navigate('dashboard');

    // API status check
    checkApiStatus();
    setInterval(checkApiStatus, 30000);
  }

  async function checkApiStatus() {
    const dot = document.getElementById('api-status-dot');
    const label = document.getElementById('api-status-label');
    if (!dot) return;
    const online = await API.ping();
    dot.className = `api-dot ${online ? 'online' : 'offline'}`;
    if (label) label.textContent = online ? 'API online' : 'API offline';
  }

  return { navigate, init, current: () => current };
})();

// Exportar para uso global
window.Router = Router;