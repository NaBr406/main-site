(() => {
  const API = '/api';

  function formatTime(str) {
    if (!str) return '';
    const d = new Date(str.replace(' ', 'T'));
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
    if (diff < 604800) return Math.floor(diff / 86400) + '天前';
    return d.toLocaleDateString('zh-CN');
  }

  function esc(text) {
    const d = document.createElement('div');
    d.textContent = text || '';
    return d.innerHTML;
  }

  async function init() {
    const token = localStorage.getItem('token');
    if (!token) {
      document.getElementById('content').innerHTML = '<div class="no-access">请先<a href="/">登录</a>后访问</div>';
      return;
    }
    try {
      const res = await fetch(API + '/me', { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) throw new Error('未登录');
      const user = await res.json();
      if (user.role !== 'superadmin') {
        document.getElementById('content').innerHTML = '<div class="no-access">仅超级管理员可访问</div>';
        return;
      }
      renderAdmin(token);
    } catch {
      document.getElementById('content').innerHTML = '<div class="no-access">请先<a href="/">登录</a>后访问</div>';
    }
  }

  async function renderAdmin(token) {
    const container = document.getElementById('content');
    container.innerHTML = `
      <div class="page-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        管理面板
      </div>
      <div class="card">
        <h4>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
          最近访客
        </h4>
        <div class="visitor-list" id="visitorList"><div class="loading">加载中...</div></div>
      </div>
    `;

    try {
      const res = await fetch(API + '/visitors?limit=50', { headers: { Authorization: 'Bearer ' + token } });
      const visitors = await res.json();
      const list = document.getElementById('visitorList');
      if (!visitors.length) {
        list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text2)">暂无访客记录</div>';
        return;
      }
      list.innerHTML = visitors.map((v) => {
        const time = formatTime(v.visited_at);
        if (v.user_id && v.nickname) {
          const avatar = v.avatar || '/default-avatar.png';
          return `<div class="visitor-item">
            <img src="${esc(avatar)}" class="visitor-avatar">
            <div class="visitor-info"><span class="visitor-name">${esc(v.nickname)}</span><span class="visitor-time">${time}</span></div>
          </div>`;
        }
        return `<div class="visitor-item">
          <div class="visitor-ip-icon">👤</div>
          <div class="visitor-info"><span class="visitor-name visitor-ip">${esc(v.ip || '未知')}</span><span class="visitor-time">${time}</span></div>
        </div>`;
      }).join('');
    } catch {
      document.getElementById('visitorList').innerHTML = '<div style="color:#ef4444;padding:20px;text-align:center">加载失败</div>';
    }
  }

  init();
})();
