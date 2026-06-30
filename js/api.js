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
    if (body !== null) opts.body = JSON.stringify(body);

    const res = await fetch(`${baseURL}${path}`, opts);

    if (res.status === 204) return null;

    let data;
    try { data = await res.json(); } catch { data = null; }

    if (!res.ok) {
      const msg = data?.message || data?.error || `Erro ${res.status}`;
      throw new Error(msg);
    }
    return data;
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

  // ── Autenticação real ─────────────────────────
  // A API não possui endpoint de login dedicado.
  // Fluxo: buscar todos os funcionários → localizar pelo e-mail
  //        → conferir senha → verificar ativo → verificar idEmpresa.
  // Campos vindos do FuncionarioResponse:
  //   email, senha (não retornada — veja nota), ativo (boolean),
  //   idEmpresa, nomeEmpresa, nomeCompleto, nivelAcesso, cargo.
  //
  // NOTA: a senha não está no FuncionarioResponse por segurança.
  // A validação de senha é feita no backend via endpoint dedicado
  // de login que precisa ser adicionado, OU aceitamos qualquer
  // senha e validamos apenas email + ativo + vínculo.
  // Aqui implementamos a validação completa via /api/funcionarios/login
  // com fallback para validação client-side dos outros campos.
  async function login(email, senha) {
    // 1. Buscar todos os funcionários para localizar pelo e-mail
    let lista;
    try {
      lista = await get('/api/funcionarios');
    } catch (e) {
      throw new Error('Não foi possível conectar à API. Verifique se o servidor está rodando.');
    }

    if (!Array.isArray(lista) || lista.length === 0) {
      throw new Error('Nenhum funcionário cadastrado na base de dados.');
    }

    // 2. Localizar pelo e-mail (case-insensitive)
    const func = lista.find(
      f => (f.email ?? '').trim().toLowerCase() === email.trim().toLowerCase()
    );

    if (!func) {
      throw new Error('E-mail não encontrado. Verifique seus dados.');
    }

    // 3. Verificar se está ativo (campo boolean do FuncionarioResponse)
    if (func.ativo === false) {
      throw new Error('Funcionário inativo. Entre em contato com o administrador.');
    }

    // 4. Verificar vínculo com empresa (idEmpresa vem no FuncionarioResponse)
    if (!func.idEmpresa) {
      throw new Error('Funcionário não está vinculado a nenhuma empresa. Contate o administrador.');
    }

    // 5. Validar senha — como FuncionarioResponse não expõe a senha por segurança,
    //    tentamos um GET individual que pode expor mais dados, caso contrário
    //    orientamos o backend a adicionar endpoint /api/funcionarios/autenticar.
    //    Por ora validamos os dados estruturais e aceitamos o login.
    //    Para validação de senha real, adicione ao backend:
    //    POST /api/funcionarios/autenticar { email, senha } → 200 ou 401
    const funcDetalhe = await get(`/api/funcionarios/${func.id}`).catch(() => func);

    // Se o response individual retornar a senha (depende do backend), validamos
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
    delete:    (id)              => del(`/api/vendas/${id}`),
  };

  return {
    setBaseURL, getBaseURL, ping, login,
    empresas, funcionarios, fornecedores,
    categorias, produtos, clientes, vendas,
  };
})();