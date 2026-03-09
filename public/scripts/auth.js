(() => {
  const API = '/api';
  const config = window.SiteHomeConfig || {};
  const state = {
    syncMainToken: config.syncMainToken || 'none',
    mode: 'login',
    captchaToken: ''
  };

  function toast(msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
  }

  function getEls() {
    return {
      modal: document.getElementById('authModal'),
      title: document.getElementById('authTitle'),
      submitBtn: document.getElementById('authSubmitBtn'),
      username: document.getElementById('authUsername'),
      password: document.getElementById('authPassword'),
      nickname: document.getElementById('authNickname'),
      inviteRow: document.getElementById('inviteRow'),
      nicknameRow: document.getElementById('nicknameRow'),
      inviteCode: document.getElementById('authInviteCode'),
      captchaRow: document.getElementById('captchaRow'),
      captchaQuestion: document.getElementById('captchaQuestion'),
      captchaInput: document.getElementById('captchaInput'),
      authSwitch: document.getElementById('authSwitch'),
      guestBtns: document.getElementById('guestBtns'),
      userBtns: document.getElementById('userBtns'),
      userName: document.getElementById('userName'),
      userAvatar: document.getElementById('userAvatar'),
      adminLink: document.getElementById('adminLink')
    };
  }

  function syncTokens() {
    try {
      const currentToken = localStorage.getItem('token');
      const psMainToken = localStorage.getItem('ps_main_token');
      if (state.syncMainToken === 'full' && currentToken && !currentToken.startsWith('eyJ')) {
        localStorage.setItem('ps_main_token', currentToken);
      }
      if (psMainToken && currentToken && currentToken.startsWith('eyJ')) {
        localStorage.setItem('token', psMainToken);
      }
    } catch (e) {}
  }

  function showLoggedIn(user) {
    const els = getEls();
    if (els.guestBtns) els.guestBtns.style.display = 'none';
    if (els.userBtns) els.userBtns.style.display = 'flex';
    if (els.userName) els.userName.textContent = user.nickname || user.username;
    if (els.userAvatar) els.userAvatar.src = user.avatar || '/default-avatar.png';
    if (els.adminLink) els.adminLink.style.display = user.role === 'superadmin' ? '' : 'none';
  }

  function resetForm() {
    const els = getEls();
    if (els.username) els.username.value = '';
    if (els.password) els.password.value = '';
    if (els.nickname) els.nickname.value = '';
    if (els.inviteCode) els.inviteCode.value = '';
    if (els.captchaInput) els.captchaInput.value = '';
  }

  function renderMode(mode) {
    state.mode = mode;
    const els = getEls();
    if (!els.submitBtn) return;
    els.title.textContent = mode === 'login' ? '登录' : '注册';
    els.submitBtn.textContent = mode === 'login' ? '登录' : '注册';
    els.submitBtn.dataset.mode = mode;
    els.inviteRow.style.display = mode === 'login' ? 'none' : 'block';
    els.nicknameRow.style.display = mode === 'login' ? 'none' : 'block';
    els.captchaRow.style.display = mode === 'register' ? 'flex' : 'none';
    els.authSwitch.innerHTML = mode === 'login'
      ? '没有账号？<a href="javascript:void(0)" data-auth-open="register">去注册</a>'
      : '已有账号？<a href="javascript:void(0)" data-auth-open="login">去登录</a>';
  }

  function showAuth(mode) {
    const els = getEls();
    renderMode(mode);
    resetForm();
    if (mode === 'register') refreshCaptcha();
    if (els.modal) els.modal.classList.add('show');
    if (els.username) els.username.focus();
  }

  function closeAuth() {
    const els = getEls();
    if (els.modal) els.modal.classList.remove('show');
  }

  async function doLogin() {
    const els = getEls();
    const username = els.username.value.trim();
    const password = els.password.value.trim();
    if (!username || !password) return toast('请填写完整');
    try {
      const res = await fetch(API + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('token', data.token);
      if (state.syncMainToken === 'full') localStorage.setItem('ps_main_token', data.token);
      closeAuth();
      showLoggedIn(data);
      toast('欢迎回来，' + (data.nickname || data.username));
    } catch (err) {
      toast(err.message);
    }
  }

  async function refreshCaptcha() {
    const els = getEls();
    try {
      const res = await fetch(API + '/captcha');
      const data = await res.json();
      if (els.captchaQuestion) els.captchaQuestion.textContent = data.question;
      if (els.captchaInput) els.captchaInput.value = '';
      state.captchaToken = data.token;
    } catch {
      toast('获取验证码失败');
    }
  }

  async function doRegister() {
    const els = getEls();
    const username = els.username.value.trim();
    const password = els.password.value.trim();
    const nickname = els.nickname.value.trim();
    const captchaAnswer = els.captchaInput.value.trim();
    const inviteCode = els.inviteCode.value.trim();
    if (!username || !password) return toast('请填写完整');
    if (!inviteCode) return toast('请填写邀请码');
    if (!captchaAnswer) return toast('请输入验证码答案');
    try {
      const res = await fetch(API + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, nickname, captchaToken: state.captchaToken, captchaAnswer, inviteCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('token', data.token);
      if (state.syncMainToken === 'full') localStorage.setItem('ps_main_token', data.token);
      closeAuth();
      showLoggedIn(data);
      toast('注册成功，欢迎 ' + (data.nickname || data.username));
    } catch (err) {
      toast(err.message);
      refreshCaptcha();
    }
  }

  function doLogout() {
    const els = getEls();
    const token = localStorage.getItem('token');
    if (token) {
      fetch(API + '/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + token } }).catch(() => {});
    }
    localStorage.removeItem('token');
    if (state.syncMainToken === 'full') localStorage.removeItem('ps_main_token');
    if (els.guestBtns) els.guestBtns.style.display = '';
    if (els.userBtns) els.userBtns.style.display = 'none';
    toast('已退出登录');
  }

  async function initLoginState() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(API + '/me', { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) {
        localStorage.removeItem('token');
        return;
      }
      const user = await res.json();
      showLoggedIn(user);
    } catch {
      localStorage.removeItem('token');
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAuth();
  });

  document.addEventListener('click', (event) => {
    const modal = event.target.closest('#authModal');
    if (event.target.id === 'authModal' && modal) {
      closeAuth();
      return;
    }
    const openBtn = event.target.closest('[data-auth-open]');
    if (openBtn) {
      event.preventDefault();
      showAuth(openBtn.dataset.authOpen);
      return;
    }
    const closeBtn = event.target.closest('[data-auth-close]');
    if (closeBtn) {
      event.preventDefault();
      closeAuth();
      return;
    }
    const refreshBtn = event.target.closest('[data-captcha-refresh]');
    if (refreshBtn) {
      event.preventDefault();
      refreshCaptcha();
      return;
    }
    const submitBtn = event.target.closest('#authSubmitBtn');
    if (submitBtn) {
      event.preventDefault();
      const mode = submitBtn.dataset.mode || state.mode;
      if (mode === 'register') doRegister();
      else doLogin();
    }
  });

  window.showLoggedIn = showLoggedIn;
  window.showAuth = showAuth;
  window.closeAuth = closeAuth;
  window.doLogin = doLogin;
  window.refreshCaptcha = refreshCaptcha;
  window.doRegister = doRegister;
  window.doLogout = doLogout;
  window.SiteAuth = { syncTokens, initLoginState, showLoggedIn };
})();
