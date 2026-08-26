// A chosen chip should be the first thing the row shows, not something the
// eye has to hunt for halfway along: selecting one scrolls it to the row's
// left edge.
//
// It goes no further than the row's own content, though: the last chip comes
// to rest against the right edge, with the row's padding beside it, rather
// than being dragged along by empty space.
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
