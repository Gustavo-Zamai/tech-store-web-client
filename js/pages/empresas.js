// =============================================
// EMPRESAS - Page Controller
// =============================================

export const EmpresasPage = {
  async render() {
    const view = document.getElementById('view-empresas');
    view.innerHTML = `
      <div class="section-header">
        <h1>Empresas</h1>
        <div style="display:flex;gap:.75rem;align-items:center">
          <div class="search-bar">
            <span class="icon">🔍</span>
            <input class="form-control" id="empresa-search" placeholder="Buscar empresa..." style="width:220px">
          </div>
          <button class="btn btn-primary" id="btn-new-empresa">+ Nova Empresa</button>
        </div>
      </div>
      <div class="table-wrapper">
        <table id="table-empresas">
          <thead><tr>
            <th>#</th>
            <th>Nome</th>
            <th>CNPJ</th>
            <th>Email</th>
            <th>Telefone</th>
            <th>Situação</th>
            <th>Ações</th>
          </tr></thead>
          <tbody><tr><td colspan="7" style="text-align:center;padding:2rem"><span class="spinner"></span></td></tr></tbody>
        </table>
      </div>`;

    try {
      const data = await API.empresas.list();
      const tbody = view.querySelector('#table-empresas tbody');
      
      if (!data?.length) { 
        tbody.innerHTML = emptyRow(7); 
        return; 
      }
      
      tbody.innerHTML = data.map(e => `
        <tr>
          <td><code style="font-family:var(--font-mono);font-size:.8rem;color:var(--text-muted)">${e.id}</code></td>
          <td style="font-weight:500">${e.nome}</td>
          <td style="font-family:var(--font-mono);font-size:.85rem">${e.cnpj ?? '—'}</td>
          <td>${e.email ?? '—'}</td>
          <td>${e.telefone ?? '—'}</td>
          <td>
            <span class="badge ${e.ativo ? 'badge-success' : 'badge-danger'}">
              ${e.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </td>
          <td><div style="display:flex;gap:.5rem">
            <button class="btn btn-secondary btn-sm" onclick="window.editEmpresa(${e.id})">✏️ Editar</button>
            <button class="btn btn-danger btn-sm" onclick="window.deleteEmpresa(${e.id},'${e.nome}')">🗑️</button>
          </div></td>
        </tr>
      `).join('');
    } catch (e) {
      view.querySelector('#table-empresas tbody').innerHTML = emptyRow(7, 'Erro ao carregar empresas.');
    }

    document.getElementById('empresa-search').addEventListener('input', e => filterTable('table-empresas', e.target.value));
    document.getElementById('btn-new-empresa').addEventListener('click', () => this.openModal(null));

    // Expor para uso global (onclick)
    window.editEmpresa = async (id) => {
      const e = await API.empresas.get(id);
      this.openModal(e);
    };
    window.deleteEmpresa = (id, nome) => confirmDelete(nome, async () => {
      try {
        await API.empresas.delete(id);
        Toast.success('Empresa excluída!');
        this.render();
      } catch (e) {
        Toast.error(e.message);
      }
    });
  },

  openModal(empresa) {
    const isEdit = !!empresa;
    const modalId = 'modal-empresa';
    
    const html = `
      <div class="modal-overlay" id="${modalId}">
        <div class="modal" style="max-width:560px">
          <button class="modal-close" onclick="Modal.close('${modalId}')">✕</button>
          <h2>${isEdit ? 'Editar Empresa' : 'Nova Empresa'}</h2>
          <form id="form-empresa">
            <div class="form-group">
              <label>Nome *</label>
              <input class="form-control" name="nome" required value="${empresa?.nome ?? ''}">
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label>CNPJ</label>
                <input class="form-control" name="cnpj" value="${empresa?.cnpj ?? ''}">
              </div>
              <div class="form-group">
                <label>Telefone</label>
                <input class="form-control" name="telefone" value="${empresa?.telefone ?? ''}">
              </div>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label>Email</label>
                <input class="form-control" name="email" type="email" value="${empresa?.email ?? ''}">
              </div>
              <div class="form-group">
                <label>Site</label>
                <input class="form-control" name="site" value="${empresa?.site ?? ''}">
              </div>
            </div>
            <div class="form-group">
              <label>Endereço</label>
              <input class="form-control" name="endereco" value="${empresa?.endereco ?? ''}">
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label>Cidade</label>
                <input class="form-control" name="cidade" value="${empresa?.cidade ?? ''}">
              </div>
              <div class="form-group">
                <label>UF</label>
                <input class="form-control" name="estado" value="${empresa?.estado ?? ''}" maxlength="2">
              </div>
            </div>
            <div class="form-group">
              <label>Situação</label>
              <select class="form-control" name="ativo">
                <option value="true" ${empresa?.ativo === true || empresa?.ativo === 'true' ? 'selected' : ''}>Ativo</option>
                <option value="false" ${empresa?.ativo === false || empresa?.ativo === 'false' ? 'selected' : ''}>Inativo</option>
              </select>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1rem">
              <button type="button" class="btn btn-secondary" onclick="Modal.close('${modalId}')">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="btn-save-empresa">${isEdit ? 'Salvar' : 'Criar'}</button>
            </div>
          </form>
        </div>
      </div>`;

    document.getElementById(modalId)?.remove();
    document.body.insertAdjacentHTML('beforeend', html);
    Modal.open(modalId);

    document.getElementById('form-empresa').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-save-empresa');
      setLoading(btn, true);
      
      try {
        const data = formToObject(e.target);
        data.ativo = data.ativo === 'true';
        
        if (isEdit) {
          await API.empresas.update(empresa.id, data);
        } else {
          await API.empresas.create(data);
        }
        
        Toast.success(isEdit ? 'Empresa atualizada!' : 'Empresa criada!');
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