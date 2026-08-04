<template>
  <p><span
    v-for="(seg, i) in segments"
    :key="i"
    :style="seg.color ? { color: seg.color, fontWeight: 600 } : null"
  >{{ seg.text }}</span></p>
</template>

<script>
import { colorForFeeling, dedupeByName, joinNames } from '@/utils/emotions';

// Feelings named inside a sentence, each in its Grundemotion's colour. The
// whole line is built in JS: with coloured spans between words, the template's
// whitespace handling would eat the spaces around them.
export default {
  name: 'feeling-words',
  props: {
    feelings: { type: Array, default: function() { return []; } },
    prefix: { type: String, default: '' },
    suffix: { type: String, default: '' },
    // Used when there are no feelings to name.
    fallback: { type: String, default: '' },
  },
  computed: {
    items: function() {
      return dedupeByName(this.feelings).filter(function(f) { return f && f.name; });
    },
    segments: function() {
      if (!this.items.length) return this.fallback ? [{ text: this.fallback }] : [];
      var parts = this.prefix ? [{ text: this.prefix }] : [];
      var last = this.items.length - 1;
      this.items.forEach(function(f, i) {
        parts.push({ text: f.name, color: colorForFeeling(f.name) });
        if (i < last - 1) parts.push({ text: ', ' });
        else if (i === last - 1) parts.push({ text: ' und ' });
      });
      if (this.suffix) parts.push({ text: this.suffix });
      return parts;
    },
    // Exposed so a parent can tell whether anything will be rendered.
    joined: function() {
      return joinNames(this.items.map(function(f) { return f.name; }));
    },
  },
};
</script>

<style scoped lang="scss">
p { margin: 0; }
</style>
