(() => {
  function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.querySelector('.hamburger');
    const overlay = document.getElementById('menuOverlay');
    if (!navLinks || !hamburger || !overlay) return;
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('active');
    overlay.classList.toggle('show');
  }

  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  document.querySelectorAll('.nav-links a').forEach((a) => {
    a.addEventListener('click', () => {
      const navLinks = document.getElementById('navLinks');
      if (navLinks && navLinks.classList.contains('open')) toggleMenu();
    });
  });

  window.toggleMenu = toggleMenu;
  window.showToast = showToast;
})();
