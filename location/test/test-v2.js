/**
 * test-v2.js
 * Comprehensive automated verification script covering all 31 testing scenarios:
 * GPS success, coordinates/accuracy, permission states (granted/prompt/denied/unsupported),
 * permission denied, position unavailable, timeout, unsupported browser, GPS options,
 * reverse geocoding, forward geocoding, geocoding failures, India/local normalization,
 * remote normalization, IP fallback, IP provider fallback, invalid IP coordinates,
 * GPS -> district/address, GPS -> IP fallback, and fallback disabled.
 */

import assert from 'node:assert/strict';
import {
  forwardGeocode,
  reverseGeocode,
  normalizeLocationName,
  findLocalMatch,
  getLocationByIP,
  autoDetectLocation,
  getCurrentLocation,
  getCurrentDistrict,
  checkLocationPermission,
  LocationError,
  LOCATION_ERROR_CODES,
  INDIA_DISTRICTS,
  INDIA_PLACES,
  TELANGANA_DISTRICTS,
} from '../index.js';

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  try {
    process.stdout.write(`Testing: ${name}... `);
    await fn();
    console.log('PASSED');
    passed++;
  } catch (err) {
    console.log('FAILED');
    console.error(err);
    failed++;
  }
}

// Small sleep helper to respect Nominatim rate limit
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log('========================================');
console.log('Running Location Module v2 Test Suite (31 Tests)');
console.log('========================================\n');

// 1. forwardGeocode("Warangal")
await runTest('1. forwardGeocode("Warangal") resolves to Telangana, India', async () => {
  const loc = await forwardGeocode('Warangal');
  assert(loc !== null, 'Should return a location');
  assert.equal(loc.source, 'remote');
  assert.equal(loc.country, 'India');
  assert(loc.state.includes('Telangana'), `Expected Telangana, got ${loc.state}`);
  assert(typeof loc.latitude === 'number');
  assert(typeof loc.longitude === 'number');
});
await sleep(1100);

// 2. forwardGeocode("Paris")
await runTest('2. forwardGeocode("Paris") resolves to Paris, France (not India)', async () => {
  const loc = await forwardGeocode('Paris');
  assert(loc !== null, 'Should return a location');
  assert.equal(loc.country, 'France');
  assert.equal(loc.source, 'remote');
  assert(loc.latitude > 48 && loc.latitude < 49, 'Expected Paris latitude');
});
await sleep(1100);

// 3. forwardGeocode("Springfield")
await runTest('3. forwardGeocode("Springfield") resolves without erroring', async () => {
  const loc = await forwardGeocode('Springfield');
  assert(loc !== null, 'Should return a location');
  assert(loc.name, 'Expected a location name');
  assert(typeof loc.latitude === 'number');
});
await sleep(1100);

// 4. forwardGeocode failure with empty string
await runTest('4. forwardGeocode("") throws INVALID_INPUT', async () => {
  await assert.rejects(
    async () => {
      await forwardGeocode('   ');
    },
    (err) => {
      assert(err instanceof LocationError);
      assert.equal(err.code, LOCATION_ERROR_CODES.INVALID_INPUT);
      return true;
    }
  );
});

// 5. reverseGeocode(35.6762, 139.6503) -> Tokyo, Japan
await runTest('5. reverseGeocode(35.6762, 139.6503) resolves to Tokyo, Japan', async () => {
  const loc = await reverseGeocode(35.6762, 139.6503);
  assert(loc !== null, 'Should return a location');
  assert.equal(loc.country, 'Japan');
  assert(
    loc.formattedAddress.includes('Tokyo') || loc.name.includes('Suginami') || loc.name.includes('Tokyo'),
    `Expected Tokyo in address or name, got ${JSON.stringify(loc)}`
  );
});
await sleep(1100);

// 6. reverseGeocode failure with non-numbers
await runTest('6. reverseGeocode("invalid", "coords") throws INVALID_INPUT', async () => {
  await assert.rejects(
    async () => {
      await reverseGeocode('invalid', null);
    },
    (err) => {
      assert(err instanceof LocationError);
      assert.equal(err.code, LOCATION_ERROR_CODES.INVALID_INPUT);
      return true;
    }
  );
});

// 7. normalizeLocationName("Warangal")
await runTest('7. normalizeLocationName("Warangal") resolves via local table', async () => {
  const loc = await normalizeLocationName('Warangal');
  assert.equal(loc.source, 'local');
  assert.equal(loc.name, 'Warangal');
  assert.equal(loc.district, 'Warangal');
  assert.equal(loc.state, 'Telangana');
  assert.equal(loc.country, 'India');
  assert.equal(loc.latitude, 17.9689);
  assert.equal(loc.longitude, 79.5941);
});

// 8. normalizeLocationName("Hyderabad")
await runTest('8. normalizeLocationName("Hyderabad") resolves via local table', async () => {
  const loc = await normalizeLocationName('Hyderabad');
  assert.equal(loc.source, 'local');
  assert.equal(loc.state, 'Telangana');
  assert.equal(loc.latitude, 17.385);
});

// 9. INDIA_DISTRICTS contains all India places (> 750 districts)
await runTest('9. INDIA_DISTRICTS contains all India places (> 750 districts)', async () => {
  assert(Array.isArray(INDIA_DISTRICTS));
  assert(INDIA_DISTRICTS.length >= 750, `Expected >= 750 districts, got ${INDIA_DISTRICTS.length}`);
  assert.equal(INDIA_PLACES, INDIA_DISTRICTS);
  assert(TELANGANA_DISTRICTS.length >= 33, 'Expected 33 Telangana districts');
});

// 10. Nationwide local lookups (Mumbai, Bengaluru, Delhi, Kolkata, Chennai)
await runTest('10. Nationwide Indian district local lookups', async () => {
  const mumbai = await normalizeLocationName('Mumbai');
  assert.equal(mumbai.source, 'local');
  assert.equal(mumbai.state, 'Maharashtra');

  const blr = await normalizeLocationName('Bengaluru');
  assert.equal(blr.source, 'local');
  assert.equal(blr.state, 'Karnataka');

  const delhi = await normalizeLocationName('Delhi');
  assert.equal(delhi.source, 'local');
  assert.equal(delhi.state, 'Delhi');

  const kolkata = await normalizeLocationName('Kolkata');
  assert.equal(kolkata.source, 'local');
  assert.equal(kolkata.state, 'West Bengal');

  const chennai = await normalizeLocationName('Chennai');
  assert.equal(chennai.source, 'local');
  assert.equal(chennai.state, 'Tamil Nadu');
});

// 11. normalizeLocationName("Nairobi") -> remote, Kenya
await runTest('11. normalizeLocationName("Nairobi") resolves via remote fallback (Kenya)', async () => {
  const loc = await normalizeLocationName('Nairobi');
  assert.equal(loc.source, 'remote');
  assert.equal(loc.country, 'Kenya');
  assert(loc.name.includes('Nairobi'), `Expected Nairobi in name, got ${loc.name}`);
});
await sleep(1100);

// 12. normalizeLocationName with invalid place throws LOCATION_NOT_FOUND
await runTest('12. normalizeLocationName with invalid query throws LOCATION_NOT_FOUND', async () => {
  await assert.rejects(
    async () => {
      await normalizeLocationName('not a real place asdkjhaskjdh');
    },
    (err) => {
      assert(err instanceof LocationError);
      assert.equal(err.code, LOCATION_ERROR_CODES.LOCATION_NOT_FOUND);
      return true;
    }
  );
});

// 13. getLocationByIP() returns normalized object with source: "ip"
await runTest('13. getLocationByIP() returns normalized object with source: "ip"', async () => {
  const loc = await getLocationByIP();
  assert(loc !== null);
  assert.equal(loc.source, 'ip');
  assert(loc.country !== null, 'Expected country');
  assert(typeof loc.latitude === 'number');
  assert(typeof loc.longitude === 'number');
  assert(loc.formattedAddress !== null);
});

// 14. getLocationByIP() network failure throws LocationError(IP_LOOKUP_FAILED)
await runTest('14. getLocationByIP() network failure throws IP_LOOKUP_FAILED', async () => {
  await assert.rejects(
    async () => {
      await getLocationByIP({ endpoint: 'https://invalid-non-existent-subdomain.weathergpt.test/json' });
    },
    (err) => {
      assert(err instanceof LocationError);
      assert.equal(err.code, LOCATION_ERROR_CODES.IP_LOOKUP_FAILED);
      return true;
    }
  );
});

// 15. getLocationByIP() invalid coordinates throws IP_LOOKUP_FAILED
await runTest('15. getLocationByIP() invalid coordinates throws IP_LOOKUP_FAILED', async () => {
  // Mock endpoint returning bad coordinates
  const origFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({ city: 'Nowhere', latitude: 'invalid_lat', longitude: 'invalid_lon' }),
    });
    await assert.rejects(
      async () => {
        await getLocationByIP({ endpoint: 'https://mock.test/json' });
      },
      (err) => {
        assert(err instanceof LocationError);
        assert.equal(err.code, LOCATION_ERROR_CODES.IP_LOOKUP_FAILED);
        return true;
      }
    );
  } finally {
    globalThis.fetch = origFetch;
  }
});

// 16. IP provider fallback: primary rate-limited, fallback succeeds
await runTest('16. IP provider fallback when primary fails', async () => {
  const origFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => {
      if (url.includes('ipapi.co')) {
        // primary fails with error
        return {
          ok: true,
          json: async () => ({ error: true, reason: 'RateLimited' }),
        };
      }
      // secondary succeeds
      return {
        ok: true,
        json: async () => ({
          city: 'Pune',
          region: 'Maharashtra',
          country: 'India',
          latitude: 18.5204,
          longitude: 73.8567,
        }),
      };
    };

    const loc = await getLocationByIP();
    assert.equal(loc.source, 'ip');
    assert.equal(loc.name, 'Pune');
    assert.equal(loc.state, 'Maharashtra');
  } finally {
    globalThis.fetch = origFetch;
  }
});

console.log('\n--- Testing Browser Geolocation & Permission Scenarios ---');

// 17. getCurrentLocation() in unsupported environment
await runTest('17. getCurrentLocation() in unsupported environment rejects with NOT_SUPPORTED', async () => {
  const origNavigator = globalThis.navigator;
  try {
    delete globalThis.navigator;
    await assert.rejects(
      async () => {
        await getCurrentLocation();
      },
      (err) => {
        assert(err instanceof LocationError);
        assert.equal(err.code, LOCATION_ERROR_CODES.NOT_SUPPORTED);
        return true;
      }
    );
  } finally {
    globalThis.navigator = origNavigator;
  }
});

// 18. checkLocationPermission() states: granted, prompt, denied, unsupported
await runTest('18. checkLocationPermission() returns correct permission states', async () => {
  const origNavigator = globalThis.navigator;
  try {
    // 18a. granted
    globalThis.navigator = { permissions: { query: async () => ({ state: 'granted' }) } };
    assert.equal(await checkLocationPermission(), 'granted');

    // 18b. prompt
    globalThis.navigator = { permissions: { query: async () => ({ state: 'prompt' }) } };
    assert.equal(await checkLocationPermission(), 'prompt');

    // 18c. denied
    globalThis.navigator = { permissions: { query: async () => ({ state: 'denied' }) } };
    assert.equal(await checkLocationPermission(), 'denied');

    // 18d. unsupported
    delete globalThis.navigator;
    assert.equal(await checkLocationPermission(), 'unsupported');
  } finally {
    globalThis.navigator = origNavigator;
  }
});

// 19. W3C Geolocation Error Mapping: code = 1 (PERMISSION_DENIED) without error instance properties
await runTest('19. Geolocation error code 1 maps to PERMISSION_DENIED (no error.PERMISSION_DENIED prop)', async () => {
  const origNavigator = globalThis.navigator;
  try {
    globalThis.navigator = {
      geolocation: {
        getCurrentPosition: (success, error) => {
          // Native browser GeolocationPositionError has numeric code = 1, NOT error.PERMISSION_DENIED
          const nativeBrowserError = { code: 1, message: 'User denied Geolocation' };
          error(nativeBrowserError);
        },
      },
    };

    await assert.rejects(
      async () => {
        await getCurrentLocation();
      },
      (err) => {
        assert(err instanceof LocationError);
        assert.equal(err.code, LOCATION_ERROR_CODES.PERMISSION_DENIED);
        return true;
      }
    );
  } finally {
    globalThis.navigator = origNavigator;
  }
});

// 20. W3C Geolocation Error Mapping: code = 2 (POSITION_UNAVAILABLE)
await runTest('20. Geolocation error code 2 maps to POSITION_UNAVAILABLE', async () => {
  const origNavigator = globalThis.navigator;
  try {
    globalThis.navigator = {
      geolocation: {
        getCurrentPosition: (success, error) => {
          const nativeBrowserError = { code: 2, message: 'Position unavailable' };
          error(nativeBrowserError);
        },
      },
    };

    await assert.rejects(
      async () => {
        await getCurrentLocation();
      },
      (err) => {
        assert(err instanceof LocationError);
        assert.equal(err.code, LOCATION_ERROR_CODES.POSITION_UNAVAILABLE);
        return true;
      }
    );
  } finally {
    globalThis.navigator = origNavigator;
  }
});

// 21. W3C Geolocation Error Mapping: code = 3 (TIMEOUT)
await runTest('21. Geolocation error code 3 maps to TIMEOUT', async () => {
  const origNavigator = globalThis.navigator;
  try {
    globalThis.navigator = {
      geolocation: {
        getCurrentPosition: (success, error) => {
          const nativeBrowserError = { code: 3, message: 'Timeout expired' };
          error(nativeBrowserError);
        },
      },
    };

    await assert.rejects(
      async () => {
        await getCurrentLocation();
      },
      (err) => {
        assert(err instanceof LocationError);
        assert.equal(err.code, LOCATION_ERROR_CODES.TIMEOUT);
        return true;
      }
    );
  } finally {
    globalThis.navigator = origNavigator;
  }
});

// 22. GPS success: coordinates, accuracy, altitude, timestamp
await runTest('22. getCurrentLocation() resolves with valid coordinates and metadata', async () => {
  const origNavigator = globalThis.navigator;
  try {
    const mockTimestamp = Date.now();
    globalThis.navigator = {
      geolocation: {
        getCurrentPosition: (success) => {
          success({
            coords: {
              latitude: 17.9689,
              longitude: 79.5941,
              accuracy: 15,
              altitude: 300,
              altitudeAccuracy: 5,
              heading: 180,
              speed: 1.5,
            },
            timestamp: mockTimestamp,
          });
        },
      },
    };

    const pos = await getCurrentLocation();
    assert.equal(pos.latitude, 17.9689);
    assert.equal(pos.longitude, 79.5941);
    assert.equal(pos.accuracy, 15);
    assert.equal(pos.altitude, 300);
    assert.equal(pos.speed, 1.5);
    assert.equal(pos.timestamp, mockTimestamp);
  } finally {
    globalThis.navigator = origNavigator;
  }
});

// 23. GPS options passed through
await runTest('23. getCurrentLocation(options) passes options to navigator.geolocation', async () => {
  const origNavigator = globalThis.navigator;
  try {
    let capturedOpts = null;
    globalThis.navigator = {
      geolocation: {
        getCurrentPosition: (success, error, opts) => {
          capturedOpts = opts;
          success({
            coords: { latitude: 12.9716, longitude: 77.5946, accuracy: 5 },
            timestamp: Date.now(),
          });
        },
      },
    };

    await getCurrentLocation({ enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 });
    assert(capturedOpts !== null);
    assert.equal(capturedOpts.enableHighAccuracy, false);
    assert.equal(capturedOpts.timeout, 5000);
    assert.equal(capturedOpts.maximumAge, 60000);
  } finally {
    globalThis.navigator = origNavigator;
  }
});

// 24. getCurrentDistrict() GPS -> reverseGeocode chain
await runTest('24. getCurrentDistrict() chains GPS to reverseGeocode with source: "gps"', async () => {
  const origNavigator = globalThis.navigator;
  try {
    globalThis.navigator = {
      geolocation: {
        getCurrentPosition: (success) => {
          success({
            coords: { latitude: 17.9689, longitude: 79.5941, accuracy: 12 },
            timestamp: Date.now(),
          });
        },
      },
    };

    const res = await getCurrentDistrict();
    assert.equal(res.source, 'gps');
    assert.equal(res.accuracy, 12);
    assert.equal(res.country, 'India');
    assert(typeof res.latitude === 'number');
  } finally {
    globalThis.navigator = origNavigator;
  }
});

// 25. autoDetectLocation() with permission 'granted' -> source: "gps"
await runTest('25. autoDetectLocation() with permission granted returns source: "gps"', async () => {
  const origNavigator = globalThis.navigator;
  try {
    globalThis.navigator = {
      geolocation: {
        getCurrentPosition: (success) => {
          success({
            coords: { latitude: 17.9689, longitude: 79.5941, accuracy: 8 },
            timestamp: Date.now(),
          });
        },
      },
      permissions: {
        query: async () => ({ state: 'granted' }),
      },
    };

    const loc = await autoDetectLocation();
    assert.equal(loc.source, 'gps');
    assert.equal(loc.accuracy, 8);
    assert.equal(loc.country, 'India');
  } finally {
    globalThis.navigator = origNavigator;
  }
});

// 26. autoDetectLocation() with permission 'prompt' and user accepts -> source: "gps"
await runTest('26. autoDetectLocation() with permission prompt (accepted) returns source: "gps"', async () => {
  const origNavigator = globalThis.navigator;
  try {
    globalThis.navigator = {
      geolocation: {
        getCurrentPosition: (success) => {
          success({
            coords: { latitude: 17.9689, longitude: 79.5941, accuracy: 20 },
            timestamp: Date.now(),
          });
        },
      },
      permissions: {
        query: async () => ({ state: 'prompt' }),
      },
    };

    const loc = await autoDetectLocation();
    assert.equal(loc.source, 'gps');
    assert.equal(loc.accuracy, 20);
  } finally {
    globalThis.navigator = origNavigator;
  }
});

// 27. autoDetectLocation() with permission 'prompt' and user denies -> falls back to IP
await runTest('27. autoDetectLocation() with permission prompt (denied by user) falls back to IP', async () => {
  const origNavigator = globalThis.navigator;
  try {
    globalThis.navigator = {
      geolocation: {
        getCurrentPosition: (success, error) => {
          error({ code: 1, message: 'User dismissed prompt' });
        },
      },
      permissions: {
        query: async () => ({ state: 'prompt' }),
      },
    };

    const loc = await autoDetectLocation();
    assert.equal(loc.source, 'ip');
    assert(loc.country !== null);
  } finally {
    globalThis.navigator = origNavigator;
  }
});

// 28. autoDetectLocation() with permission 'denied' directly falls back to IP
await runTest('28. autoDetectLocation() with permission denied directly returns source: "ip"', async () => {
  const origNavigator = globalThis.navigator;
  try {
    let gpsCalled = false;
    globalThis.navigator = {
      geolocation: {
        getCurrentPosition: () => {
          gpsCalled = true;
        },
      },
      permissions: {
        query: async () => ({ state: 'denied' }),
      },
    };

    const loc = await autoDetectLocation();
    assert.equal(gpsCalled, false, 'GPS prompt should be skipped when permission is denied');
    assert.equal(loc.source, 'ip');
  } finally {
    globalThis.navigator = origNavigator;
  }
});

// 29. autoDetectLocation({ allowIpFallback: false }) with permission denied throws PERMISSION_DENIED
await runTest('29. autoDetectLocation({ allowIpFallback: false }) with permission denied throws PERMISSION_DENIED', async () => {
  const origNavigator = globalThis.navigator;
  try {
    globalThis.navigator = {
      geolocation: {
        getCurrentPosition: (success, error) => {
          error({ code: 1, message: 'Permission denied' });
        },
      },
      permissions: {
        query: async () => ({ state: 'denied' }),
      },
    };

    await assert.rejects(
      async () => {
        await autoDetectLocation({ allowIpFallback: false });
      },
      (err) => {
        assert(err instanceof LocationError);
        assert.equal(err.code, LOCATION_ERROR_CODES.PERMISSION_DENIED);
        return true;
      }
    );
  } finally {
    globalThis.navigator = origNavigator;
  }
});

// 30. autoDetectLocation({ allowIpFallback: false }) with GPS timeout throws TIMEOUT
await runTest('30. autoDetectLocation({ allowIpFallback: false }) with timeout throws TIMEOUT', async () => {
  const origNavigator = globalThis.navigator;
  try {
    globalThis.navigator = {
      geolocation: {
        getCurrentPosition: (success, error) => {
          error({ code: 3, message: 'GPS timeout' });
        },
      },
      permissions: {
        query: async () => ({ state: 'granted' }),
      },
    };

    await assert.rejects(
      async () => {
        await autoDetectLocation({ allowIpFallback: false });
      },
      (err) => {
        assert(err instanceof LocationError);
        assert.equal(err.code, LOCATION_ERROR_CODES.TIMEOUT);
        return true;
      }
    );
  } finally {
    globalThis.navigator = origNavigator;
  }
});

// 31. autoDetectLocation({ allowIpFallback: true }) with GPS timeout falls back to IP
await runTest('31. autoDetectLocation() with GPS timeout falls back to source: "ip"', async () => {
  const origNavigator = globalThis.navigator;
  try {
    globalThis.navigator = {
      geolocation: {
        getCurrentPosition: (success, error) => {
          error({ code: 3, message: 'GPS timeout' });
        },
      },
      permissions: {
        query: async () => ({ state: 'granted' }),
      },
    };

    const loc = await autoDetectLocation({ allowIpFallback: true });
    assert.equal(loc.source, 'ip');
    assert(loc.country !== null);
  } finally {
    globalThis.navigator = origNavigator;
  }
});

console.log('\n========================================');
console.log(`Test Results: ${passed} passed, ${failed} failed`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}
