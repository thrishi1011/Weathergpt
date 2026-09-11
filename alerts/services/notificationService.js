/**
 * Notification Service
 *
 * Orchestrates the full alert → notification pipeline:
 *   1. Normalize the alert
 *   2. Evaluate if notification is warranted
 *   3. Match against user's district
 *   4. Check for duplicates
 *   5. Send via the configured notification provider
 *
 * The service is decoupled from any specific notification provider.
 * Providers implement: send({ district, severity, title, message })
 */

const { normalizeAlert } = require('./alertNormalizer');
const { evaluateAlert } = require('./alertEvaluator');
const { matchesDistrict } = require('./districtMatcher');
const { DuplicateTracker } = require('./duplicateTracker');

class NotificationService {
  /**
   * @param {Object} provider - Notification provider with a send() method
   */
  constructor(provider) {
    if (!provider || typeof provider.send !== 'function') {
      throw new Error('NotificationService requires a provider with a send() method');
    }
    this.provider = provider;
    this.tracker = new DuplicateTracker();
  }

  /**
   * Process an incoming alert for a specific user district.
   *
   * @param {Object} rawAlert    - Raw or structured IMD alert data
   * @param {string} userDistrict - The user's district for location matching
   * @returns {{ notified: boolean, reason: string, alert: Object }}
   */
  async processAlert(rawAlert, userDistrict) {
    // Step 1: Normalize
    const { valid, alert, errors } = normalizeAlert(rawAlert);

    // Step 2: Evaluate
    const evaluation = evaluateAlert(rawAlert);

    if (!evaluation.should_notify) {
      return {
        notified: false,
        reason: evaluation.reason,
        alert
      };
    }

    // Step 3: District matching
    if (!matchesDistrict(alert.district, userDistrict)) {
      return {
        notified: false,
        reason: `Alert is for ${alert.district}, user is in ${userDistrict}`,
        alert
      };
    }

    // Step 4: Duplicate check
    if (this.tracker.isDuplicate(alert)) {
      return {
        notified: false,
        reason: 'Duplicate alert — notification already sent',
        alert
      };
    }

    // Step 5: Send notification
    const title = alert.event
      ? `${alert.event} Warning`
      : `${alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)} Weather Warning`;

    const message = alert.message
      || `A ${alert.severity} IMD warning is active for ${alert.district}.`;

    await this.provider.send({
      district: alert.district,
      severity: alert.severity,
      title,
      message
    });

    // Mark as notified
    this.tracker.markSeen(alert);

    return {
      notified: true,
      reason: `Notification sent: ${alert.severity} alert for ${alert.district}`,
      alert
    };
  }

  /**
   * Reset duplicate tracking (useful for testing or scheduled resets).
   */
  resetTracker() {
    this.tracker.reset();
  }
}

module.exports = { NotificationService };
