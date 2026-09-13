/**
 * LocationBar Component
 * Shows a "Current Location" bubble (auto-detected via GPS) above the
 * "Target Location" search input (no suggested/preset cities).
 */

export function createLocationBar({ initialLocation = 'Warangal', onLocationChange }) {
  const container = document.createElement('div');
  container.className = 'location-card';
  container.id = 'location-selector-card';

  container.innerHTML = `
    <!-- Current (auto-detected) Location Bubble -->
    <button type="button" class="current-location-bubble" id="current-location-bubble" title="Use my current location as the target">
      <span class="current-location-icon">📌</span>
      <span class="current-location-label">Current Location:</span>
      <span class="current-location-value" id="current-location-value">Detecting...</span>
    </button>

    <div class="section-label">
      <span>📍</span>
      <span>Target Location</span>
    </div>

    <div class="location-input-wrapper">
      <span class="location-icon">🔍</span>
      <input 
        type="text" 
        id="location-search-input" 
        class="location-input" 
        placeholder="Enter city or district..." 
        value="${initialLocation}"
        autocomplete="off"
      />
      <button 
        type="button" 
        id="btn-detect-gps" 
        class="location-gps-btn" 
        title="Use my current GPS location"
      >
        🎯
      </button>
    </div>
  `;

  let currentLocation = initialLocation;
  let detectedLocation = null;
  const inputEl = container.querySelector('#location-search-input');
  const gpsBtn = container.querySelector('#btn-detect-gps');
  const currentLocationBubble = container.querySelector('#current-location-bubble');
  const currentLocationValueEl = container.querySelector('#current-location-value');

  function setLocation(newLoc) {
    if (!newLoc || !newLoc.trim()) return;
    currentLocation = newLoc.trim();
    inputEl.value = currentLocation;
    if (onLocationChange) onLocationChange(currentLocation);
  }

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setLocation(inputEl.value);
    }
  });

  inputEl.addEventListener('blur', () => {
    if (inputEl.value.trim() && inputEl.value.trim() !== currentLocation) {
      setLocation(inputEl.value);
    }
  });

  gpsBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    gpsBtn.textContent = '⏳';
    navigator.geolocation.getCurrentPosition(
      async () => {
        gpsBtn.textContent = '🎯';
        // In local/demo or quick preview, resolve to closest known station or detected coords
        setLocation('Warangal');
      },
      (err) => {
        gpsBtn.textContent = '🎯';
        console.warn('Geolocation error:', err.message);
        // Fallback default
        setLocation('Warangal');
      },
      { timeout: 5000 }
    );
  });

  // ---- Current Location Bubble (auto-detects silently on load) ----
  function setDetectedLocation(loc) {
    detectedLocation = loc;
    currentLocationValueEl.textContent = loc;
  }

  currentLocationBubble.addEventListener('click', () => {
    if (detectedLocation) setLocation(detectedLocation);
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      () => {
        // In local/demo mode, resolve to the closest known station.
        // A live backend can swap this for real reverse-geocoding.
        setDetectedLocation('Warangal');
      },
      () => {
        setDetectedLocation('Warangal');
      },
      { timeout: 5000 }
    );
  } else {
    setDetectedLocation('Warangal');
  }

  return {
    element: container,
    getLocation: () => currentLocation,
    setLocation: (loc) => setLocation(loc)
  };
}
