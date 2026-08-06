// GitHub Pages serves index.html with a cache lifetime we cannot set, and the
// app has no service worker. So a browser can keep showing a build for as long
// as it holds that one file — the hashed bundles it points at are all still
// there, so nothing fails, it just stays old.
//
// The fix is to ask: the running bundle knows the stamp it was built with, and
// build.json says what the server has now. If they differ, a newer deploy
// exists and the page reloads under a URL the cache has never seen.

const FLAG = 'nvc.buildReload';

// The baked-in stamp of the bundle that is running right now.
export const RUNNING_BUILD = process.env.VUE_APP_BUILD || '';

// A URL the HTTP cache cannot have an entry for, so index.html is re-fetched.
// The hash is kept so a reload does not throw the user back to the first route.
export function bustingUrl() {
  return `${window.location.pathname}?v=${Date.now()}${window.location.hash}`;
}

export function reloadFresh() {
  window.location.replace(bustingUrl());
}

// What the server currently has. Null when it cannot be read — offline, or an
// older deploy that predates build.json. Never throws: a failed check must
// leave the app alone, not break its start.
export async function fetchDeployedBuild() {
  try {
    const url = `${process.env.BASE_URL || '/'}build.json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data && typeof data.build === 'string' ? data.build : null;
  } catch (e) {
    return null;
  }
}

// Reload once when the server has a newer build than the one running.
//
// The guard is the important part: it remembers which stamp it already
// reloaded for, so a mismatch that a reload cannot fix — a half-finished
// deploy, a proxy pinning the old page — costs one reload rather than
// looping forever. A stale app is a nuisance; a reload loop is a brick.
export async function reloadIfStale() {
  if (process.env.NODE_ENV !== 'production' || !RUNNING_BUILD) return false;

  const deployed = await fetchDeployedBuild();
  if (!deployed || deployed === RUNNING_BUILD) return false;

  try {
    if (sessionStorage.getItem(FLAG) === deployed) return false;
    sessionStorage.setItem(FLAG, deployed);
  } catch (e) {
    // Private mode: without somewhere to remember the attempt there is no way
    // to bound the loop, so do nothing rather than risk one.
    return false;
  }

  reloadFresh();
  return true;
}
