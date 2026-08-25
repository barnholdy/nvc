// A chosen chip should be the first thing the row shows, not something the
// eye has to hunt for halfway along: selecting one scrolls it to the row's
// left edge. A chip near the end can only come as far as the row's own
// scrolling allows — there is no content left behind it to scroll past.
export function alignPill(btn) {
  if (!btn || !btn.closest) return;
  const row = btn.closest('.pill-row');
  if (!row || !row.scrollTo) return;
  const pad = parseFloat(getComputedStyle(row).paddingLeft) || 0;
  const left = (btn.getBoundingClientRect().left - row.getBoundingClientRect().left)
    + row.scrollLeft - pad;
  row.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
}

export default alignPill;
