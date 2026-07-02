/* =============================================
   TECH STORE — API Service
   All communication with the backend lives here.
   ============================================= */

const API = (() => {

  // ── Config ────────────────────────────────────
  let baseURL = localStorage.getItem('ts_api_url') || 'http://localhost:8080';

  function setBaseURL(url) {
    baseURL = url.replace(/\/$/, '');
    localStorage.setItem('ts_api_url', baseURL);
  }

  function getBaseURL() { return baseURL; }

  // ── Core request ──────────────────────────────
  async function request(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    // Limpar dados antes de enviar
    if (body !== null) {
      // Remove campos vazios ou undefined
      const cleanedBody = cleanObject(body);
      opts.body = JSON.stringify(cleanedBody);
      console.log(`📤 ${method} ${path}`, cleanedBody);
    }

    try {
      const res = await fetch(`${baseURL}${path}`, opts);

      if (res.status === 204) return null;

      let data;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        // Log do erro detalhado
        console.error(`❌ Erro ${res.status} em ${method} ${path}:`, data || text);
        const msg = data?.message || data?.error || data?.details || `Erro ${res.status}`;
        throw new Error(msg);
      }
      return data;
    } catch (error) {
      console.error(`❌ Erro na requisição ${method} ${path}:`, error);
      throw error;
    }
  }

  // ── Função para limpar objetos antes de enviar ──
  function cleanObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      // Pular campos undefined, null ou strings vazias
      if (value === undefined || value === null || value === '') continue;
      
      // Se for objeto, limpar recursivamente
      if (typeof value === 'object' && !Array.isArray(value)) {
        const nested = cleanObject(value);
        if (Object.keys(nested).length > 0) {
          cleaned[key] = nested;
        }
        continue;
      }
      
      // Se for array, limpar cada item
      if (Array.isArray(value)) {
        cleaned[key] = value.map(item => 
          typeof item === 'object' ? cleanObject(item) : item
        );
        continue;
      }
      
      cleaned[key] = value;
    }
    return cleaned;
  }

  const get    = (path)       => request('GET',    path);
  const post   = (path, body) => request('POST',   path, body);
  const put    = (path, body) => request('PUT',    path, body);
  const del    = (path)       => request('DELETE', path);

  // ── Health check ──────────────────────────────
  async function ping() {
    try {
      await fetch(`${baseURL}/api/funcionarios`, { signal: AbortSignal.timeout(3000) });
      return true;
    } catch { return false; }
  }

  // ── Autenticação ─────────────────────────────
  async function login(email, senha) {
    let lista;
    try {
      lista = await get('/api/funcionarios');
    } catch (e) {
      throw new Error('Não foi possível conectar à API. Verifique se o servidor está rodando.');
    }

    if (!Array.isArray(lista) || lista.length === 0) {
      throw new Error('Nenhum funcionário cadastrado na base de dados.');
    }

    const func = lista.find(
      f => (f.email ?? '').trim().toLowerCase() === email.trim().toLowerCase()
    );

    if (!func) {
      throw new Error('E-mail não encontrado. Verifique seus dados.');
    }

    if (func.ativo === false) {
      throw new Error('Funcionário inativo. Entre em contato com o administrador.');
    }

    if (!func.idEmpresa) {
      throw new Error('Funcionário não está vinculado a nenhuma empresa. Contate o administrador.');
    }

    const funcDetalhe = await get(`/api/funcionarios/${func.id}`).catch(() => func);

    if (funcDetalhe.senha && funcDetalhe.senha !== senha) {
      throw new Error('Senha incorreta.');
    }

    return {
      id:           func.id,
      nomeCompleto: func.nomeCompleto,
      email:        func.email,
      cargo:        func.cargo,
      nivelAcesso:  func.nivelAcesso,
      imagemUrl:    func.imagemUrl ?? null,
      idEmpresa:    func.idEmpresa,
      nomeEmpresa:  func.nomeEmpresa,
    };
  }

  // ── Empresas ──────────────────────────────────
  const empresas = {
    list:   ()       => get('/api/empresas'),
    get:    (id)     => get(`/api/empresas/${id}`),
    create: (data)   => post('/api/empresas', data),
    update: (id, d)  => put(`/api/empresas/${id}`, d),
    delete: (id)     => del(`/api/empresas/${id}`),
  };

  // ── Funcionários ──────────────────────────────
  const funcionarios = {
    list:      ()          => get('/api/funcionarios'),
    get:       (id)        => get(`/api/funcionarios/${id}`),
    byEmpresa: (idEmp)     => get(`/api/funcionarios/empresa/${idEmp}`),
    create:    (data)      => post('/api/funcionarios', data),
    update:    (id, d)     => put(`/api/funcionarios/${id}`, d),
    delete:    (id)        => del(`/api/funcionarios/${id}`),
  };

  // ── Fornecedores ──────────────────────────────
  const fornecedores = {
    list:   ()       => get('/api/fornecedores'),
    get:    (id)     => get(`/api/fornecedores/${id}`),
    create: (data)   => post('/api/fornecedores', data),
    update: (id, d)  => put(`/api/fornecedores/${id}`, d),
    delete: (id)     => del(`/api/fornecedores/${id}`),
  };

  // ── Categorias ────────────────────────────────
  const categorias = {
    list:   ()       => get('/api/categorias'),
    get:    (id)     => get(`/api/categorias/${id}`),
    create: (data)   => post('/api/categorias', data),
    update: (id, d)  => put(`/api/categorias/${id}`, d),
    delete: (id)     => del(`/api/categorias/${id}`),
  };

  // ── Produtos ──────────────────────────────────
  const produtos = {
    list:         ()        => get('/api/produtos'),
    get:          (id)      => get(`/api/produtos/${id}`),
    buscarNome:   (nome)    => get(`/api/produtos/buscar?nome=${encodeURIComponent(nome)}`),
    estoqueBaixo: (qtd)     => get(`/api/produtos/estoque-baixo?quantidade=${qtd}`),
    create:       (data)    => post('/api/produtos', data),
    update:       (id, d)   => put(`/api/produtos/${id}`, d),
    delete:       (id)      => del(`/api/produtos/${id}`),
  };

  // ── Clientes ──────────────────────────────────
  const clientes = {
    list:   ()       => get('/api/clientes'),
    get:    (id)     => get(`/api/clientes/${id}`),
    create: (data)   => post('/api/clientes', data),
    update: (id, d)  => put(`/api/clientes/${id}`, d),
    delete: (id)     => del(`/api/clientes/${id}`),
  };

  // ── Vendas ────────────────────────────────────
  const vendas = {
    list:      ()                => get('/api/vendas'),
    get:       (id)              => get(`/api/vendas/${id}`),
    byCliente: (idCliente)       => get(`/api/vendas/cliente/${idCliente}`),
    byPeriodo: (inicio, fim)     => get(`/api/vendas/periodo?inicio=${inicio}&fim=${fim}`),
    create:    (data)            => post('/api/vendas', data),
    update:    (id, d)           => put(`/api/vendas/${id}`, d),
    delete:    (id)              => del(`/api/vendas/${id}`),
  };

  return {
    setBaseURL, getBaseURL, ping, login,
    empresas, funcionarios, fornecedores,
    categorias, produtos, clientes, vendas,
  };
})();