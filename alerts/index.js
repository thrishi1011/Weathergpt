/**
 * WeatherGPT Alert Engine — Public API
 *
 * This is the entry point for the alerts module.
 * The backend (or any consumer) imports from here.
 */

const { normalizeAlert } = require('./services/alertNormalizer');
const { evaluateAlert } = require('./services/alertEvaluator');
const { matchesDistrict } = require('./services/districtMatcher');
const { NotificationService } = require('./services/notificationService');
const { ConsoleNotificationProvider } = require('./providers/consoleProvider');

module.exports = {
  normalizeAlert,
  evaluateAlert,
  matchesDistrict,
  NotificationService,
  ConsoleNotificationProvider
};
