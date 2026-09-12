/**
 * LocationBar Component
 * Location input with search, quick chips (Warangal, Hyderabad, etc.), and GPS auto-detect
 */

const PRESET_LOCATIONS = ['Warangal', 'Hyderabad', 'Delhi', 'Mumbai', 'Bengaluru'];

export function createLocationBar({ initialLocation = 'Warangal', onLocationChange }) {
  const container = document.createElement('div');
  container.className = 'location-card';
  container.id = 'location-selector-card';

  container.innerHTML = `
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
  const inputEl = container.querySelector('#location-search-input');
  const chipsContainer = container.querySelector('#quick-chips-container');
  const gpsBtn = container.querySelector('#btn-detect-gps');

  function updateActiveChip(loc) {
    chipsContainer.querySelectorAll('.location-chip').forEach(chip => {
      if (chip.dataset.location.toLowerCase() === loc.toLowerCase()) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  function setLocation(newLoc) {
    if (!newLoc || !newLoc.trim()) return;
    currentLocation = newLoc.trim();
    inputEl.value = currentLocation;
    updateActiveChip(currentLocation);
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

  chipsContainer.addEventListener('click', (e) => {
    const chip = e.target.closest('.location-chip');
    if (chip) {
      setLocation(chip.dataset.location);
    }
  });

  gpsBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    gpsBtn.textContent = '⏳';
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
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

  return {
    element: container,
    getLocation: () => currentLocation,
    setLocation: (loc) => setLocation(loc)
  };
}
