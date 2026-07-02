/* =============================================
   TECH STORE — Produtos
   ============================================= */

async function pageProdutos() {
  const view = document.getElementById('view-produtos');
  view.innerHTML = `
    <div class="section-header">
      <h1>Produtos</h1>
      <div style="display:flex;gap:.75rem;flex-wrap:wrap;align-items:center">
        <div class="search-bar">
          <span class="icon">🔍</span>
          <input class="form-control" id="prod-search" placeholder="Buscar produto..." style="width:220px">
        </div>
        <button class="btn btn-primary" id="btn-new-produto">+ Novo Produto</button>
      </div>
    </div>
    <div class="table-wrapper">
      <table id="table-produtos">
        <thead><tr>
          <th>#</th>
          <th>Nome</th>
          <th>Categoria</th>
          <th>Fornecedor</th>
          <th>Preço</th>
          <th>Estoque</th>
          <th>Situação</th>
          <th>Ações</th>
        </tr></thead>
        <tbody><tr><td colspan="8" style="text-align:center;padding:2rem"><span class="spinner"></span></td></tr></tbody>
      </table>
    </div>`;

  let categoriasList = [], fornecedoresList = [];
  const [prods, cats, fors] = await Promise.allSettled([
    API.produtos.list(), API.categorias.list(), API.fornecedores.list()
  ]);
  if (cats.status === 'fulfilled') categoriasList = cats.value || [];
  if (fors.status === 'fulfilled') fornecedoresList = fors.value || [];

  function renderTable(data) {
    const tbody = view.querySelector('#table-produtos tbody');
    if (!data?.length) { tbody.innerHTML = emptyRow(8); return; }
    tbody.innerHTML = data.map(p => {
      const stock = p.quantidadeEstoque ?? p.estoque ?? 0;
      const badge = stock === 0 ? 'badge-danger' : stock < 5 ? 'badge-warning' : 'badge-success';
      return `
        <tr>
          <td><code style="font-family:var(--font-mono);font-size:.8rem;color:var(--text-muted)">${p.id}</code></td>
          <td style="font-weight:500">${p.nome}</td>
          <td>${p.nomeCategoria ?? p.categoria?.nome ?? '—'}</td>
          <td>${p.nomeFornecedor ?? p.fornecedor?.nome ?? '—'}</td>
          <td style="font-weight:600">${formatCurrency(p.preco ?? p.precoUnitario)}</td>
          <td><span class="badge ${badge}">${stock} un.</span></td>
          <td>
            <span class="badge ${p.ativo ? 'badge-success' : 'badge-danger'}">
              ${p.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </td>
          <td><div style="display:flex;gap:.5rem">
            <button class="btn btn-secondary btn-sm" onclick="editProduto(${p.id})">✏️ Editar</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduto(${p.id},'${p.nome}')">🗑️</button>
          </div></td>
        </tr>
      `;
    }).join('');
  }

  if (prods.status === 'fulfilled') renderTable(prods.value);
  else view.querySelector('#table-produtos tbody').innerHTML = emptyRow(8, 'Erro ao carregar produtos.');

  document.getElementById('prod-search').addEventListener('input', e => filterTable('table-produtos', e.target.value));
  document.getElementById('btn-new-produto').addEventListener('click', () => openProdutoModal(null, categoriasList, fornecedoresList));

  window.editProduto = async (id) => {
    const p = await API.produtos.get(id);
    openProdutoModal(p, categoriasList, fornecedoresList);
  };
  window.deleteProduto = (id, nome) => confirmDelete(nome, async () => {
    try { await API.produtos.delete(id); Toast.success('Produto excluído!'); pageProdutos(); }
    catch (e) { Toast.error(e.message); }
  });
}

function openProdutoModal(produto, categorias, fornecedores) {
  const isEdit = !!produto;
  const modalId = 'modal-produto';

  const html = `
    <div class="modal-overlay" id="${modalId}">
      <div class="modal">
        <button class="modal-close" onclick="Modal.close('${modalId}')">✕</button>
        <h2>${isEdit ? 'Editar Produto' : 'Novo Produto'}</h2>
        <form id="form-produto">
          <div class="grid-2">
            <div class="form-group">
              <label>Nome *</label>
              <input class="form-control" name="nome" required value="${produto?.nome ?? ''}">
            </div>
            <div class="form-group">
              <label>Preço *</label>
              <input class="form-control" name="preco" type="number" step="0.01" min="0" required value="${produto?.preco ?? produto?.precoUnitario ?? ''}">
            </div>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label>Estoque *</label>
              <input class="form-control" name="quantidadeEstoque" type="number" min="0" required value="${produto?.quantidadeEstoque ?? produto?.estoque ?? ''}">
            </div>
            <div class="form-group">
              <label>Categoria</label>
              <select class="form-control" name="idCategoria">
                <option value="">— Selecione —</option>
                ${categorias.map(c => `<option value="${c.id}" ${(produto?.idCategoria ?? produto?.categoria?.id) == c.id ? 'selected' : ''}>${c.nome}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Fornecedor</label>
            <select class="form-control" name="idFornecedor">
              <option value="">— Selecione —</option>
              ${fornecedores.map(f => `<option value="${f.id}" ${(produto?.idFornecedor ?? produto?.fornecedor?.id) == f.id ? 'selected' : ''}>${f.nome}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Descrição</label>
            <textarea class="form-control" name="descricao" rows="2">${produto?.descricao ?? ''}</textarea>
          </div>
          
          <!-- Campo Situação (ATIVO/INATIVO) -->
          <div class="form-group">
            <label>Situação</label>
            <select class="form-control" name="ativo">
              <option value="true" ${produto?.ativo === true || produto?.ativo === 'true' ? 'selected' : ''}>Ativo</option>
              <option value="false" ${produto?.ativo === false || produto?.ativo === 'false' ? 'selected' : ''}>Inativo</option>
            </select>
          </div>
          
          <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1rem">
            <button type="button" class="btn btn-secondary" onclick="Modal.close('${modalId}')">Cancelar</button>
            <button type="submit" class="btn btn-primary" id="btn-save-produto">${isEdit ? 'Salvar' : 'Criar'}</button>
          </div>
        </form>
      </div>
    </div>`;

  document.getElementById(modalId)?.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  Modal.open(modalId);

  document.getElementById('form-produto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-produto');
    setLoading(btn, true);
    try {
      const data = formToObject(e.target);
      // Converter ativo para boolean
      data.ativo = data.ativo === 'true';
      
      if (isEdit) await API.produtos.update(produto.id, data);
      else await API.produtos.create(data);
      Toast.success(isEdit ? 'Produto atualizado!' : 'Produto criado!');
      Modal.close(modalId);
      document.getElementById(modalId)?.remove();
      pageProdutos();
    } catch (err) { Toast.error(err.message); }
    finally { setLoading(btn, false); }
  });
}