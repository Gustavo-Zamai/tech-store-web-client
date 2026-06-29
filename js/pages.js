// =============================================
// TECH STORE — Page Controllers (Modular)
// =============================================

import { 
  DashboardPage,
  ClientesPage,
  ProdutosPage,
  VendasPage,
  FuncionariosPage,
  EmpresasPage,
  FornecedoresPage,
  CategoriasPage
} from './pages/index.js';

const Pages = {
  dashboard: () => DashboardPage.render(),
  clientes: () => ClientesPage.render(),
  produtos: () => ProdutosPage.render(),
  vendas: () => VendasPage.render(),
  funcionarios: () => FuncionariosPage.render(),
  empresas: () => EmpresasPage.render(),
  fornecedores: () => FornecedoresPage.render(),
  categorias: () => CategoriasPage.render()
};

export default Pages;