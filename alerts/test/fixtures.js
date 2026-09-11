/**
 * TEST DATA — Alert Fixtures
 *
 * These are LOCAL TEST FIXTURES for development and testing only.
 * They do NOT represent real IMD warnings.
 *
 * ⚠️  TEST DATA — NOT OFFICIAL IMD INFORMATION  ⚠️
 */

const fixtures = {
  // Active alerts of each severity
  yellowAlert: {
    district: 'Warangal',
    severity: 'yellow',
    event: 'Thunderstorm',
    active: true,
    message: 'TEST ALERT — Thunderstorm likely in isolated areas'
  },

  orangeAlert: {
    district: 'Warangal',
    severity: 'orange',
    event: 'Heavy Rain',
    active: true,
    message: 'TEST ALERT — Heavy rainfall likely'
  },

  redAlert: {
    district: 'Warangal',
    severity: 'red',
    event: 'Extremely Heavy Rain',
    active: true,
    message: 'TEST ALERT — Extremely heavy rainfall expected, take precautions'
  },

  // Inactive alert
  inactiveAlert: {
    district: 'Warangal',
    severity: 'orange',
    event: 'Heavy Rain',
    active: false,
    message: 'TEST ALERT — Previously active, now cleared'
  },

  // Alert for a different district
  hyderabadAlert: {
    district: 'Hyderabad',
    severity: 'orange',
    event: 'Heavy Rain',
    active: true,
    message: 'TEST ALERT — Heavy rainfall likely in Hyderabad'
  },

  // Malformed inputs
  nullInput: null,
  undefinedInput: undefined,
  stringInput: 'not an alert',
  arrayInput: [1, 2, 3],
  emptyObject: {},

  // Missing fields
  missingDistrict: {
    severity: 'orange',
    event: 'Heavy Rain',
    active: true,
    message: 'TEST ALERT — missing district'
  },

  missingSeverity: {
    district: 'Warangal',
    event: 'Heavy Rain',
    active: true,
    message: 'TEST ALERT — missing severity'
  },

  // Case variation for district matching
  warangalUpperCase: {
    district: 'WARANGAL',
    severity: 'orange',
    event: 'Heavy Rain',
    active: true,
    message: 'TEST ALERT — uppercase district'
  }
};

module.exports = fixtures;
