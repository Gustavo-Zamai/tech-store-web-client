
/* =============================================
   TECH STORE — Router / Navigation
   ============================================= */

const Router = (() => {

  // Mapa de rotas: chave → { label, fn }
  // Pages.<nome> é a função de cada entidade (definida em js/pages/<entidade>.js)
  // e registrada no objeto Pages em js/pages.js
  const routes = {
    dashboard:    { label: 'Dashboard'    },
    produtos:     { label: 'Produtos'     },
    clientes:     { label: 'Clientes'     },
    vendas:       { label: 'Vendas'       },
    funcionarios: { label: 'Funcionários' },
    empresas:     { label: 'Empresas'     },
    fornecedores: { label: 'Fornecedores' },
    categorias:   { label: 'Categorias'   },
  };

  let current = null;

  function navigate(page) {
    if (!(page in routes)) page = 'dashboard';

    // Sidebar: marcar item ativo
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // Topbar: atualizar título
    document.getElementById('topbar-title').textContent = routes[page].label;

    // Views: esconder todas, mostrar a atual
    document.querySelectorAll('.view-page').forEach(el => el.classList.remove('active'));
    const view = document.getElementById(`view-${page}`);
    if (view) view.classList.add('active');

    // Chamar a função da página (Pages é o objeto em pages.js)
    const fn = Pages[page];
    if (typeof fn === 'function') fn();

    current = page;

    // Fechar sidebar mobile
    document.querySelector('.sidebar')?.classList.remove('open');
  }

  function init() {
    // Ligar botões da sidebar
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.page));
    });

    // Hamburger mobile
    const ham     = document.getElementById('hamburger');
    const sidebar = document.querySelector('.sidebar');
    if (ham && sidebar) {
      ham.addEventListener('click', () => sidebar.classList.toggle('open'));
      // Fechar sidebar ao clicar fora (mobile)
      document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            e.target !== ham) {
          sidebar.classList.remove('open');
        }
      });
    }

    // Modal de configuração de API
    document.getElementById('btn-api-settings')?.addEventListener('click', () => {
      document.getElementById('api-url-input').value = API.getBaseURL();
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

    // Navegar para o dashboard ao iniciar
    navigate('dashboard');

    // Verificar status da API imediatamente e a cada 30s
    checkApiStatus();
    setInterval(checkApiStatus, 30000);
  }

  async function checkApiStatus() {
    const dot   = document.getElementById('api-status-dot');
    const label = document.getElementById('api-status-label');
    if (!dot) return;
    const online = await API.ping();
    dot.className   = `api-dot ${online ? 'online' : 'offline'}`;
    label.textContent = online ? 'API online' : 'API offline';
  }

  return { navigate, init, current: () => current };
})();