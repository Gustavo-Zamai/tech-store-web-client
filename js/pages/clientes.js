// =============================================
// CLIENTES - Page Controller
// =============================================

export const ClientesPage = {
  async render() {
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
          <thead><tr><th>#</th><th>Nome</th><th>CPF/CNPJ</th><th>Email</th><th>Telefone</th><th>Situação</th><th>Ações</th></tr></thead>
          <tbody><tr><td colspan="7" style="text-align:center;padding:2rem"><span class="spinner"></span></td></tr></tbody>
        </table>
      </div>`;

    try {
      const data = await API.clientes.list();
      const tbody = view.querySelector('#table-clientes tbody');
      if (!data?.length) { 
        tbody.innerHTML = emptyRow(7); 
        return; 
      }
      
      tbody.innerHTML = data.map(c => `
        <tr>
          <td><code style="font-family:var(--font-mono);font-size:.8rem;color:var(--text-muted)">${c.id}</code></td>
          <td style="font-weight:500">${c.nomeCompleto}</td>
          <td style="font-family:var(--font-mono);font-size:.85rem">${c.cpf ?? c.cnpj ?? '—'}</td>
          <td>${c.email ?? '—'}</td>
          <td>${c.telefone ?? '—'}</td>
          <td>
            <span class="badge ${c.ativo ? 'badge-success' : 'badge-danger'}">
              ${c.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </td>
          <td><div style="display:flex;gap:.5rem">
            <button class="btn btn-secondary btn-sm" onclick="window.editCliente(${c.id})">✏️ Editar</button>
            <button class="btn btn-danger btn-sm" onclick="window.deleteCliente(${c.id},'${c.nomeCompleto}')">🗑️</button>
          </div></td>
        </tr>
      `).join('');
    } catch (e) {
      view.querySelector('#table-clientes tbody').innerHTML = emptyRow(7, 'Erro ao carregar clientes.');
    }

    document.getElementById('cli-search').addEventListener('input', e => filterTable('table-clientes', e.target.value));
    document.getElementById('btn-new-cliente').addEventListener('click', () => this.openModal(null));

    // Expor para uso global (onclick)
    window.editCliente = async (id) => { 
      const c = await API.clientes.get(id); 
      this.openModal(c); 
    };
    window.deleteCliente = (id, nome) => confirmDelete(nome, async () => {
      try { 
        await API.clientes.delete(id); 
        Toast.success('Cliente excluído!'); 
        this.render(); 
      } catch (e) { 
        Toast.error(e.message); 
      }
    });
  },

  openModal(cliente) {
    const isEdit = !!cliente;
    const modalId = 'modal-cliente';
    
    let html = `
      <div class="modal-overlay" id="${modalId}">
        <div class="modal" style="max-width:560px">
          <button class="modal-close" onclick="Modal.close('${modalId}')">✕</button>
          <h2>${isEdit ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <form id="form-cliente">
            <div class="grid-2">
              <div class="form-group">
                <label>Nome Completo *</label>
                <input class="form-control" name="nomeCompleto" required value="${cliente?.nomeCompleto ?? ''}">
              </div>
              <div class="form-group">
                <label>CPF/CNPJ</label>
                <input class="form-control" name="cpf" value="${cliente?.cpf ?? ''}">
              </div>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label>Email</label>
                <input class="form-control" name="email" type="email" value="${cliente?.email ?? ''}">
              </div>
              <div class="form-group">
                <label>Telefone</label>
                <input class="form-control" name="telefone" value="${cliente?.telefone ?? ''}">
              </div>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label>Endereço</label>
                <input class="form-control" name="endereco" value="${cliente?.endereco ?? ''}">
              </div>
              <div class="form-group">
                <label>Número</label>
                <input class="form-control" name="numero" type="number" value="${cliente?.numero ?? ''}">
              </div>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label>Bairro</label>
                <input class="form-control" name="bairro" value="${cliente?.bairro ?? ''}">
              </div>
              <div class="form-group">
                <label>Cidade</label>
                <input class="form-control" name="cidade" value="${cliente?.cidade ?? ''}">
              </div>
            </div>
            <div class="form-group">
              <label>UF</label>
              <input class="form-control" name="estado" value="${cliente?.estado ?? ''}">
            </div>
            <div class="form-group">
              <label>Situação</label>
              <select class="form-control" name="ativo">
                <option value="true" ${cliente?.ativo === true || cliente?.ativo === 'true' ? 'selected' : ''}>Ativo</option>
                <option value="false" ${cliente?.ativo === false || cliente?.ativo === 'false' ? 'selected' : ''}>Inativo</option>
              </select>
            </div>
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
        data.ativo = data.ativo === 'true';
        
        if (isEdit) {
          await API.clientes.update(cliente.id, data);
        } else {
          await API.clientes.create(data);
        }
        
        Toast.success(isEdit ? 'Cliente atualizado!' : 'Cliente criado!');
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