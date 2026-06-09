(function () {
  const LOGIN_URL = 'admin-login';
  const CHECK_INTERVAL_MS = 30000;
  let checking = false;

  function forceLogout() {
    localStorage.removeItem('admin_session');
    if (!location.pathname.includes('admin-login')) {
      location.replace(LOGIN_URL);
    }
  }

  async function validateAdminSession() {
    if (checking) return;
    const token = localStorage.getItem('admin_session');
    if (!token) {
      forceLogout();
      return;
    }

    checking = true;
    try {
      const response = await fetch('/api/admin/login', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (response.status === 401) forceLogout();
    } catch (error) {
      console.warn('Admin session check failed:', error);
    } finally {
      checking = false;
    }
  }

  validateAdminSession();
  setInterval(validateAdminSession, CHECK_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') validateAdminSession();
  });
  window.addEventListener('focus', validateAdminSession);
})();
