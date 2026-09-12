/**
 * WeatherGPT Alert Module — Test Suite
 *
 * Runs all 10 required test cases and reports results.
 * Uses the alert engine's public API to verify correctness.
 *
 * ⚠️  All alert data used here is TEST DATA, not real IMD information.
 */

const { normalizeAlert } = require('../services/alertNormalizer');
const { evaluateAlert } = require('../services/alertEvaluator');
const { matchesDistrict } = require('../services/districtMatcher');
const { NotificationService } = require('../services/notificationService');
const { ConsoleNotificationProvider } = require('../providers/consoleProvider');
const fixtures = require('./fixtures');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('  WeatherGPT Alert Module — Test Suite');
  console.log('='.repeat(60));

  const provider = new ConsoleNotificationProvider();
  const service = new NotificationService(provider);

  // ──────────────────────────────────────────────
  console.log('\n--- TEST 1: Active yellow alert → should notify ---');
  service.resetTracker();
  provider.reset();
  {
    const result = await service.processAlert(fixtures.yellowAlert, 'Warangal');
    assert(result.notified === true, 'Yellow alert triggers notification');
    assert(provider.count === 1, 'Provider received 1 notification');
  }

  // ──────────────────────────────────────────────
  console.log('\n--- TEST 2: Active orange alert → should notify ---');
  service.resetTracker();
  provider.reset();
  {
    const result = await service.processAlert(fixtures.orangeAlert, 'Warangal');
    assert(result.notified === true, 'Orange alert triggers notification');
    assert(provider.count === 1, 'Provider received 1 notification');
  }

  // ──────────────────────────────────────────────
  console.log('\n--- TEST 3: Active red alert → should notify ---');
  service.resetTracker();
  provider.reset();
  {
    const result = await service.processAlert(fixtures.redAlert, 'Warangal');
    assert(result.notified === true, 'Red alert triggers notification');
    assert(provider.count === 1, 'Provider received 1 notification');
  }

  // ──────────────────────────────────────────────
  console.log('\n--- TEST 4: Inactive alert → should NOT notify ---');
  service.resetTracker();
  provider.reset();
  {
    const result = await service.processAlert(fixtures.inactiveAlert, 'Warangal');
    assert(result.notified === false, 'Inactive alert does not trigger notification');
    assert(result.reason.includes('not active'), 'Reason indicates inactive');
    assert(provider.count === 0, 'Provider received 0 notifications');
  }

  // ──────────────────────────────────────────────
  console.log('\n--- TEST 5: Alert for Warangal + user in Warangal → should notify ---');
  service.resetTracker();
  provider.reset();
  {
    const result = await service.processAlert(fixtures.orangeAlert, 'Warangal');
    assert(result.notified === true, 'Matching district triggers notification');
  }

  // ──────────────────────────────────────────────
  console.log('\n--- TEST 6: Alert for Warangal + user in Hyderabad → should NOT notify ---');
  service.resetTracker();
  provider.reset();
  {
    const result = await service.processAlert(fixtures.orangeAlert, 'Hyderabad');
    assert(result.notified === false, 'Non-matching district does not trigger notification');
    assert(result.reason.includes('Hyderabad'), 'Reason mentions user district');
    assert(provider.count === 0, 'Provider received 0 notifications');
  }

  // ──────────────────────────────────────────────
  console.log('\n--- TEST 7: Same alert received twice → second should be suppressed ---');
  service.resetTracker();
  provider.reset();
  {
    const result1 = await service.processAlert(fixtures.orangeAlert, 'Warangal');
    assert(result1.notified === true, 'First alert triggers notification');

    const result2 = await service.processAlert(fixtures.orangeAlert, 'Warangal');
    assert(result2.notified === false, 'Second identical alert is suppressed');
    assert(result2.reason.includes('Duplicate'), 'Reason indicates duplicate');
    assert(provider.count === 1, 'Provider received exactly 1 notification (not 2)');
  }

  // ──────────────────────────────────────────────
  console.log('\n--- TEST 8: Missing district → handled safely ---');
  service.resetTracker();
  provider.reset();
  {
    const result = await service.processAlert(fixtures.missingDistrict, 'Warangal');
    assert(result.notified === false, 'Missing district does not crash or notify');
    assert(provider.count === 0, 'Provider received 0 notifications');
  }

  // ──────────────────────────────────────────────
  console.log('\n--- TEST 9: Missing severity → handled safely ---');
  service.resetTracker();
  provider.reset();
  {
    const result = await service.processAlert(fixtures.missingSeverity, 'Warangal');
    assert(result.notified === false, 'Missing severity does not crash or notify');
    assert(provider.count === 0, 'Provider received 0 notifications');
  }

  // ──────────────────────────────────────────────
  console.log('\n--- TEST 10: Malformed alert objects → should NOT crash ---');
  service.resetTracker();
  provider.reset();
  {
    let crashed = false;
    try {
      await service.processAlert(fixtures.nullInput, 'Warangal');
      await service.processAlert(fixtures.undefinedInput, 'Warangal');
      await service.processAlert(fixtures.stringInput, 'Warangal');
      await service.processAlert(fixtures.arrayInput, 'Warangal');
      await service.processAlert(fixtures.emptyObject, 'Warangal');
    } catch (err) {
      crashed = true;
    }
    assert(!crashed, 'Malformed inputs do not crash the application');
    assert(provider.count === 0, 'No notifications sent for malformed input');
  }

  // ──────────────────────────────────────────────
  // Bonus: District case insensitivity
  console.log('\n--- BONUS: District matching is case-insensitive ---');
  service.resetTracker();
  provider.reset();
  {
    const result = await service.processAlert(fixtures.warangalUpperCase, 'warangal');
    assert(result.notified === true, 'Case-insensitive district matching works');
  }

  // ──────────────────────────────────────────────
  // Bonus: Direct unit tests for districtMatcher
  console.log('\n--- BONUS: District matcher unit tests ---');
  {
    assert(matchesDistrict('Warangal', 'Warangal') === true, 'Exact match');
    assert(matchesDistrict('Warangal', 'warangal') === true, 'Case insensitive');
    assert(matchesDistrict('  Warangal  ', 'Warangal') === true, 'Whitespace trimmed');
    assert(matchesDistrict('Warangal', 'Hyderabad') === false, 'Different districts');
    assert(matchesDistrict('', 'Warangal') === false, 'Empty alert district');
    assert(matchesDistrict('Warangal', '') === false, 'Empty user district');
    assert(matchesDistrict(null, 'Warangal') === false, 'Null alert district');
    assert(matchesDistrict('Warangal', null) === false, 'Null user district');
  }

  // ──────────────────────────────────────────────
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('='.repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
