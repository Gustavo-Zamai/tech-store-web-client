// =============================================
// CATEGORIAS - Page Controller
// =============================================

export const CategoriasPage = {
  async render() {
    const view = document.getElementById('view-categorias');
    view.innerHTML = `
      <div class="section-header">
        <h1>Categorias</h1>
        <div style="display:flex;gap:.75rem;align-items:center">
          <div class="search-bar">
            <span class="icon">🔍</span>
            <input class="form-control" id="cat-search" placeholder="Buscar categoria..." style="width:220px">
          </div>
          <button class="btn btn-primary" id="btn-new-cat">+ Nova Categoria</button>
        </div>
      </div>
      <div class="table-wrapper">
        <table id="table-categorias">
          <thead><tr><th>#</th><th>Nome</th><th>Descrição</th><th>Situação</th><th>Ações</th></tr></thead>
          <tbody><tr><td colspan="5" style="text-align:center;padding:2rem"><span class="spinner"></span></td></tr></tbody>
        </table>
      </div>`;

    try {
      const data = await API.categorias.list();
      const tbody = view.querySelector('#table-categorias tbody');
      
      if (!data?.length) { 
        tbody.innerHTML = emptyRow(5); 
        return; 
      }
      
      tbody.innerHTML = data.map(c => `
        <tr>
          <td><code style="font-family:var(--font-mono);font-size:.8rem;color:var(--text-muted)">${c.id}</code></td>
          <td style="font-weight:500">${c.nome}</td>
          <td style="color:var(--text-secondary)">${c.descricao ?? '—'}</td>
          <td>
            <span class="badge ${c.ativo ? 'badge-success' : 'badge-danger'}">
              ${c.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </td>
          <td><div style="display:flex;gap:.5rem">
            <button class="btn btn-secondary btn-sm" onclick="window.editCategoria(${c.id})">✏️ Editar</button>
            <button class="btn btn-danger btn-sm" onclick="window.deleteCategoria(${c.id},'${c.nome}')">🗑️</button>
          </div></td>
        </tr>
      `).join('');
    } catch (e) {
      view.querySelector('#table-categorias tbody').innerHTML = emptyRow(5, 'Erro ao carregar.');
    }

    document.getElementById('cat-search').addEventListener('input', e => filterTable('table-categorias', e.target.value));
    document.getElementById('btn-new-cat').addEventListener('click', () => this.openModal(null));

    window.editCategoria = async (id) => {
      const c = await API.categorias.get(id);
      this.openModal(c);
    };
    window.deleteCategoria = (id, nome) => confirmDelete(nome, async () => {
      try {
        await API.categorias.delete(id);
        Toast.success('Categoria excluída!');
        this.render();
      } catch (e) {
        Toast.error(e.message);
      }
    });
  },

  openModal(cat) {
    const isEdit = !!cat;
    const modalId = 'modal-categoria';
    
    const html = `
      <div class="modal-overlay" id="${modalId}">
        <div class="modal" style="max-width:420px">
          <button class="modal-close" onclick="Modal.close('${modalId}')">✕</button>
          <h2>${isEdit ? 'Editar Categoria' : 'Nova Categoria'}</h2>
          <form id="form-categoria">
            <div class="form-group">
              <label>Nome *</label>
              <input class="form-control" name="nome" required value="${cat?.nome ?? ''}">
            </div>
            <div class="form-group">
              <label>Descrição</label>
              <textarea class="form-control" name="descricao" rows="2">${cat?.descricao ?? ''}</textarea>
            </div>
            <div class="form-group">
              <label>Situação</label>
              <select class="form-control" name="ativo">
                <option value="true" ${cat?.ativo === true || cat?.ativo === 'true' ? 'selected' : ''}>Ativo</option>
                <option value="false" ${cat?.ativo === false || cat?.ativo === 'false' ? 'selected' : ''}>Inativo</option>
              </select>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1rem">
              <button type="button" class="btn btn-secondary" onclick="Modal.close('${modalId}')">Cancelar</button>
              <button type="submit" class="btn btn-primary" id="btn-save-cat">${isEdit ? 'Salvar' : 'Criar'}</button>
            </div>
          </form>
        </div>
      </div>`;
      
    document.getElementById(modalId)?.remove();
    document.body.insertAdjacentHTML('beforeend', html);
    Modal.open(modalId);
    
    document.getElementById('form-categoria').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-save-cat');
      setLoading(btn, true);
      
      try {
        const data = formToObject(e.target);
        data.ativo = data.ativo === 'true';
        
        if (isEdit) {
          await API.categorias.update(cat.id, data);
        } else {
          await API.categorias.create(data);
        }
        
        Toast.success(isEdit ? 'Categoria atualizada!' : 'Categoria criada!');
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