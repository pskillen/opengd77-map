/** Scroll to an in-page section by element id (HashRouter-safe — no location hash). */

export function scrollToPageSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
