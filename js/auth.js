/**
 * KRONOS NUTRITION - ADMIN AUTHENTICATION CONTROLLER (VANILLA JS)
 * Handles admin login validation, session state, route guards,
 * and security alerts.
 */

const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'younestlg2023@gmail.com',
  password: 'younestlg2023'
};

// Check if current user has an active admin session
function isAdminAuthenticated() {
  try {
    const session = localStorage.getItem('kronos_admin_auth_session_v1');
    if (!session) return false;
    const data = JSON.parse(session);
    return data && data.isAuthenticated === true;
  } catch (e) {
    return false;
  }
}

// Log in as Admin
function loginAdmin(email, password) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();
  const validEmails = [
    DEFAULT_ADMIN_CREDENTIALS.email.toLowerCase(),
    'younes',
    'admin',
    'admin@kronos.dz'
  ];

  if (validEmails.includes(cleanEmail) && cleanPass === DEFAULT_ADMIN_CREDENTIALS.password) {
    const sessionData = {
      isAuthenticated: true,
      email: DEFAULT_ADMIN_CREDENTIALS.email,
      name: 'Younes (Directeur Général)',
      role: 'Super Admin',
      loggedInAt: new Date().toISOString()
    };
    localStorage.setItem('kronos_admin_auth_session_v1', JSON.stringify(sessionData));
    return { success: true };
  } else {
    return { success: false, message: 'Identifiants invalides. Vérifiez votre email et mot de passe.' };
  }
}

// Log out Admin
function logoutAdmin() {
  localStorage.removeItem('kronos_admin_auth_session_v1');
  window.location.href = 'admin-login.html';
}

// Route Guard logic executed on page load
document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = window.location.pathname.includes('admin-login.html');
  const isAdminDashboard = window.location.pathname.includes('admin.html');

  // Guard: Protect admin dashboard
  if (isAdminDashboard) {
    if (!isAdminAuthenticated()) {
      window.location.href = 'admin-login.html?unauthorized=1';
      return;
    }
  }

  // Guard: Auto-redirect if already logged in on login page
  if (isLoginPage) {
    if (isAdminAuthenticated()) {
      window.location.href = 'admin.html';
      return;
    }

    // Bind Login Form
    const loginForm = document.getElementById('admin-login-form');
    const alertBox = document.getElementById('login-error-alert');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-password');

        const result = loginAdmin(emailInput.value, passInput.value);
        if (result.success) {
          window.location.href = 'admin.html';
        } else {
          if (alertBox) {
            alertBox.textContent = result.message;
            alertBox.style.display = 'block';
          }
        }
      });
    }
  }
});
