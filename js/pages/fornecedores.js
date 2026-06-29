// =============================================
// FORNECEDORES - Page Controller
// =============================================

export const FornecedoresPage = {
  async render() {
    const view = document.getElementById('view-fornecedores');
    view.innerHTML = `
      <div class="section-header">
        <h1>Fornecedores</h1>
        <div style="display:flex;gap:.75rem;align-items:center">
          <div class="search-bar">
            <span class="icon">🔍</span>
            <input class="form-control" id="forn-search" placeholder="Buscar fornecedor..." style="width:220px">
          </div>
          <button class="btn btn-primary" id="btn-new-forn">+ Novo Fornecedor</button>
        </div>
      </div>
      <div class="table-wrapper">
        <table id="table-fornecedores">
          <thead><tr><th>#</th><th>Nome</th><th>CNPJ</th><th>Email</th><th>Telefone</th><th>Situação</th><th>Ações</th></tr></thead>
          <tbody><tr><td colspan="7" style="text-align:center;padding:2rem"><span class="spinner"></span></td></tr></tbody>
        </table>
      </div>`;

    try {
      const data = await API.fornecedores.list();
      const tbody = view.querySelector('#table-fornecedores tbody');
      
      if (!data?.length) { 
        tbody.innerHTML = emptyRow(7); 
        return; 
      }
      
      tbody.innerHTML = data.map(f => `
        <tr>
          <td><code style="font-family:var(--font-mono);font-size:.8rem;color:var(--text-muted)">${f.id}</code></td>
          <td style="font-weight:500">${f.nome}</td>
          <td style="font-family:var(--font-mono);font-size:.85rem">${f.cnpj ?? '—'}</td>
          <td>${f.email ?? '—'}</td>
          <td>${f.telefone ?? '—'}</td>
          <td>
            <span class="badge ${f.ativo ? 'badge-success' : 'badge-danger'}">
              ${f.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </td>
          <td><div style="display:flex;gap:.5rem">
            <button class="btn btn-secondary btn-sm" onclick="window.editFornecedor(${f.id})">✏️ Editar</button>
            <button class="btn btn-danger btn-sm" onclick="window.deleteFornecedor(${f.id},'${f.nome}')">🗑️</button>
          </div></td>
        </tr>
      `).join('');
    } catch (e) {
      view.querySelector('#table-fornecedores tbody').innerHTML = emptyRow(7, 'Erro ao carregar.');
    }

    document.getElementById('forn-search').addEventListener('input', e => filterTable('table-fornecedores', e.target.value));
    document.getElementById('btn-new-forn').addEventListener('click', () => this.openModal(null));

    window.editFornecedor = async (id) => {
      const f = await API.fornecedores.get(id);
      this.openModal(f);
    };
    window.deleteFornecedor = (id, nome) => confirmDelete(nome, async () => {
      try {
        await API.fornecedores.delete(id);
        Toast.success('Fornecedor excluído!');
        this.render();
      } catch (e) {
        Toast.error(e.message);
      }
    });
  },

  openModal(forn) {
    const isEdit = !!forn;
    const modalId = 'modal-fornecedor';
    
    const html = `
      <div class="modal-overlay" id="${modalId}">
        <div class="modal" style="max-width:520px">
          <button class="modal-close" onclick="Modal.close('${modalId}')">✕</button>
          <h2>${isEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
          <form id="form-fornecedor">
            <div class="form-group">
              <label>Nome *</label>
              <input class="form-control" name="nome" required value="${forn?.nome ?? ''}">
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label>CNPJ</label>
                <input class="form-control" name="cnpj" value="${forn?.cnpj ?? ''}">
              </div>
              <div class="form-group">
                <label>Telefone</label>
                <input class="form-control" name="telefone" value="${forn?.telefone ?? ''}">
              </div>
            </div>
            <div class="form-group">
              <label>Email</label>
              <input class="form-control" name="email" type="email" value="${forn?.email ?? ''}">
            </div>
            <div class="form-group">
              <label>Endereço</label>
              <input class="form-control" name="endereco" value="${forn?.endereco ?? ''}">
            </div>
            <div class="form-group">
              <label>Situação</label>
              <select class="form-control" name="ativo">
                <option value="true" ${forn?.ativo === true || forn?.ativo === 'true' ? 'selected' : ''}>Ativo</option>
                <option value="false" ${forn?.ativo === false || forn?.ativo === 'false' ? 'selected' : ''}>Inativo</option>
              </select>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1rem">
              <button type="button" class="btn btn-secondary" onclick="Modal.close('${modalId}')">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="btn-save-forn">${isEdit ? 'Salvar' : 'Criar'}</button>
            </div>
          </form>
        </div>
      </div>`;
      
    document.getElementById(modalId)?.remove();
    document.body.insertAdjacentHTML('beforeend', html);
    Modal.open(modalId);
    
    document.getElementById('form-fornecedor').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-save-forn');
      setLoading(btn, true);
      
      try {
        const data = formToObject(e.target);
        data.ativo = data.ativo === 'true';
        
        if (isEdit) {
          await API.fornecedores.update(forn.id, data);
        } else {
          await API.fornecedores.create(data);
        }
        
        Toast.success(isEdit ? 'Fornecedor atualizado!' : 'Fornecedor criado!');
        Modal.close(modalId);
        document.getElementById(modalId)?.remove();
        this.render();
      } catch (err) {
        Toast.error(err.message);
      } finally {
        setLoading(btn, false);
      }
    });
  }
};