/**
 * District Matcher
 *
 * Compares the alert's affected district with the user's district.
 * Handles case differences and basic normalization.
 *
 * Designed so that Person 6's location module can later supply
 * normalized location objects: { name, district, state, latitude, longitude }
 */

/**
 * Check if an alert's district matches the user's district.
 *
 * @param {string} alertDistrict - District from the IMD alert
 * @param {string} userDistrict  - District from the user's location
 * @returns {boolean}
 */
function matchesDistrict(alertDistrict, userDistrict) {
  if (!alertDistrict || !userDistrict) {
    return false;
  }

  if (typeof alertDistrict !== 'string' || typeof userDistrict !== 'string') {
    return false;
  }

  const normalize = (str) => str.trim().toLowerCase().replace(/\s+/g, ' ');

  return normalize(alertDistrict) === normalize(userDistrict);
}

module.exports = { matchesDistrict };
