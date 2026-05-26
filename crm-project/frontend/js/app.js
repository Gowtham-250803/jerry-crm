// General App JS for FlowCRM
console.log('FlowCRM app.js loaded');

// Helper to handle interactive elements if loaded
document.addEventListener('DOMContentLoaded', () => {
  const menuItems = document.querySelectorAll('.menu li');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      menuItems.forEach(mi => mi.classList.remove('active'));
      item.classList.add('active');
      const targetText = item.textContent.trim().toLowerCase();
      console.log(`Navigating to ${targetText}`);
      // Simple routing if loaded on main page
      if (window.location.pathname.includes('dashboard') || window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        if (targetText === 'contacts') {
          window.location.href = 'contacts.html';
        } else if (targetText === 'leads') {
          window.location.href = 'leads.html';
        } else if (targetText === 'tasks') {
          window.location.href = 'tasks.html';
        } else if (targetText === 'dashboard') {
          window.location.href = 'dashboard.html';
        }
      }
    });
  });
});
