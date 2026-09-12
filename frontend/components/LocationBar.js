/**
 * LocationBar Component
 * Real browser GPS auto-detection, reverse geocoding, search worldwide,
 * and quick presets for convenient navigation.
 */

import { reverseGeocodeCoords, searchLocations, detectIpLocation } from '../services/api.js';

const PRESET_LOCATIONS = ['Warangal', 'Hyderabad', 'Delhi', 'Mumbai', 'Bengaluru'];

export function createLocationBar({ initialLocation = 'Warangal', initialCoords = null, onLocationChange }) {
  const container = document.createElement('div');
  container.className = 'location-card';
  container.id = 'location-selector-card';

  container.innerHTML = `
    <div class="section-label">
      <span>📍</span>
      <span>Target Location</span>
      <span class="location-badge" id="location-source-badge">Manual</span>
    </div>

    <div class="location-input-wrapper">
      <span class="location-icon">🔍</span>
      <input 
        type="text" 
        id="location-search-input" 
        class="location-input" 
        placeholder="Enter city or district (e.g. Warangal, Jaipur)..." 
        value="${initialLocation}"
        autocomplete="off"
        list="location-search-datalist"
      />
      <datalist id="location-search-datalist"></datalist>
      <button 
        type="button" 
        id="btn-detect-gps" 
        class="location-gps-btn" 
        title="Detect current GPS location"
        aria-label="Detect GPS Location"
      >
        🎯
      </button>
    </div>

    <div class="location-status-text" id="location-status-info" style="display: none;"></div>

    <div class="quick-chips-grid" id="quick-chips-container">
      ${PRESET_LOCATIONS.map(loc => `
        <button 
          type="button" 
          class="location-chip ${loc.toLowerCase() === initialLocation.toLowerCase() ? 'active' : ''}" 
          data-location="${loc}"
        >
          ${loc}
        </button>
      `).join('')}
    </div>
  `;

  let currentLocation = initialLocation;
  let currentCoords = initialCoords;
  let currentSource = 'manual';

  const inputEl = container.querySelector('#location-search-input');
  const chipsContainer = container.querySelector('#quick-chips-container');
  const gpsBtn = container.querySelector('#btn-detect-gps');
  const badgeEl = container.querySelector('#location-source-badge');
  const statusEl = container.querySelector('#location-status-info');
  const datalist = container.querySelector('#location-search-datalist');

  function updateBadge(source, coords = null) {
    currentSource = source;
    if (source === 'gps') {
      badgeEl.textContent = coords ? `🎯 GPS (${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)})` : '🎯 GPS';
      badgeEl.className = 'location-badge badge-gps';
    } else if (source === 'ip') {
      badgeEl.textContent = '🌐 IP Fallback';
      badgeEl.className = 'location-badge badge-ip';
    } else {
      badgeEl.textContent = '✏️ Manual';
      badgeEl.className = 'location-badge badge-manual';
    }
  }

  function setStatus(msg, isError = false) {
    if (!msg) {
      statusEl.style.display = 'none';
      return;
    }
    statusEl.style.display = 'block';
    statusEl.style.color = isError ? '#ef4444' : '#64748b';
    statusEl.style.fontSize = '0.75rem';
    statusEl.style.marginTop = '4px';
    statusEl.textContent = msg;
  }

  function updateActiveChip(loc) {
    chipsContainer.querySelectorAll('.location-chip').forEach(chip => {
      if (chip.dataset.location.toLowerCase() === loc.toLowerCase()) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  function setLocation(newLoc, coords = null, source = 'manual') {
    if (!newLoc || !newLoc.trim()) return;
    currentLocation = newLoc.trim();
    currentCoords = coords;
    inputEl.value = currentLocation;
    updateActiveChip(currentLocation);
    updateBadge(source, coords);
    setStatus(null);

    if (onLocationChange) {
      onLocationChange({
        name: currentLocation,
        coordinates: currentCoords,
        source: source
      });
    }
  }

  // Real GPS Detection
  async function triggerGpsDetection() {
    if (!navigator.geolocation) {
      setStatus('Geolocation not supported by browser. Trying IP location...', true);
      await fallbackToIp();
      return;
    }

    gpsBtn.textContent = '⏳';
    gpsBtn.disabled = true;
    setStatus('Acquiring real GPS coordinates from browser...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        gpsBtn.textContent = '🎯';
        gpsBtn.disabled = false;

        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };

        setStatus(`GPS locked: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}. Resolving address...`);

        try {
          const resolved = await reverseGeocodeCoords(coords.latitude, coords.longitude);
          const detectedCity = resolved ? (resolved.name || resolved.district || 'Current Location') : 'Current Location';
          setLocation(detectedCity, coords, 'gps');
          setStatus(`Detected: ${detectedCity} via GPS`, false);
        } catch (e) {
          console.warn('Reverse geocode error:', e);
          setLocation(`GPS (${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)})`, coords, 'gps');
        }
      },
      async (err) => {
        gpsBtn.textContent = '🎯';
        gpsBtn.disabled = false;
        console.warn('Browser GPS failed:', err.message, 'Code:', err.code);

        if (err.code === 1) {
          setStatus('Location access denied. Search for a location manually.', true);
          return;
        }

        const reasons = {
          2: 'GPS position unavailable',
          3: 'GPS request timed out'
        };
        const reason = reasons[err.code] || err.message;
        setStatus(`GPS unavailable (${reason}). Checking IP location fallback...`, true);

        await fallbackToIp();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  async function fallbackToIp() {
    try {
      const ipData = await detectIpLocation();
      if (ipData && ipData.name) {
        const coords = ipData.latitude && ipData.longitude ? { latitude: ipData.latitude, longitude: ipData.longitude } : null;
        setLocation(ipData.name, coords, 'ip');
        setStatus(`Located via IP: ${ipData.name}`, false);
        return;
      }
    } catch (e) {
      console.warn('IP fallback failed:', e);
    }
    setStatus('Unable to auto-detect. Please enter city manually.', true);
  }

  // Event Listeners
  gpsBtn.addEventListener('click', () => {
    triggerGpsDetection();
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputEl.value.trim()) {
        setLocation(inputEl.value.trim(), null, 'manual');
      }
    }
  });

  inputEl.addEventListener('blur', () => {
    if (inputEl.value.trim() && inputEl.value.trim().toLowerCase() !== currentLocation.toLowerCase()) {
      setLocation(inputEl.value.trim(), null, 'manual');
    }
  });

  // Suggest search results as user types (debounced)
  let searchTimer = null;
  inputEl.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = inputEl.value.trim();
    if (q.length < 3) return;

    searchTimer = setTimeout(async () => {
      try {
        const results = await searchLocations(q);
        datalist.innerHTML = results.map(r => `
          <option value="${r.name}">${r.formattedAddress}</option>
        `).join('');
      } catch (e) {
        // Ignore datalist error
      }
    }, 400);
  });

  chipsContainer.addEventListener('click', (e) => {
    const chip = e.target.closest('.location-chip');
    if (chip) {
      setLocation(chip.dataset.location, null, 'manual');
    }
  });

  return {
    element: container,
    getLocation: () => currentLocation,
    getCoordinates: () => currentCoords,
    getSource: () => currentSource,
    setLocation: (loc, coords = null, source = 'manual') => setLocation(loc, coords, source),
    detectGps: () => triggerGpsDetection()
  };
}
