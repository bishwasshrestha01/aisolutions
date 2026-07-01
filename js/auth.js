/**
 * AI Solutions - Authentication Module
 * Handles admin authentication via server-side sessions
 */

(function() {
  'use strict';

  var SESSION_CHECKED = false;
  var SESSION_VALID = false;
  var SESSION_USER = null;

  // Check session with server
  window.checkAdminSession = function(callback) {
    fetch('/api/auth/me/')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      SESSION_CHECKED = true;
      SESSION_VALID = !!data.success;
      SESSION_USER = data.success ? data : null;
      if (callback) callback(SESSION_VALID, SESSION_USER);
    })
    .catch(function() {
      SESSION_CHECKED = true;
      SESSION_VALID = false;
      SESSION_USER = null;
      if (callback) callback(false, null);
    });
  };

  // Check if user is logged in (synchronous — uses cached result)
  window.isAdminLoggedIn = function() {
    return SESSION_VALID;
  };

  // Get current admin user
  window.getAdminUser = function() {
    return SESSION_USER;
  };

  // Redirect to login if not authenticated
  window.requireAdminLogin = function() {
    if (!SESSION_VALID) {
      window.location.href = 'admin/index.html';
    }
  };

  // Logout function
  window.adminLogout = function() {
    fetch('/api/auth/logout/', { method: 'POST' })
    .then(function() {
      SESSION_VALID = false;
      SESSION_USER = null;
      window.location.href = 'admin/index.html';
    })
    .catch(function() {
      window.location.href = 'admin/index.html';
    });
  };

  // Auto-check session on script load
  window.checkAdminSession();
})();
