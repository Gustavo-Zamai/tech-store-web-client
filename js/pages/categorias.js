/* =============================================
   TECH STORE — Categorias
   ============================================= */

async function pageCategorias() {
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
        <thead><tr>
          <th>#</th>
          <th>Nome</th>
          <th>Situação</th>
          <th>Data Cadastro</th>
          <th>Ações</th>
        </tr></thead>
        <tbody><tr><td colspan="5" style="text-align:center;padding:2rem"><span class="spinner"></span></td></tr></tbody>
      </table>
    </div>`;

  try {
    const data = await API.categorias.list();
    const tbody = view.querySelector('#table-categorias tbody');
    if (!data?.length) { tbody.innerHTML = emptyRow(5); return; }
    tbody.innerHTML = data.map(c => `
      <tr>
        <td><code style="font-family:var(--font-mono);font-size:.8rem;color:var(--text-muted)">${c.id}</code></td>
        <td style="font-weight:500">${c.descricao}</td>
        <td>
          <span class="badge ${c.ativo ? 'badge-success' : 'badge-danger'}">
            ${c.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td style="font-size:.8125rem;color:var(--text-secondary)">${formatDateDisplay(c.dataCadastro)}</td>
        <td><div style="display:flex;gap:.5rem">
          <button class="btn btn-secondary btn-sm" onclick="editCategoria(${c.id})">✏️ Editar</button>
          <button class="btn btn-danger btn-sm" onclick="deleteCategoria(${c.id},'${c.descricao}')">🗑️</button>
        </div></td>
      </tr>
    `).join('');
  } catch (e) {
    console.error('Erro ao carregar categorias:', e);
    view.querySelector('#table-categorias tbody').innerHTML = emptyRow(5, 'Erro ao carregar categorias.');
  }

  document.getElementById('cat-search').addEventListener('input', e => filterTable('table-categorias', e.target.value));
  document.getElementById('btn-new-cat').addEventListener('click', () => openCategoriaModal(null));

  window.editCategoria = async (id) => { 
    try {
      const c = await API.categorias.get(id); 
      openCategoriaModal(c); 
    } catch (e) {
      Toast.error('Erro ao carregar categoria para edição');
    }
  };
  
  window.deleteCategoria = (id, descricao) => confirmDelete(descricao, async () => {
    try { 
      await API.categorias.delete(id); 
      Toast.success('Categoria excluída!'); 
      pageCategorias(); 
    } catch (e) { 
      Toast.error(e.message); 
    }
  });
}

function openCategoriaModal(cat) {
  const isEdit = !!cat;
  const modalId = 'modal-categoria';

  const html = `
    <div class="modal-overlay" id="${modalId}">
      <div class="modal" style="max-width:420px">
        <button class="modal-close" onclick="Modal.close('${modalId}')">✕</button>
        <h2>${isEdit ? 'Editar Categoria' : 'Nova Categoria'}</h2>
        <form id="form-categoria">
          <div class="form-group">
            <label>Nome da Categoria *</label>
            <input class="form-control" name="descricao" required value="${cat?.descricao ?? ''}">
          </div>
          
          <div class="form-group">
            <label>Situação</label>
            <select class="form-control" name="ativo">
              <option value="true" ${cat?.ativo === true ? 'selected' : ''}>Ativo</option>
              <option value="false" ${cat?.ativo === false ? 'selected' : ''}>Inativo</option>
            </select>
          </div>
          
          <!-- Campo oculto para dataCadastro - será preenchido automaticamente -->
          <input type="hidden" name="dataCadastro" id="data-cadastro">
          
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

  // Preencher a data atual no campo oculto (apenas para criação)
  const dataInput = document.getElementById('data-cadastro');
  if (dataInput && !isEdit) {
    // Envia a data atual no formato ISO com timezone
    dataInput.value = formatDateToISO(new Date());
    console.log('📅 Data de cadastro:', dataInput.value);
  }

  document.getElementById('form-categoria').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-cat');
    setLoading(btn, true);
    
    try {
      const formData = new FormData(e.target);
      const data = {};
      
      // Mapear campos corretamente
      for (const [key, value] of formData.entries()) {
        if (value !== '' && value !== null && value !== undefined) {
          if (key === 'ativo') {
            // Enviar como boolean (o backend espera boolean)
            data[key] = value === 'true';
          } else if (key === 'dataCadastro') {
            // Manter como string ISO com timezone
            data[key] = value;
          } else {
            data[key] = value;
          }
        }
      }
      
      console.log('📦 Enviando categoria:', data);
      
      let response;
      if (isEdit) {
        // Na edição, não enviar dataCadastro (opcional)
        delete data.dataCadastro;
        response = await API.categorias.update(cat.id, data);
      } else {
        response = await API.categorias.create(data);
      }
      
      console.log('✅ Resposta:', response);
      
      Toast.success(isEdit ? 'Categoria atualizada!' : 'Categoria criada!');
      Modal.close(modalId);
      document.getElementById(modalId)?.remove();
      pageCategorias();
    } catch (err) { 
      console.error('❌ Erro ao salvar categoria:', err);
      Toast.error(err.message || 'Erro ao salvar categoria'); 
    } finally { 
      setLoading(btn, false); 
    }
  });
}