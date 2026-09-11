/**
 * Console Notification Provider
 *
 * DEVELOPMENT NOTIFICATION ADAPTER
 *
 * Logs notifications to the console for development and testing.
 * In production, this would be replaced with a real provider
 * (e.g., push notifications, SMS, email).
 *
 * All providers must implement: send({ district, severity, title, message })
 */

class ConsoleNotificationProvider {
  constructor() {
    // Store sent notifications for testing/verification
    this.sent = [];
  }

  /**
   * Send a notification (logs to console in development).
   *
   * @param {{ district: string, severity: string, title: string, message: string }} notification
   */
  async send(notification) {
    const timestamp = new Date().toISOString();
    const entry = { ...notification, timestamp };

    this.sent.push(entry);

    console.log(`\n🔔 [NOTIFICATION — DEV ADAPTER]`);
    console.log(`   District : ${notification.district}`);
    console.log(`   Severity : ${notification.severity}`);
    console.log(`   Title    : ${notification.title}`);
    console.log(`   Message  : ${notification.message}`);
    console.log(`   Time     : ${timestamp}`);
  }

  /**
   * Get count of notifications sent (useful for testing).
   */
  get count() {
    return this.sent.length;
  }

  /**
   * Clear sent history.
   */
  reset() {
    this.sent = [];
  }
}

module.exports = { ConsoleNotificationProvider };
