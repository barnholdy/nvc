<template>
  <div class="feeling-chips" :class="{ flat: flat }">
    <div v-for="group in groups" :key="group.id || 'unknown'" class="chip-group">
      <span
        v-if="group.label && !flat"
        class="group-label"
        :style="{ color: groupColor(group.id) }"
      >
        {{ group.label }}
      </span>
      <div class="chip-row">
        <span
          v-for="(item, i) in group.items"
          :key="i"
          class="feeling-chip"
          :style="{ color: chipColor(item.name), borderColor: chipColor(item.name) }"
        >{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import {
  colorForFeeling,
  dedupeByName,
  emotionColor,
  emotionIdForFeeling,
  emotionLabel,
  EMOTION_ORDER,
} from '@/utils/emotions';
import {
  colorForNeed,
  categoryIdForNeed,
  needCategories,
  needCategoryColor,
  needCategoryLabel,
  sortNeeds,
} from '@/utils/needs';

// Read-only display of feelings or needs, styled exactly like the chips in the
// selection menu so the two never drift apart. Both are grouped under their top
// category — Grundemotion for feelings, Grundkategorie for needs — in the
// taxonomy's own order, so a row of chips reads the way it was put together.
export default {
  name: 'feeling-chips',
  props: {
    // Drops the Grundemotion / Grundkategorie headings. The words keep their
    // colours, so the grouping is still legible without being spelled out —
    // in a card the headings cost more room than they earn.
    flat: { type: Boolean, default: false },
    items: { type: Array, default: function() { return []; } },
    type: { type: String, default: 'feelings' },
  },
  computed: {
    // A belief carries one need, but older ones can hold several; show each once.
    uniqueItems: function() {
      return dedupeByName(this.items);
    },
    isNeeds: function() {
      return this.type === 'needs';
    },
    groups: function() {
      if (this.isNeeds) return this.needGroups;

      var buckets = {};
      var keys = [];
      this.uniqueItems.forEach(function(item) {
        // Stored feelings carry their Grundemotion; older ones are looked up.
        var id = item.emotionId || emotionIdForFeeling(item.name) || null;
        var key = id || 'unknown';
        if (!buckets[key]) {
          buckets[key] = { id: id, label: id ? emotionLabel(id) : '', items: [] };
          keys.push(key);
        }
        buckets[key].items.push(item);
      });

      return keys
        .map(function(key) { return buckets[key]; })
        .sort(function(a, b) {
          // Anything outside the taxonomy goes last.
          var ia = a.id ? EMOTION_ORDER.indexOf(a.id) : EMOTION_ORDER.length;
          var ib = b.id ? EMOTION_ORDER.indexOf(b.id) : EMOTION_ORDER.length;
          return ia - ib;
        });
    },
    needGroups: function() {
      var order = needCategories.map(function(c) { return c.id; });
      var buckets = {};
      var keys = [];
      sortNeeds(this.uniqueItems).forEach(function(item) {
        var id = categoryIdForNeed(item.name);
        var key = id || 'unknown';
        if (!buckets[key]) {
          buckets[key] = { id: id, label: id ? needCategoryLabel(id) : '', items: [] };
          keys.push(key);
        }
        buckets[key].items.push(item);
      });
      return keys.map(function(key) { return buckets[key]; }).sort(function(a, b) {
        var ia = a.id ? order.indexOf(a.id) : order.length;
        var ib = b.id ? order.indexOf(b.id) : order.length;
        return ia - ib;
      });
    },
  },
  methods: {
    chipColor: function(name) {
      return this.isNeeds ? colorForNeed(name) : colorForFeeling(name);
    },
    groupColor: function(id) {
      return this.isNeeds ? needCategoryColor(id) : emotionColor(id);
    },
  },
};
</script>

<style scoped lang="scss">
.chip-group + .chip-group { margin-top: 8px; }
/* Without the headings the groups have nothing to separate, so the words run
   on as one wrapped line. */
.feeling-chips.flat {
  display: flex;
  flex-wrap: wrap;
  .chip-group + .chip-group { margin-top: 0; }
}
.group-label {
  display: block;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: 600;
  margin-bottom: 3px;
}
.chip-row { display: flex; flex-wrap: wrap; }
.feeling-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 11px;
  border: 1px solid currentColor;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 500;
  margin: 3px 4px 3px 0;
}
</style>
