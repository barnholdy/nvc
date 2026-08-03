<template>
  <div class="feeling-chips">
    <div v-for="group in groups" :key="group.id || 'unknown'" class="chip-group">
      <span v-if="group.label" class="group-label" :style="{ color: emotionColor(group.id) }">
        {{ group.label }}
      </span>
      <div class="chip-row">
        <span
          v-for="(item, i) in group.items"
          :key="i"
          class="feeling-chip"
          :style="{ backgroundColor: chipColor(item.name), color: '#000' }"
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
  NEED_COLOR,
} from '@/utils/emotions';

// Read-only display of feelings or needs, styled exactly like the chips in the
// selection menu so the two never drift apart. Feelings are grouped under their
// Grundemotion, in the taxonomy's own order, so a row of chips reads the same
// way it was put together.
export default {
  name: 'feeling-chips',
  props: {
    items: { type: Array, default: function() { return []; } },
    type: { type: String, default: 'feelings' },
  },
  computed: {
    // A need can be chosen once per Grundemotion; show it once here.
    uniqueItems: function() {
      return dedupeByName(this.items);
    },
    isNeeds: function() {
      return this.type === 'needs';
    },
    groups: function() {
      // Needs are ochre wherever they sit, so grouping them by Grundemotion
      // would draw a line nothing else in the app follows.
      if (this.isNeeds) return [{ id: null, label: '', items: this.uniqueItems }];

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
  },
  methods: {
    chipColor: function(name) {
      return this.isNeeds ? NEED_COLOR : colorForFeeling(name);
    },
    emotionColor: function(id) {
      return emotionColor(id);
    },
  },
};
</script>

<style scoped lang="scss">
.chip-group + .chip-group { margin-top: 8px; }
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
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 500;
  margin: 3px 4px 3px 0;
}
</style>
