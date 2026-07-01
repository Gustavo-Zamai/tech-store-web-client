/* =============================================
   TECH STORE — Dashboard
   ============================================= */

async function pageDashboard() {
  const el = document.getElementById('view-dashboard');
  el.innerHTML = `
    <div class="section-header">
      <h1>Dashboard</h1>
      <span style="font-size:.8125rem;color:var(--text-muted)">Visão geral do sistema</span>
    </div>
    <div class="grid-3" id="dash-stats" style="margin-bottom:1.75rem">
      ${['Produtos','Clientes','Vendas','Funcionários','Fornecedores','Categorias'].map(n =>
        `<div class="stat-card"><div class="label">${n}</div>
         <div class="value" id="dash-${n.toLowerCase().replace('á','a').replace('ó','o').replace('é','e').replace('ê','e')}">
           <span class="spinner"></span></div></div>`
      ).join('')}
    </div>
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);padding:1.5rem">
      <h2 style="font-size:1rem;font-weight:600;margin-bottom:1rem">Últimas Vendas</h2>
      <div class="table-wrapper">
        <table id="dash-vendas-table">
          <thead><tr><th>#</th><th>Cliente</th><th>Funcionário</th><th>Pagamento</th><th>Total</th><th>Data</th></tr></thead>
          <tbody><tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted)"><span class="spinner"></span></td></tr></tbody>
        </table>
      </div>
    </div>`;

  const counts = { produtos:0, clientes:0, vendas:0, funcionarios:0, fornecedores:0, categorias:0 };

  await Promise.allSettled([
    API.produtos.list().then(d     => counts.produtos     = Array.isArray(d) ? d.length : 0),
    API.clientes.list().then(d     => counts.clientes     = Array.isArray(d) ? d.length : 0),
    API.vendas.list().then(d       => counts.vendas       = Array.isArray(d) ? d.length : 0),
    API.funcionarios.list().then(d => counts.funcionarios = Array.isArray(d) ? d.length : 0),
    API.fornecedores.list().then(d => counts.fornecedores = Array.isArray(d) ? d.length : 0),
    API.categorias.list().then(d   => counts.categorias   = Array.isArray(d) ? d.length : 0),
  ]);

  Object.entries(counts).forEach(([k, v]) => {
    const cell = document.getElementById(`dash-${k}`);
    if (cell) cell.textContent = v;
  });

  try {
    const vendas = await API.vendas.list();
    const tbody = el.querySelector('#dash-vendas-table tbody');
    if (!Array.isArray(vendas) || vendas.length === 0) {
      tbody.innerHTML = emptyRow(6, 'Nenhuma venda registrada.');
      return;
    }
    const last5 = vendas.slice(-5).reverse();
    tbody.innerHTML = last5.map(v => `
      <tr>
        <td><code style="font-family:var(--font-mono);font-size:.8rem;color:var(--accent)">#${v.id}</code></td>
        <td>${v.nomeCliente ?? v.idCliente ?? '—'}</td>
        <td>${v.nomeFuncionario ?? v.idFuncionario ?? '—'}</td>
        <td><span class="badge badge-info">${v.metodoPagamento ?? '—'}</span></td>
        <td style="font-weight:600">${formatCurrency(v.total ?? v.valorTotal)}</td>
        <td style="color:var(--text-secondary);font-size:.8125rem">${formatDate(v.dataVenda ?? v.data)}</td>
      </tr>`).join('');
  } catch {
    el.querySelector('#dash-vendas-table tbody').innerHTML = emptyRow(6, 'Erro ao carregar vendas.');
  }
}
