# Location Module

Framework-agnostic location layer. Plain ES modules, zero dependencies —
drop this folder into any project (React, Vue, Next.js, plain JS) and
import from it.

## Scope

This module answers **"where is the user, and what place/district is that?"**
worldwide. It does **not** build the alert engine or fetch weather — turning
a resolved place into weather forecasts or alerts is handled downstream by
`data/`, `alerts/`, and `backend/`:

```
Device (GPS / IP) → Location Module → Normalized Location Object → Backend
User place query  → Location Module → Normalized Location Object → Backend
```

## Files

| File | Purpose |
|---|---|
| `geolocation.js` | Wraps `navigator.geolocation`. One-shot location fetch (no continuous tracking), normalized error codes. |
| `geocoding.js` | Reverse geocoding (coords → address) and forward geocoding (name → coords) worldwide via Nominatim (OpenStreetMap), free/no API key. |
| `ipLocation.js` | Approximate IP-based location fallback (city-level, zero-dependency, keyless). |
| `india.js` | Offline dataset of all 778+ districts and IMD weather station locations across India (28 states + 8 UTs) for instant, rate-limit-free normalization. |
| `normalize.js` | Normalizes free-text input ("Warangal", "Mumbai", "Paris", "Tokyo") → structured object, using local India dataset first and remote geocoding worldwide as fallback. |
| `index.js` | Public API surface. Import from here. |

## Install

No dependencies to install. Just copy the `location/` folder into your
project (e.g. `src/location/`).

## API

```js
import {
  autoDetectLocation,
  getLocationByIP,
  getCurrentLocation,
  checkLocationPermission,
  getCurrentDistrict,
  reverseGeocode,
  forwardGeocode,
  normalizeLocationName,
  LocationError,
  LOCATION_ERROR_CODES,
} from './location/index.js';
```

---

### `autoDetectLocation(options?)`

Self-service location detection. Checks browser permission and attempts
GPS-based geolocation first; if denied, unavailable, or timed out, automatically
falls back to approximate IP-based geolocation (unless disabled).

```js
try {
  const loc = await autoDetectLocation();
  // {
  //   name: "Warangal",
  //   district: "Warangal",
  //   state: "Telangana",
  //   country: "India",
  //   formattedAddress: "Warangal, Telangana, India",
  //   latitude: 17.982,
  //   longitude: 79.597,
  //   accuracy: 25, // if GPS
  //   source: "gps" // or "ip"
  // }
} catch (err) {
  // Only thrown if GPS fails AND (IP fallback is disabled OR IP lookup fails)
  console.error(err.code, err.message);
}
```

#### Options:
- `geoOptions` *(PositionOptions, optional)*: Options passed to GPS (`enableHighAccuracy`, `timeout`, `maximumAge`).
- `allowIpFallback` *(boolean, default: `true`)*: When `false`, GPS failures will not fall back to IP and will rethrow immediately.
- `ipOptions` *(object, optional)*: Options passed to `getLocationByIP` (e.g. `signal`, custom `endpoint`).

#### Permission & Fallback Decision Table:

| Permission State | `allowIpFallback: true` (default) | `allowIpFallback: false` |
|---|---|---|
| `'granted'` | Attempts GPS. If GPS fails/times out, falls back to IP. | Attempts GPS. If GPS fails, rethrows `LocationError`. |
| `'prompt'` | Triggers prompt. If allowed, uses GPS. If dismissed/denied, falls back to IP. | Triggers prompt. If dismissed/denied, throws `PERMISSION_DENIED`. |
| `'denied'` | Skips GPS prompt entirely, goes straight to IP lookup (`source: "ip"`). | Immediately throws `PERMISSION_DENIED`. |
| `'unsupported'` | Attempts GPS anyway; on failure falls back to IP. | Attempts GPS; throws `NOT_SUPPORTED` / failure. |

---

### `getLocationByIP(options?)`

Fetches approximate location using client IP address. Free and keyless.

> **Note:** IP geolocation provides city-level approximation and is intended as
> a fallback when GPS is not available.

```js
const loc = await getLocationByIP();
// { name, district, state, country, formattedAddress, latitude, longitude, source: "ip" }
```

---

### `getCurrentLocation(options?)`

Triggers the browser permission prompt and resolves the device's current
GPS position **once**. Never watches or tracks continuously.

```js
try {
  const pos = await getCurrentLocation();
  // { latitude, longitude, accuracy, altitude, heading, speed, timestamp }
} catch (err) {
  if (err.code === LOCATION_ERROR_CODES.PERMISSION_DENIED) { /* ... */ }
  if (err.code === LOCATION_ERROR_CODES.POSITION_UNAVAILABLE) { /* ... */ }
  if (err.code === LOCATION_ERROR_CODES.TIMEOUT) { /* ... */ }
}
```

---

### `checkLocationPermission()`

Checks permission state (`'granted' | 'denied' | 'prompt' | 'unsupported'`)
**without** triggering the browser prompt. Useful for deciding whether to
render a "Use GPS" button.

---

### `getCurrentDistrict(options?)`

Convenience helper chaining `getCurrentLocation` → `reverseGeocode` in one
call — strict GPS-only resolution with no IP fallback.

```js
const location = await getCurrentDistrict();
// { name, district, state, country, formattedAddress, latitude, longitude, accuracy, source: "gps" }
```

---

### `reverseGeocode(latitude, longitude, options?)`

Converts coordinates into a normalized address object worldwide.

```js
const address = await reverseGeocode(35.6762, 139.6503);
// Resolves to Tokyo, Japan
```

---

### `forwardGeocode(query, options?)`

Converts a place name into coordinates worldwide (or `null` if not found).
Supports optional country scoping via `opts.countryCodes`.

```js
const paris = await forwardGeocode("Paris");
// Resolves to Paris, France (source: "remote")

const hydIndia = await forwardGeocode("Hyderabad", { countryCodes: "in" });
// Scoped to India only
```

---

### `normalizeLocationName(query, options?)`

Normalizes free-text input (`"Warangal"`, `"Paris"`, `"Tokyo"`, `"London"`)
into a consistent structured location object:

```js
const result = await normalizeLocationName("Warangal");
// {
//   name: "Warangal",
//   district: "Warangal",
//   state: "Telangana",
//   country: "India",
//   formattedAddress: "Warangal, Warangal, Telangana, India",
//   latitude: 17.9689,
//   longitude: 79.5941,
//   source: "local"
// }
```

- Checks the offline `INDIA_DISTRICTS` table (`india.js`) first (`source: "local"`), instantly covering all 778+ Indian districts without network calls.
- Falls back to worldwide geocoding if not found in the local table (`source: "remote"`).
- Set `useRemoteFallback: false` to restrict to local offline dataset only.
- Pass `countryCodes: "..."` to scope the remote search if desired.

---

## Auto-Detect vs Manual GPS vs Manual Place Name

| Scenario | Function to Call | Behavior & Fallback | Output Source |
|---|---|---|---|
| **App Initial Load** | `autoDetectLocation()` | Tries GPS silently if allowed; falls back to IP without crashing if denied or unavailable. | `'gps'` or `'ip'` |
| **User Clicks "Use My Exact Location"** | `getCurrentDistrict()` | Strictly requests GPS coordinates; prompts user and fails explicitly if denied. | `'gps'` |
| **User Types a City / Town in Search Box** | `normalizeLocationName(query)` | Checks fast offline dataset first, then searches worldwide via remote geocoding. | `'local'` or `'remote'` |
| **User Pins a Point on a Map** | `reverseGeocode(lat, lon)` | Converts raw coordinates to country/state/district/city hierarchy. | N/A |

---

## Normalized Location Schema

Every function resolving a location returns this consistent shape:

```json
{
  "name": "Warangal",
  "district": "Warangal",
  "state": "Telangana",
  "country": "India",
  "formattedAddress": "Warangal, Telangana, India",
  "latitude": 17.9689,
  "longitude": 79.5941,
  "accuracy": 15,
  "source": "gps"
}
```

- `source`: `'gps'` (accurate device fix), `'ip'` (approximate city-level), `'local'` (offline dataset fast-path), or `'remote'` (worldwide geocoding).

---

## Error Handling

Every failure throws or rejects a `LocationError` with a stable `.code` from `LOCATION_ERROR_CODES`:

- `NOT_SUPPORTED`: Geolocation API not available.
- `PERMISSION_DENIED`: User or browser denied location permission.
- `POSITION_UNAVAILABLE`: Device GPS fix unavailable.
- `TIMEOUT`: Location request timed out.
- `INVALID_INPUT`: Bad parameters (e.g. empty place name or non-numeric lat/lon).
- `GEOCODING_FAILED`: Network error or provider rejection during geocoding.
- `LOCATION_NOT_FOUND`: Query place name not found.
- `IP_LOOKUP_FAILED`: Network error or provider rejection during IP lookup.
- `UNKNOWN`: Unrecognized error.

Calling code can switch on `error.code`:

```js
try {
  await autoDetectLocation({ allowIpFallback: false });
} catch (err) {
  if (err.code === LOCATION_ERROR_CODES.PERMISSION_DENIED) {
    // Show prompt asking user to enable location
  }
}
```

---

## Production Notes

- **Geocoding provider:** Nominatim (OpenStreetMap) is free and requires no API key, but caps requests at ~1 req/sec and requires a descriptive User-Agent. For production traffic, proxy calls through your backend or swap in a paid provider (Google Maps Geocoding, Mapbox, LocationIQ) by editing `geocoding.js`.
- **IP Geolocation provider:** `ipLocation.js` uses free endpoints (`ipapi.co` with automatic fallback to `ipwho.is`). For high-volume production, proxy through your backend or swap in a dedicated provider (Cloudflare IP headers, MaxMind GeoIP, or Ipdata).
- **District coordinates:** `india.js` provides representative centroids for all 778+ districts and IMD places across India as an instant offline fast path.
- **Zero UI on purpose:** This module is the headless data/service layer. Wire it into your frontend component of choice.
