<template>
  <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path :d="path" fill="currentColor"></path>
  </svg>
</template>

<script>
// The bottom bar wants icons the Material Icons font does not have, so these
// come from Material Design Icons as bare path data — strings rather than
// another font file.
import {
  mdiViewDashboard, mdiHistory, mdiVanish, mdiFlask, mdiBookOpenPageVariant,
} from '@mdi/js';

const PATHS = {
  now: mdiViewDashboard,
  patterns: mdiHistory,
  beliefs: mdiVanish,
  actions: mdiFlask,
  journal: mdiBookOpenPageVariant,
};

export default {
  name: 'nav-icon',
  props: {
    name: { type: String, required: true },
  },
  computed: {
    path() { return PATHS[this.name] || ''; },
  },
};
</script>

<style scoped>
/* Matches the 24px box of the v-icon glyphs it replaces, so the bar keeps its
   rhythm. */
.nav-icon {
  width: 24px;
  height: 24px;
  display: block;
}
</style>
