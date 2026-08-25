// A chosen chip should be the first thing the row shows, not something the
// eye has to hunt for halfway along: selecting one scrolls it to the row's
// left edge.
//
// The last chips in a row could not do that on their own — a scroller stops
// when its content ends, leaving a selection near the end stranded somewhere
// in the middle. So the row is given exactly as much empty space behind its
// last chip as that chip needs to reach the left edge, and no more.
export function alignPill(btn) {
  if (!btn || !btn.closest) return;
  const row = btn.closest('.pill-row');
  if (!row || !row.scrollTo) return;
  const pad = parseFloat(getComputedStyle(row).paddingLeft) || 0;
  const pills = row.querySelectorAll('.pill');
  const last = pills[pills.length - 1];
  if (last) {
    const tail = row.clientWidth - pad - last.getBoundingClientRect().width;
    row.style.setProperty('--pill-tail', `${Math.max(0, Math.round(tail))}px`);
  }
  const left = (btn.getBoundingClientRect().left - row.getBoundingClientRect().left)
    + row.scrollLeft - pad;
  row.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
}

export default alignPill;
