<template>
  <component :is="tag"><span
    v-for="(seg, i) in segments"
    :key="i"
    :style="seg.color ? { color: seg.color, fontWeight: 600 } : null"
  >{{ seg.text }}</span></component>
</template>

<script>
import { dedupeByName } from '@/utils/emotions';
import { colorForNeed, sortNeeds } from '@/utils/needs';

// Needs named inside a sentence, each in its Grundkategorie's colour — the
// Bedürfnis counterpart of FeelingWords.vue, same reasons for existing: the
// line is built in JS so the coloured spans keep their surrounding spaces,
// and the taxonomy's own order keeps needs from one Grundkategorie together.
export default {
  name: 'need-words',
  props: {
    // 'span' lets two of these stand side by side inside one sentence; the
    // default keeps every existing use rendering as its own paragraph.
    tag: { type: String, default: 'p' },
    needs: { type: Array, default: function() { return []; } },
    prefix: { type: String, default: '' },
    suffix: { type: String, default: '' },
    // Used when there are no needs to name.
    fallback: { type: String, default: '' },
  },
  computed: {
    items: function() {
      return sortNeeds(dedupeByName(this.needs).filter(function(n) { return n && n.name; }));
    },
    segments: function() {
      if (!this.items.length) return this.fallback ? [{ text: this.fallback }] : [];
      var parts = this.prefix ? [{ text: this.prefix }] : [];
      var last = this.items.length - 1;
      this.items.forEach(function(n, i) {
        parts.push({ text: n.name, color: colorForNeed(n.name) });
        if (i < last - 1) parts.push({ text: ', ' });
        else if (i === last - 1) parts.push({ text: ' und ' });
      });
      if (this.suffix) parts.push({ text: this.suffix });
      return parts;
    },
  },
};
</script>
