// One place for the crisis resource. It appears in the onboarding, in the
// settings and — conditionally — at the end of the origin arc, and those three
// must never drift apart or go stale independently.
//
// Verified 2026-08-03 against telefonseelsorge.de: 0800 111 0 111 and
// 0800 111 0 222, plus the European number 116 123. Free of charge, around the
// clock. German only — if the app ever ships beyond DE this needs to become
// locale-aware.
export const SUPPORT_RESOURCE = {
  name: 'Telefonseelsorge',
  phone: '0800 111 0 111',
  phoneHref: 'tel:08001110111',
  availability: 'rund um die Uhr, kostenlos',
  online: 'online.telefonseelsorge.de',
};

export function supportLine() {
  return `${SUPPORT_RESOURCE.name} · ${SUPPORT_RESOURCE.phone} · ${SUPPORT_RESOURCE.availability}`;
}
