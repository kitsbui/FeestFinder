/**
 * Glass that answers the pointer: every `.ff-spot` card gets --mx/--my at the pointer's
 * position and the theme (festfinder-frontend/ui/theme.css) draws a soft light and a
 * brighter rim there. One delegated listener for the whole page, installed once.
 */
let installed = false;

export function trackSpotlights(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  document.addEventListener(
    'pointermove',
    (e) => {
      const el = (e.target as Element | null)?.closest?.('.ff-spot') as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    },
    { passive: true },
  );
}
