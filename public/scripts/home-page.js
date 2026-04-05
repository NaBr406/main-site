(() => {
  function initFadeIn() {
    if (typeof IntersectionObserver !== 'function') return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 100);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
  }

  function rehydrateLoginState() {
    if (!window.SiteAuth) return;
    window.SiteAuth.syncTokens();
    window.SiteAuth.initLoginState();
  }

  async function openAiWithSiteSso(targetHref) {
    const href = targetHref || '/ai/';
    const mainToken = localStorage.getItem('ps_main_token') || ((localStorage.getItem('token') && !localStorage.getItem('token').startsWith('eyJ')) ? localStorage.getItem('token') : '');
    if (!mainToken) {
      window.location.href = href;
      return;
    }
    try {
      const res = await fetch('/ai/api/v1/auths/signin/personal-space-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: mainToken })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.token) {
          localStorage.setItem('ps_main_token', mainToken);
          localStorage.setItem('owui_token', data.token);
          localStorage.setItem('token', data.token);
        }
      }
    } catch (e) {}
    window.location.href = href;
  }

  rehydrateLoginState();
  initFadeIn();

  window.addEventListener('pageshow', () => {
    rehydrateLoginState();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      rehydrateLoginState();
    }
  });

  document.addEventListener('click', (event) => {
    const link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href === '/ai/' || href === '/ai') {
      event.preventDefault();
      openAiWithSiteSso(link.href || href);
    }
  }, true);
})();
