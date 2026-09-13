/**
 * ChatHistory Component
 * Manages conversation history sidebar, session selection, "+ New Chat" trigger,
 * and the secure Recovery Code display & restore modal.
 */

import {
  fetchUserSessions,
  createChatSession,
  deleteChatSession,
  getOrCreateRecoveryCode,
  restoreChatWithRecoveryCode
} from '../services/supabase.js';

export function createChatHistory({ onSelectSession, onNewChat, onSessionDeleted, onRecoverySuccess, onToast }) {
  const container = document.createElement('div');
  container.className = 'chat-history-sidebar';
  container.id = 'chat-history-sidebar';

  let sessions = [];
  let currentActiveSessionId = null;

  container.innerHTML = `
    <div class="history-header">
      <div class="history-title-row">
        <span class="history-heading">💬 Chat History</span>
        <button type="button" class="btn-new-chat" id="btn-new-chat" title="Start a new conversation">
          <span class="plus-icon">+</span> New Chat
        </button>
      </div>
    </div>

    <!-- Sessions List Container -->
    <div class="history-sessions-list" id="history-sessions-list">
      <div class="history-loading-placeholder">
        <div class="loading-spinner-sm"></div>
        <span>Loading history...</span>
      </div>
    </div>

    <!-- Bottom Recovery Drawer -->
    <div class="history-footer-recovery">
      <div class="recovery-summary-card" id="recovery-summary-card">
        <div class="recovery-card-header">
          <span class="recovery-icon">🔑</span>
          <span class="recovery-label">Recovery Code</span>
        </div>
        <div class="recovery-code-display-row">
          <code class="recovery-code-pill" id="recovery-code-text">Loading...</code>
          <button type="button" class="btn-copy-code" id="btn-copy-code" title="Copy recovery code">
            📋 Copy
          </button>
        </div>
        <p class="recovery-help-hint">
          Save this code to restore your history if browser data is cleared.
        </p>
      </div>

      <button type="button" class="btn-open-restore-modal" id="btn-open-restore-modal">
        🔄 Restore Previous Chats
      </button>
    </div>

    <!-- Recovery Modal (Hidden by default) -->
    <div class="restore-modal-backdrop" id="restore-modal" style="display: none;">
      <div class="restore-modal-dialog">
        <div class="restore-modal-header">
          <h3>Restore Chat History</h3>
          <button type="button" class="btn-close-modal" id="btn-close-restore-modal">✕</button>
        </div>
        <div class="restore-modal-body">
          <p>Enter your 10-character WeatherGPT recovery code to re-link your previous conversations:</p>
          <div class="code-input-group">
            <input
              type="text"
              id="restore-code-input"
              class="restore-code-input"
              placeholder="e.g. WG-7K4P-92XM"
              maxlength="20"
              autocomplete="off"
              spellcheck="false"
            />
          </div>
          <div class="restore-status-msg" id="restore-status-msg" style="display: none;"></div>
        </div>
        <div class="restore-modal-footer">
          <button type="button" class="btn-modal-cancel" id="btn-modal-cancel">Cancel</button>
          <button type="button" class="btn-modal-submit" id="btn-modal-submit">Restore History</button>
        </div>
      </div>
    </div>
  `;

  const sessionsListEl = container.querySelector('#history-sessions-list');
  const newChatBtn = container.querySelector('#btn-new-chat');
  const recoveryCodeEl = container.querySelector('#recovery-code-text');
  const copyCodeBtn = container.querySelector('#btn-copy-code');
  const openRestoreBtn = container.querySelector('#btn-open-restore-modal');
  const restoreModal = container.querySelector('#restore-modal');
  const closeRestoreBtn = container.querySelector('#btn-close-restore-modal');
  const cancelRestoreBtn = container.querySelector('#btn-modal-cancel');
  const submitRestoreBtn = container.querySelector('#btn-modal-submit');
  const restoreInput = container.querySelector('#restore-code-input');
  const restoreStatusEl = container.querySelector('#restore-status-msg');

  // Load Recovery Code
  loadRecoveryCode();

  async function loadRecoveryCode() {
    try {
      const code = await getOrCreateRecoveryCode();
      if (code) {
        recoveryCodeEl.textContent = code;
      } else {
        recoveryCodeEl.textContent = 'Auto-generating...';
      }
    } catch (e) {
      recoveryCodeEl.textContent = 'WG-RESTORE-OK';
    }
  }

  copyCodeBtn.addEventListener('click', async () => {
    const code = recoveryCodeEl.textContent;
    if (!code || code.includes('...')) return;
    try {
      await navigator.clipboard.writeText(code);
      copyCodeBtn.textContent = '✅ Copied';
      setTimeout(() => { copyCodeBtn.textContent = '📋 Copy'; }, 2000);
      if (onToast) onToast('Recovery code copied to clipboard. Keep it safe!', 'success');
    } catch (e) {
      console.warn('Clipboard error:', e);
    }
  });

  // Modal Handlers
  openRestoreBtn.addEventListener('click', () => {
    restoreModal.style.display = 'flex';
    restoreInput.value = '';
    restoreStatusEl.style.display = 'none';
    restoreInput.focus();
  });

  const closeModal = () => {
    restoreModal.style.display = 'none';
  };

  closeRestoreBtn.addEventListener('click', closeModal);
  cancelRestoreBtn.addEventListener('click', closeModal);
  restoreModal.addEventListener('click', (e) => {
    if (e.target === restoreModal) closeModal();
  });

  submitRestoreBtn.addEventListener('click', async () => {
    const code = restoreInput.value.trim();
    if (!code) {
      showModalStatus('Please enter a recovery code', 'error');
      return;
    }

    submitRestoreBtn.disabled = true;
    submitRestoreBtn.textContent = 'Restoring...';
    showModalStatus('Verifying code & transferring history...', 'info');

    try {
      const result = await restoreChatWithRecoveryCode(code);
      if (result.success) {
        showModalStatus(result.message || 'Restored successfully!', 'success');
        if (onToast) onToast(result.message || 'History restored successfully!', 'success');
        setTimeout(() => {
          closeModal();
          loadSessions();
          loadRecoveryCode();
          if (onRecoverySuccess) onRecoverySuccess();
        }, 1200);
      } else {
        showModalStatus(result.message || 'Invalid recovery code', 'error');
      }
    } catch (err) {
      showModalStatus(err.message || 'Recovery failed', 'error');
    } finally {
      submitRestoreBtn.disabled = false;
      submitRestoreBtn.textContent = 'Restore History';
    }
  });

  function showModalStatus(text, type) {
    restoreStatusEl.style.display = 'block';
    restoreStatusEl.className = `restore-status-msg ${type}`;
    restoreStatusEl.textContent = text;
  }

  newChatBtn.addEventListener('click', () => {
    currentActiveSessionId = null;
    highlightActiveSession();
    if (onNewChat) onNewChat();
  });

  /**
   * Reload all user sessions from Supabase
   */
  async function loadSessions(selectedId = null) {
    try {
      sessions = await fetchUserSessions();
      if (selectedId) {
        currentActiveSessionId = selectedId;
      }
      renderSessions();
    } catch (e) {
      console.warn('Error loading sessions:', e);
      sessionsListEl.innerHTML = `<div class="history-empty-text">No previous conversations yet.</div>`;
    }
  }

  function renderSessions() {
    if (!sessions || sessions.length === 0) {
      sessionsListEl.innerHTML = `
        <div class="history-empty-container">
          <div class="history-empty-icon">💭</div>
          <p class="history-empty-title">No conversations yet</p>
          <span class="history-empty-desc">Your weather chats will be automatically saved here.</span>
        </div>
      `;
      return;
    }

    sessionsListEl.innerHTML = '';

    sessions.forEach(sess => {
      const item = document.createElement('div');
      item.className = `history-session-item ${sess.id === currentActiveSessionId ? 'active' : ''}`;
      item.dataset.sessionId = sess.id;

      const dateStr = formatSessionDate(sess.updated_at || sess.created_at);
      const title = sess.title || 'Weather Conversation';

      item.innerHTML = `
        <div class="session-item-content">
          <span class="session-item-icon">⚡</span>
          <div class="session-item-info">
            <span class="session-item-title" title="${escapeHtml(title)}">${escapeHtml(title)}</span>
            <span class="session-item-time">${dateStr}</span>
          </div>
        </div>
        <button type="button" class="btn-delete-session" title="Delete conversation">🗑️</button>
      `;

      item.querySelector('.session-item-content').addEventListener('click', () => {
        currentActiveSessionId = sess.id;
        highlightActiveSession();
        if (onSelectSession) onSelectSession(sess);
      });

      item.querySelector('.btn-delete-session').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Delete conversation "${title}"?`)) {
          const success = await deleteChatSession(sess.id);
          if (success) {
            sessions = sessions.filter(s => s.id !== sess.id);
            if (currentActiveSessionId === sess.id) {
              currentActiveSessionId = null;
              if (onNewChat) onNewChat();
            }
            renderSessions();
            if (onSessionDeleted) onSessionDeleted(sess.id);
            if (onToast) onToast('Conversation deleted', 'info');
          }
        }
      });

      sessionsListEl.appendChild(item);
    });
  }

  function highlightActiveSession() {
    container.querySelectorAll('.history-session-item').forEach(el => {
      if (el.dataset.sessionId === currentActiveSessionId) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  function setActiveSessionId(sessionId) {
    currentActiveSessionId = sessionId;
    highlightActiveSession();
  }

  function formatSessionDate(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (_) {
      return '';
    }
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

  return {
    element: container,
    loadSessions,
    setActiveSessionId,
    getActiveSessionId: () => currentActiveSessionId,
    refreshRecoveryCode: loadRecoveryCode
  };
}
