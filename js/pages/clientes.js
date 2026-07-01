/* =============================================
   TECH STORE — Clientes
   ============================================= */

async function pageClientes() {
  const view = document.getElementById('view-clientes');
  view.innerHTML = `
    <div class="section-header">
      <h1>Clientes</h1>
      <div style="display:flex;gap:.75rem;align-items:center">
        <div class="search-bar">
          <span class="icon">🔍</span>
          <input class="form-control" id="cli-search" placeholder="Buscar cliente..." style="width:220px">
        </div>
        <button class="btn btn-primary" id="btn-new-cliente">+ Novo Cliente</button>
      </div>
    </div>
    <div class="table-wrapper">
      <table id="table-clientes">
        <thead><tr><th>#</th><th>Nome</th><th>CPF/CNPJ</th><th>Email</th><th>Telefone</th><th>Ações</th></tr></thead>
        <tbody><tr><td colspan="6" style="text-align:center;padding:2rem"><span class="spinner"></span></td></tr></tbody>
      </table>
    </div>`;

  try {
    const data = await API.clientes.list();
    const tbody = view.querySelector('#table-clientes tbody');
    if (!data?.length) { tbody.innerHTML = emptyRow(6); return; }
    tbody.innerHTML = data.map(c => `<tr>
      <td><code style="font-family:var(--font-mono);font-size:.8rem;color:var(--text-muted)">${c.id}</code></td>
      <td style="font-weight:500">${c.nome}</td>
      <td style="font-family:var(--font-mono);font-size:.85rem">${c.cpf ?? c.cnpj ?? '—'}</td>
      <td>${c.email ?? '—'}</td>
      <td>${c.telefone ?? '—'}</td>
      <td><div style="display:flex;gap:.5rem">
        <button class="btn btn-secondary btn-sm" onclick="editCliente(${c.id})">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteCliente(${c.id},'${c.nome}')">🗑️</button>
      </div></td>
    </tr>`).join('');
  } catch {
    view.querySelector('#table-clientes tbody').innerHTML = emptyRow(6, 'Erro ao carregar clientes.');
  }

  document.getElementById('cli-search').addEventListener('input', e => filterTable('table-clientes', e.target.value));
  document.getElementById('btn-new-cliente').addEventListener('click', () => openClienteModal(null));

  window.editCliente = async (id) => { const c = await API.clientes.get(id); openClienteModal(c); };
  window.deleteCliente = (id, nome) => confirmDelete(nome, async () => {
    try { await API.clientes.delete(id); Toast.success('Cliente excluído!'); pageClientes(); }
    catch (e) { Toast.error(e.message); }
  });
}

function openClienteModal(cliente) {
  const isEdit = !!cliente;
  const modalId = 'modal-cliente';
  const fields = [
    ['nome',     'Nome *',    'text',  true],
    ['cpf',      'CPF',       'text',  false],
    ['email',    'Email',     'email', false],
    ['telefone', 'Telefone',  'text',  false],
    ['endereco', 'Endereço',  'text',  false],
  ];

  const html = `
    <div class="modal-overlay" id="${modalId}">
      <div class="modal">
        <button class="modal-close" onclick="Modal.close('${modalId}')">✕</button>
        <h2>${isEdit ? 'Editar Cliente' : 'Novo Cliente'}</h2>
        <form id="form-cliente">
          ${fields.map(([name, label, type, req]) => `
            <div class="form-group">
              <label>${label}</label>
              <input class="form-control" name="${name}" type="${type}" ${req ? 'required' : ''} value="${cliente?.[name] ?? ''}">
            </div>`).join('')}
          <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1rem">
            <button type="button" class="btn btn-secondary" onclick="Modal.close('${modalId}')">Cancelar</button>
            <button type="submit" class="btn btn-primary" id="btn-save-cliente">${isEdit ? 'Salvar' : 'Criar'}</button>
          </div>
        </form>
      </div>
    </div>`;

  document.getElementById(modalId)?.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  Modal.open(modalId);

  document.getElementById('form-cliente').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-cliente');
    setLoading(btn, true);
    try {
      const data = formToObject(e.target);
      if (isEdit) await API.clientes.update(cliente.id, data);
      else await API.clientes.create(data);
      Toast.success(isEdit ? 'Cliente atualizado!' : 'Cliente criado!');
      Modal.close(modalId);
      document.getElementById(modalId)?.remove();
      pageClientes();
    } catch (err) { Toast.error(err.message); }
    finally { setLoading(btn, false); }
  });
}
