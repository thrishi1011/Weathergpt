/**
 * Alert Evaluator
 *
 * Determines whether a normalized alert should trigger a notification.
 *
 * Decision rules (official IMD warning is source of truth):
 * 1. Alert must be active
 * 2. Alert must have a valid district
 * 3. Alert must have a recognized severity
 *
 * The evaluator does NOT create or change alert information.
 * It only decides: should we notify?
 */

const { normalizeAlert } = require('./alertNormalizer');

/**
 * Evaluate whether a normalized alert warrants notification.
 *
 * @param {Object} alertInput - Raw or normalized alert object
 * @returns {{ should_notify: boolean, district: string, severity: string, event: string, reason: string }}
 */
function evaluateAlert(alertInput) {
  // Normalize first if raw input is provided
  const { valid, alert, errors } = normalizeAlert(alertInput);

  // Inactive alerts never trigger notification
  if (!alert.active) {
    return {
      should_notify: false,
      district: alert.district,
      severity: alert.severity,
      event: alert.event,
      reason: 'Alert is not active'
    };
  }

  // Active but missing critical fields
  if (!alert.district) {
    return {
      should_notify: false,
      district: '',
      severity: alert.severity,
      event: alert.event,
      reason: 'Active alert missing district information'
    };
  }

  if (!alert.severity) {
    return {
      should_notify: false,
      district: alert.district,
      severity: '',
      event: alert.event,
      reason: 'Active alert missing severity information'
    };
  }

  // All conditions met — notify
  return {
    should_notify: true,
    district: alert.district,
    severity: alert.severity,
    event: alert.event,
    reason: `Active ${alert.severity} alert for ${alert.district}`
  };
}

module.exports = { evaluateAlert };
