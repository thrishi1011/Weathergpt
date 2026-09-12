/**
 * Duplicate Tracker
 *
 * Prevents the same alert from triggering repeated notifications.
 * Uses an in-memory store keyed by a composite of district + event + severity.
 *
 * Design note: This is an in-memory implementation suitable for development
 * and single-process deployment. It can be replaced with a persistent store
 * (e.g. Redis, SQLite) later without changing the public interface.
 */

class DuplicateTracker {
  constructor() {
    // Map<string, { timestamp: number, alert: Object }>
    this._seen = new Map();
  }

  /**
   * Generate a deduplication key from alert fields.
   * Same district + event + severity = same alert identity.
   */
  _buildKey(alert) {
    const parts = [
      (alert.district || '').trim().toLowerCase(),
      (alert.event || '').trim().toLowerCase(),
      (alert.severity || '').trim().toLowerCase()
    ];
    return parts.join('|');
  }

  /**
   * Check if this alert has already been seen (and thus notified).
   *
   * @param {Object} alert - Normalized alert object
   * @returns {boolean} true if this is a duplicate
   */
  isDuplicate(alert) {
    const key = this._buildKey(alert);
    return this._seen.has(key);
  }

  /**
   * Mark an alert as seen/notified.
   *
   * @param {Object} alert - Normalized alert object
   */
  markSeen(alert) {
    const key = this._buildKey(alert);
    this._seen.set(key, {
      timestamp: Date.now(),
      alert: { ...alert }
    });
  }

  /**
   * Clear a specific alert (e.g., when it becomes inactive and
   * should be re-notifiable if it reactivates).
   *
   * @param {Object} alert - Normalized alert object
   */
  clear(alert) {
    const key = this._buildKey(alert);
    this._seen.delete(key);
  }

  /**
   * Reset all tracked alerts.
   */
  reset() {
    this._seen.clear();
  }

  /**
   * Get count of currently tracked alerts.
   */
  get size() {
    return this._seen.size;
  }
}

module.exports = { DuplicateTracker };
