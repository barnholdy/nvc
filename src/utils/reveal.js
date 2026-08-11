// Jumping from one list to another only helps if the row you came for is
// actually open and on screen when you arrive. Every list does that the same
// way: the link carries `?open=<id>`, the list unfolds that row — switching to
// whichever tab holds it — and scrolls it into view.

// Rows are marked with data-row-id so the list can find one after Vue has
// rendered it, without the index games the swipe handlers already play.
export const ROW_ATTR = 'data-row-id';

export function openQuery(id, opts) {
  const query = { open: String(id) };
  if (opts && opts.top) query.top = '1';
  return query;
}

// The id this route asks to be opened, or null. Always a string: it comes back
// from the URL that way, and belief/experiment ids are numbers.
export function requestedId(route) {
  const value = route && route.query && route.query.open;
  return typeof value === 'string' && value ? value : null;
}

// Centred rather than at the top edge: a row that lands under the toolbar or
// right above the bottom nav reads as "not found" even though it is there.
export function scrollRowIntoView(root, id) {
  if (!root || !id) return false;
  const el = root.querySelector(`[${ROW_ATTR}="${CSS.escape(String(id))}"]`);
  if (!el) return false;
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  return true;
}

// Flush against the top edge instead — for a jump where the row itself is the
// destination (a chip that names exactly one belief), not a hit to locate in
// a longer list. Offset by the sticky header's own height, which floats at
// the same coordinate the row would otherwise land under.
export function scrollRowToTop(root, id) {
  if (!root || !id) return false;
  const el = root.querySelector(`[${ROW_ATTR}="${CSS.escape(String(id))}"]`);
  if (!el) return false;
  const header = root.querySelector('.screen-header');
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const delta = el.getBoundingClientRect().top - headerHeight;
  window.scrollBy({ top: delta, behavior: 'smooth' });
  return true;
}
