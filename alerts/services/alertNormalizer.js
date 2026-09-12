/**
 * Alert Normalizer
 *
 * Safely normalizes incoming IMD warning data into a consistent internal shape.
 * Handles missing fields, unexpected types, and malformed input without crashing.
 *
 * The normalized shape aligns with shared/weather-schema.json's imd_alert,
 * extended with district and timing information for the alert engine.
 */

const VALID_SEVERITIES = ['yellow', 'orange', 'red'];

/**
 * Normalize a raw alert object into a consistent structure.
 *
 * @param {*} raw - Raw alert data (may be malformed)
 * @returns {{ valid: boolean, alert: Object, errors: string[] }}
 */
function normalizeAlert(raw) {
  const errors = [];

  // Guard against non-object or null input
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      valid: false,
      alert: buildEmptyAlert(),
      errors: ['Input is not a valid alert object']
    };
  }

  // Active status
  const active = typeof raw.active === 'boolean' ? raw.active : false;

  // District
  let district = '';
  if (raw.district && typeof raw.district === 'string') {
    district = raw.district.trim();
  } else {
    errors.push('Missing or invalid district');
  }

  // Severity — must be one of the recognized levels
  let severity = '';
  if (raw.severity && typeof raw.severity === 'string') {
    const normalized = raw.severity.trim().toLowerCase();
    if (VALID_SEVERITIES.includes(normalized)) {
      severity = normalized;
    } else {
      errors.push(`Unrecognized severity: "${raw.severity}"`);
    }
  } else if (active) {
    // Only flag as error if alert is active — inactive alerts don't need severity
    errors.push('Missing or invalid severity');
  }

  // Event type
  let event = '';
  if (raw.event && typeof raw.event === 'string') {
    event = raw.event.trim();
  }

  // Message
  let message = '';
  if (raw.message && typeof raw.message === 'string') {
    message = raw.message.trim();
  }

  // Optional timing fields (for future IMD data integration)
  const issuedAt = raw.issued_at || raw.issuedAt || null;
  const updatedAt = raw.updated_at || raw.updatedAt || null;

  const alert = {
    active,
    district,
    severity,
    event,
    message,
    issued_at: issuedAt,
    updated_at: updatedAt
  };

  return {
    valid: errors.length === 0,
    alert,
    errors
  };
}

function buildEmptyAlert() {
  return {
    active: false,
    district: '',
    severity: '',
    event: '',
    message: '',
    issued_at: null,
    updated_at: null
  };
}

module.exports = { normalizeAlert, VALID_SEVERITIES };
