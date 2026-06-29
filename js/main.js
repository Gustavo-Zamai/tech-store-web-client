// =============================================
// TECH STORE — Main Entry Point
// =============================================

import './pages.js';
import './router.js';

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Router
  Router.init();
  console.log('🚀 Tech Store iniciado com sucesso!');
});

// Exportar para uso global
window.Router = Router;