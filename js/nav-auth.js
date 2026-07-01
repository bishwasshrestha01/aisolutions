/* AI Solutions — Navbar Login / Profile / Logout */

(function () {
  'use strict';

  // Check if auth system is available
  if (!window.aiSolutionsAuth && !sessionStorage.getItem('aiSolutionsAuth')) {
    // Auth system not initialized, exit gracefully
    return;
  }

  const auth = window.aiSolutionsAuth;
  const slot = document.getElementById('navAuthSlot');
  if (!slot) return;
  
  // If auth not available, render login link
  if (!auth) {
    if (slot) {
      slot.innerHTML = '<a href="login.html" class="btn btn-outline-primary d-flex align-items-center gap-1"><i class="bi bi-person-circle"></i> Login</a>';
    }
    return;
  }

  let avatarObjectUrl = null;

  function renderLogin() {
    if (avatarObjectUrl) {
      URL.revokeObjectURL(avatarObjectUrl);
      avatarObjectUrl = null;
    }
    slot.innerHTML =
      '<a href="login.html" class="btn btn-outline-primary d-flex align-items-center gap-1">' +
      '<i class="bi bi-person-circle"></i> Login</a>';
  }

  function profileLinkHtml(inner) {
    return (
      '<a href="profile.html" class="btn btn-outline-primary d-flex align-items-center gap-1 nav-profile-btn" title="My profile">' +
      inner +
      '<span class="d-none d-sm-inline">Profile</span></a>'
    );
  }

  function loggedInHtml(profileInner) {
    return (
      '<div class="d-flex align-items-center gap-2 flex-wrap">' +
      profileInner +
      '<button type="button" class="btn btn-outline-danger btn-sm" id="navLogoutBtn">Logout</button>' +
      '</div>'
    );
  }

  function bindLogout() {
    const btn = document.getElementById('navLogoutBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      auth.clearSession();
      window.dispatchEvent(new Event('aiSolutionsAuthChange'));
      window.location.href = 'index.html';
    });
  }

  function renderProfileIconOnly() {
    slot.innerHTML = loggedInHtml(
      profileLinkHtml('<i class="bi bi-person-circle"></i>')
    );
    bindLogout();
  }

  function renderProfile(user, token) {
    const hasAvatar = !!(user && user.avatarUrl && token);
    const imgId = 'navProfileAvatar';

    if (!hasAvatar) {
      renderProfileIconOnly();
      return;
    }

    slot.innerHTML = loggedInHtml(
      profileLinkHtml(
        '<img src="" alt="" class="nav-profile-avatar" id="' +
          imgId +
          '" width="28" height="28" />'
      )
    );
    bindLogout();

    fetch('/api/auth/avatar', { headers: { Authorization: 'Bearer ' + token } })
      .then(function (res) {
        if (!res.ok) throw new Error('no avatar');
        return res.blob();
      })
      .then(function (blob) {
        if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
        avatarObjectUrl = URL.createObjectURL(blob);
        const img = document.getElementById(imgId);
        if (img) img.src = avatarObjectUrl;
      })
      .catch(function () {
        renderProfileIconOnly();
      });
  }

  function refresh() {
    const session = auth.getSession();
    if (!session || !session.token) {
      renderLogin();
      return;
    }

    if (session.user) {
      renderProfile(session.user, session.token);
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: 'Bearer ' + session.token },
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error);
          return data;
        });
      })
      .then(function (data) {
        session.user = data.user;
        auth.saveSession(session);
        renderProfile(data.user, session.token);
      })
      .catch(function () {
        auth.clearSession();
        renderLogin();
      });
  }

  refresh();
  window.addEventListener('aiSolutionsAuthChange', refresh);
  window.addEventListener('storage', function (e) {
    if (e.key === 'aiSolutionsAuth') refresh();
  });
})();
