/**
 * ErrorToast Component
 * Floating non-intrusive toast alerts for network issues, warnings, and notifications
 */

export function createToastManager() {
  let container = document.getElementById('toast-container-host');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container-host';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  function showToast({ title = 'Notification', message, type = 'error', duration = 4500 }) {
    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;

    const iconMap = {
      error: '⚠️',
      warning: '⚡',
      success: '✅'
    };

    toast.innerHTML = `
      <div class="toast-icon">${iconMap[type] || 'ℹ️'}</div>
      <div class="toast-content">
        <strong class="toast-title">${escapeHtml(title)}</strong>
        <p class="toast-desc">${escapeHtml(message)}</p>
      </div>
      <button type="button" class="toast-close-btn" aria-label="Dismiss toast">×</button>
    `;

    const closeBtn = toast.querySelector('.toast-close-btn');
    const removeToast = () => {
      if (toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 200);
      }
    };

    closeBtn.addEventListener('click', removeToast);

    if (duration > 0) {
      setTimeout(removeToast, duration);
    }

    container.appendChild(toast);
  }

  return {
    showError: (message, title = 'Connection Issue') => showToast({ title, message, type: 'error' }),
    showWarning: (message, title = 'Advisory') => showToast({ title, message, type: 'warning' }),
    showSuccess: (message, title = 'Success') => showToast({ title, message, type: 'success' })
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
