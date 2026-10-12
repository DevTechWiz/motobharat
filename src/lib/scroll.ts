// Single place for programmatic scroll-tops (logo / footer brand links).
// Native smooth scroll only — no virtual-scroll driver (Lenis was removed:
// it desynced from the native position and stuck mid-page).
export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
