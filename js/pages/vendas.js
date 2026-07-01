/* =============================================
   TECH STORE — Vendas
   ============================================= */

async function pageVendas() {
  const view = document.getElementById('view-vendas');
  view.innerHTML = `
    <div class="section-header">
      <h1>Vendas</h1>
      <button class="btn btn-primary" id="btn-new-venda">+ Nova Venda</button>
    </div>
    <div class="table-wrapper">
      <table id="table-vendas">
        <thead><tr><th>#</th><th>Cliente</th><th>Funcionário</th><th>Pagamento</th><th>Itens</th><th>Total</th><th>Data</th><th>Ações</th></tr></thead>
        <tbody><tr><td colspan="8" style="text-align:center;padding:2rem"><span class="spinner"></span></td></tr></tbody>
      </table>
    </div>`;

  try {
    const data = await API.vendas.list();
    const tbody = view.querySelector('#table-vendas tbody');
    if (!data?.length) { tbody.innerHTML = emptyRow(8); return; }
    tbody.innerHTML = data.map(v => `<tr>
      <td><code style="font-family:var(--font-mono);font-size:.8rem;color:var(--accent)">#${v.id}</code></td>
      <td>${v.nomeCliente ?? v.idCliente ?? '—'}</td>
      <td>${v.nomeFuncionario ?? v.idFuncionario ?? '—'}</td>
      <td><span class="badge badge-info">${v.metodoPagamento ?? '—'}</span></td>
      <td style="text-align:center">${v.itens?.length ?? '—'}</td>
      <td style="font-weight:600;color:var(--accent)">${formatCurrency(v.total ?? v.valorTotal)}</td>
      <td style="font-size:.8125rem;color:var(--text-secondary)">${formatDate(v.dataVenda ?? v.data)}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteVenda(${v.id})">🗑️ Excluir</button>
      </td>
    </tr>`).join('');
  } catch {
    view.querySelector('#table-vendas tbody').innerHTML = emptyRow(8, 'Erro ao carregar vendas.');
  }

  document.getElementById('btn-new-venda').addEventListener('click', openVendaModal);

  window.deleteVenda = (id) => confirmDelete(`Venda #${id}`, async () => {
    try { await API.vendas.delete(id); Toast.success('Venda excluída!'); pageVendas(); }
    catch (e) { Toast.error(e.message); }
  });
}

async function openVendaModal() {
  const modalId = 'modal-venda';
  const [clientesList, funcList, prodList] = await Promise.all([
    API.clientes.list().catch(() => []),
    API.funcionarios.list().catch(() => []),
    API.produtos.list().catch(() => []),
  ]);

  const metodos = ['CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'DINHEIRO', 'TRANSFERENCIA'];
  let itens = [];

  const html = `
    <div class="modal-overlay" id="${modalId}">
      <div class="modal" style="max-width:640px">
        <button class="modal-close" onclick="Modal.close('${modalId}')">✕</button>
        <h2>Nova Venda</h2>
        <form id="form-venda">
          <div class="grid-2">
            <div class="form-group">
              <label>Cliente *</label>
              <select class="form-control" name="idCliente" required>
                <option value="">— Selecione —</option>
                ${clientesList.map(c => `<option value="${c.id}">${c.nome}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Funcionário *</label>
              <select class="form-control" name="idFuncionario" required>
                <option value="">— Selecione —</option>
                ${funcList.map(f => `<option value="${f.id}">${f.nome}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Método de Pagamento *</label>
            <select class="form-control" name="metodoPagamento" required>
              <option value="">— Selecione —</option>
              ${metodos.map(m => `<option value="${m}">${m.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </div>
          <div style="margin-bottom:1rem">
            <label style="font-size:.8125rem;font-weight:500;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.04em">Itens da Venda</label>
            <div style="display:flex;gap:.5rem;margin-top:.5rem;margin-bottom:.75rem">
              <select class="form-control" id="select-produto" style="flex:1">
                <option value="">— Produto —</option>
                ${prodList.map(p => `<option value="${p.id}" data-preco="${p.preco ?? p.precoUnitario}" data-nome="${p.nome}">${p.nome} (${formatCurrency(p.preco ?? p.precoUnitario)})</option>`).join('')}
              </select>
              <input class="form-control" id="input-qtd" type="number" min="1" value="1" style="width:80px">
              <button type="button" class="btn btn-secondary" id="btn-add-item">+ Add</button>
            </div>
            <div id="itens-list"></div>
            <div id="total-venda" style="text-align:right;font-weight:700;font-size:1.125rem;color:var(--accent);margin-top:.5rem"></div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1rem">
            <button type="button" class="btn btn-secondary" onclick="Modal.close('${modalId}')">Cancelar</button>
            <button type="submit" class="btn btn-primary" id="btn-save-venda">Registrar Venda</button>
          </div>
        </form>
      </div>
    </div>`;

  document.getElementById(modalId)?.remove();
  document.body.insertAdjacentHTML('beforeend', html);
  Modal.open(modalId);

  function renderItens() {
    const container = document.getElementById('itens-list');
    let total = 0;
    container.innerHTML = itens.map((item, idx) => {
      const prod = prodList.find(p => p.id == item.idProduto);
      const preco = prod?.preco ?? prod?.precoUnitario ?? 0;
      const subtotal = preco * item.quantidade;
      total += subtotal;
      return `<div style="display:flex;align-items:center;gap:.75rem;padding:.5rem;background:var(--bg-base);border-radius:var(--radius-sm);margin-bottom:.375rem">
        <span style="flex:1;font-size:.875rem">${prod?.nome ?? item.idProduto}</span>
        <span style="font-size:.8rem;color:var(--text-muted)">${item.quantidade}x ${formatCurrency(preco)}</span>
        <span style="font-weight:600;color:var(--accent);min-width:70px;text-align:right">${formatCurrency(subtotal)}</span>
        <button type="button" class="btn btn-danger btn-sm" onclick="window._removeItem(${idx})">✕</button>
      </div>`;
    }).join('') || '<p style="color:var(--text-muted);font-size:.875rem">Nenhum item adicionado ainda.</p>';
    document.getElementById('total-venda').textContent = itens.length ? `Total: ${formatCurrency(total)}` : '';
  }

  window._removeItem = (idx) => { itens.splice(idx, 1); renderItens(); };

  document.getElementById('btn-add-item').addEventListener('click', () => {
    const sel = document.getElementById('select-produto');
    const qtd = parseInt(document.getElementById('input-qtd').value);
    if (!sel.value || !qtd || qtd < 1) { Toast.error('Selecione um produto e quantidade válida.'); return; }
    const exists = itens.find(i => i.idProduto == sel.value);
    if (exists) exists.quantidade += qtd;
    else itens.push({ idProduto: Number(sel.value), quantidade: qtd });
    renderItens();
  });

  document.getElementById('form-venda').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!itens.length) { Toast.error('Adicione pelo menos um item.'); return; }
    const btn = document.getElementById('btn-save-venda');
    setLoading(btn, true);
    try {
      const data = {
        ...formToObject(e.target),
        itens: itens.map(i => ({ idProduto: i.idProduto, quantidade: i.quantidade }))
      };
      await API.vendas.create(data);
      Toast.success('Venda registrada com sucesso!');
      Modal.close(modalId);
      document.getElementById(modalId)?.remove();
      pageVendas();
    } catch (err) { Toast.error(err.message); }
    finally { setLoading(btn, false); }
  });
}
