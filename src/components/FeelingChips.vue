<template>
  <div class="feeling-chips">
    <span
      v-for="(item, i) in items"
      :key="i"
      class="feeling-chip"
      :style="{ backgroundColor: chipColor(item.name), color: '#000' }"
    >{{ item.name }}</span>
  </div>
</template>

<script>
import { colorForFeeling, NEED_COLOR } from '@/utils/emotions';

// Read-only display of feelings or needs, styled exactly like the chips in the
// feeling selection menu so the two never drift apart.
export default {
  name: 'feeling-chips',
  props: {
    items: { type: Array, default: function() { return []; } },
    type: { type: String, default: 'feelings' },
  },
  methods: {
    chipColor: function(name) {
      return this.type === 'needs' ? NEED_COLOR : colorForFeeling(name);
    },
  },
};
</script>

<style scoped lang="scss">
.feeling-chips { display: flex; flex-wrap: wrap; }
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
