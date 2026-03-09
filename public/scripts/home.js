(() => {
  const API = '/api';
  const config = window.SiteHomeConfig || {};
  const syncMode = config.syncMainToken || 'none';
  let captchaToken = '';

  function toast(msg) {
    if (typeof window.showToast === 'function') window.showToast(msg);
  }

  function syncTokens() {
    try {
      const currentToken = localStorage.getItem('token');
      const psMainToken = localStorage.getItem('ps_main_token');

      if (syncMode === 'full' && currentToken && !currentToken.startsWith('eyJ')) {
        localStorage.setItem('ps_main_token', currentToken);
      }

      if (psMainToken && currentToken && currentToken.startsWith('eyJ')) {
        localStorage.setItem('token', psMainToken);
      }
    } catch (e) {}
  }

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

  function showLoggedIn(user) {
    const guestBtns = document.getElementById('guestBtns');
    const userBtns = document.getElementById('userBtns');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const adminLink = document.getElementById('adminLink');

    if (guestBtns) guestBtns.style.display = 'none';
    if (userBtns) userBtns.style.display = 'flex';
    if (userName) userName.textContent = user.nickname || user.username;
    if (userAvatar) userAvatar.src = user.avatar || '/default-avatar.png';
    if (adminLink) adminLink.style.display = user.role === 'superadmin' ? '' : 'none';
  }

  function showAuth(mode) {
    document.getElementById('authTitle').textContent = mode === 'login' ? '登录' : '注册';
    document.getElementById('authSubmitBtn').textContent = mode === 'login' ? '登录' : '注册';
    document.getElementById('authSubmitBtn').onclick = mode === 'login' ? doLogin : doRegister;
    document.getElementById('inviteRow').style.display = mode === 'login' ? 'none' : 'block';
    document.getElementById('nicknameRow').style.display = mode === 'login' ? 'none' : 'block';
    document.getElementById('captchaRow').style.display = mode === 'register' ? 'flex' : 'none';
    if (mode === 'register') refreshCaptcha();
    document.getElementById('authSwitch').innerHTML = mode === 'login'
      ? '没有账号？<a href="javascript:void(0)" onclick="showAuth(\'register\')">去注册</a>'
      : '已有账号？<a href="javascript:void(0)" onclick="showAuth(\'login\')">去登录</a>';
    document.getElementById('authModal').classList.add('show');
    document.getElementById('authUsername').value = '';
    document.getElementById('authPassword').value = '';
    if (document.getElementById('authNickname')) document.getElementById('authNickname').value = '';
    document.getElementById('authUsername').focus();
  }

  function closeAuth() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('show');
  }

  async function doLogin() {
    const username = document.getElementById('authUsername').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    if (!username || !password) {
      toast('请填写完整');
      return;
    }
    try {
      const res = await fetch(API + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('token', data.token);
      if (syncMode === 'full') localStorage.setItem('ps_main_token', data.token);
      closeAuth();
      showLoggedIn(data);
      toast('欢迎回来，' + (data.nickname || data.username));
    } catch (err) {
      toast(err.message);
    }
  }

  async function refreshCaptcha() {
    try {
      const res = await fetch(API + '/captcha');
      const data = await res.json();
      document.getElementById('captchaQuestion').textContent = data.question;
      document.getElementById('captchaInput').value = '';
      captchaToken = data.token;
    } catch {
      toast('获取验证码失败');
    }
  }

  async function doRegister() {
    const username = document.getElementById('authUsername').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const nickname = document.getElementById('authNickname').value.trim();
    const captchaAnswer = document.getElementById('captchaInput').value.trim();
    const inviteCode = document.getElementById('authInviteCode').value.trim();

    if (!username || !password) return toast('请填写完整');
    if (!inviteCode) return toast('请填写邀请码');
    if (!captchaAnswer) return toast('请输入验证码答案');

    try {
      const res = await fetch(API + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, nickname, captchaToken, captchaAnswer, inviteCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('token', data.token);
      if (syncMode === 'full') localStorage.setItem('ps_main_token', data.token);
      closeAuth();
      showLoggedIn(data);
      toast('注册成功，欢迎 ' + (data.nickname || data.username));
    } catch (err) {
      toast(err.message);
      refreshCaptcha();
    }
  }

  function doLogout() {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(API + '/logout', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token }
      }).catch(() => {});
    }
    localStorage.removeItem('token');
    if (syncMode === 'full') localStorage.removeItem('ps_main_token');
    document.getElementById('guestBtns').style.display = '';
    document.getElementById('userBtns').style.display = 'none';
    toast('已退出登录');
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAuth();
  });

  window.showLoggedIn = showLoggedIn;
  window.showAuth = showAuth;
  window.closeAuth = closeAuth;
  window.doLogin = doLogin;
  window.refreshCaptcha = refreshCaptcha;
  window.doRegister = doRegister;
  window.doLogout = doLogout;

  syncTokens();
  initFadeIn();
  initLoginState();
})();
