/**
 * dateTime utility
 * Provides a consistently formatted "Day, DD Month YYYY" string
 * used across the Header and Splash Screen.
 */

export function getFormattedDate(date = new Date()) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Keeps a target element's textContent in sync with the current date.
 * Checks once a minute and updates only when the date actually changes,
 * so it stays correct if the app is left open past midnight.
 * Returns a cleanup function to clear the interval.
 */
export function bindLiveDate(el) {
  if (!el) return () => {};

  let lastRendered = '';

  const render = () => {
    const formatted = getFormattedDate();
    if (formatted !== lastRendered) {
      lastRendered = formatted;
      el.textContent = formatted;
    }
  };

  render();
  const intervalId = setInterval(render, 60 * 1000);

  return () => clearInterval(intervalId);
}
