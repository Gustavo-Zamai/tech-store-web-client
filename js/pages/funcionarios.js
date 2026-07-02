/* =============================================
   TECH STORE — Funcionários
   ============================================= */

async function pageFuncionarios() {
  const view = document.getElementById('view-funcionarios');
  view.innerHTML = `
    <div class="section-header">
      <h1>Funcionários</h1>
      <div style="display:flex;gap:.75rem;align-items:center">
        <div class="search-bar">
          <span class="icon">🔍</span>
          <input class="form-control" id="func-search" placeholder="Buscar funcionário..." style="width:220px">
        </div>
        <button class="btn btn-primary" id="btn-new-func">+ Novo Funcionário</button>
      </div>
    </div>
    <div class="table-wrapper">
      <table id="table-funcionarios">
        <thead><tr>
          <th>#</th>
          <th>Nome</th>
          <th>CPF</th>
          <th>Cargo</th>
          <th>Email</th>
          <th>Empresa</th>
          <th>Situação</th>
          <th>Ações</th>
        </tr></thead>
        <tbody><tr><td colspan="8" style="text-align:center;padding:2rem"><span class="spinner"></span></td></tr></tbody>
      </table>
    </div>`;

  let empresasList = [];
  const [funcs, emps] = await Promise.allSettled([API.funcionarios.list(), API.empresas.list()]);
  if (emps.status === 'fulfilled') empresasList = emps.value || [];

  const tbody = view.querySelector('#table-funcionarios tbody');
  if (funcs.status === 'fulfilled' && funcs.value?.length) {
    tbody.innerHTML = funcs.value.map(f => `
      <tr>
        <td><code style="font-family:var(--font-mono);font-size:.8rem;color:var(--text-muted)">${f.id}</code></td>
        <td style="font-weight:500">${f.nome}</td>
        <td style="font-family:var(--font-mono);font-size:.85rem">${f.cpf ?? '—'}</td>
        <td>${f.cargo ?? '—'}</td>
        <td>${f.email ?? '—'}</td>
        <td>${f.nomeEmpresa ?? f.empresa?.nome ?? '—'}</td>
        <td>
          <span class="badge ${f.ativo ? 'badge-success' : 'badge-danger'}">
            ${f.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td><div style="display:flex;gap:.5rem">
          <button class="btn btn-secondary btn-sm" onclick="editFuncionario(${f.id})">✏️ Editar</button>
          <button class="btn btn-danger btn-sm" onclick="deleteFuncionario(${f.id},'${f.nome}')">🗑️</button>
        </div></td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = emptyRow(8, funcs.status === 'rejected' ? 'Erro ao carregar.' : 'Nenhum funcionário.');
  }

  document.getElementById('func-search').addEventListener('input', e => filterTable('table-funcionarios', e.target.value));
  document.getElementById('btn-new-func').addEventListener('click', () => openFuncionarioModal(null, empresasList));

  window.editFuncionario = async (id) => { const f = await API.funcionarios.get(id); openFuncionarioModal(f, empresasList); };
  window.deleteFuncionario = (id, nome) => confirmDelete(nome, async () => {
    try { await API.funcionarios.delete(id); Toast.success('Funcionário excluído!'); pageFuncionarios(); }
    catch (e) { Toast.error(e.message); }
  });
}

function openFuncionarioModal(func, empresas) {
  const isEdit = !!func;
  const modalId = 'modal-funcionario';

  const html = `
    <div class="modal-overlay" id="${modalId}">
      <div class="modal">
        <button class="modal-close" onclick="Modal.close('${modalId}')">✕</button>
        <h2>${isEdit ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
        <form id="form-funcionario">
          <div class="grid-2">
            <div class="form-group">
              <label>Nome *</label>
              <input class="form-control" name="nome" required value="${func?.nome ?? ''}">
            </div>
            <div class="form-group">
              <label>CPF</label>
              <input class="form-control" name="cpf" value="${func?.cpf ?? ''}">
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Cargo</label>
              <input class="form-control" name="cargo" value="${func?.cargo ?? ''}">
            </div>
            <div class="form-group">
              <label>Salário</label>
              <input class="form-control" name="salario" type="number" step="0.01" value="${func?.salario ?? ''}">
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input class="form-control" name="email" type="email" value="${func?.email ?? ''}">
          </div>
          <div class="form-group">
            <label>Empresa</label>
            <select class="form-control" name="idEmpresa">
              <option value="">— Selecione —</option>
              ${empresas.map(e => `<option value="${e.id}" ${(func?.idEmpresa ?? func?.empresa?.id) == e.id ? 'selected' : ''}>${e.nome}</option>`).join('')}
            </select>
          </div>
          
          <!-- Campo Situação (ATIVO/INATIVO) -->
          <div class="form-group">
            <label>Situação</label>
            <select class="form-control" name="ativo">
              <option value="true" ${func?.ativo === true || func?.ativo === 'true' ? 'selected' : ''}>Ativo</option>
              <option value="false" ${func?.ativo === false || func?.ativo === 'false' ? 'selected' : ''}>Inativo</option>
            </select>
          </div>
          
          <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1rem">
            <button type="button" class="btn btn-secondary" onclick="Modal.close('${modalId}')">Cancelar</button>
            <button type="submit" class="btn btn-primary" id="btn-save-func">${isEdit ? 'Salvar' : 'Criar'}</button>
          </div>
        </form>
      </div>
    </div>`;

  document.getElementById(modalId)?.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  Modal.open(modalId);

  document.getElementById('form-funcionario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-func');
    setLoading(btn, true);
    try {
      const data = formToObject(e.target);
      // Converter ativo para boolean
      data.ativo = data.ativo === 'true';
      
      // Converter salário para número
      if (data.salario) data.salario = parseFloat(data.salario);
      
      if (isEdit) await API.funcionarios.update(func.id, data);
      else await API.funcionarios.create(data);
      Toast.success(isEdit ? 'Funcionário atualizado!' : 'Funcionário criado!');
      Modal.close(modalId);
      document.getElementById(modalId)?.remove();
      pageFuncionarios();
    } catch (err) { Toast.error(err.message); }
    finally { setLoading(btn, false); }
  });
}