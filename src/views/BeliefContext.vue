<template>
  <div>
    <div v-if="reaction" class="context-block">
      <p class="context-label">Reaktion</p>
      <p class="context-text">{{ reaction }}</p>
    </div>
    <div v-if="feelings.length" class="context-block">
      <p class="context-label">Gefühle</p>
      <feeling-chips :items="feelings" type="feelings"></feeling-chips>
    </div>
    <div v-if="needs.length" class="context-block">
      <p class="context-label">Bedürfnisse</p>
      <feeling-chips :items="needs" type="needs"></feeling-chips>
    </div>
    <div v-if="origin" class="context-block">
      <p class="context-label">Ursprung</p>
      <p class="context-text">{{ origin }}</p>
    </div>
  </div>
</template>

<script>
import FeelingChips from '@/components/FeelingChips.vue';

// What the user already wrote, carried forward through the later steps of the
// wizard. One component so the blocks cannot drift apart from screen to screen.
export default {
  name: 'belief-context',
  components: { FeelingChips },
  props: {
    reaction: { type: String, default: '' },
    feelings: { type: Array, default: () => [] },
    needs: { type: Array, default: () => [] },
    origin: { type: String, default: '' },
  },
};
</script>

<style scoped lang="scss">
.context-block { margin-top: 14px; }
.context-label {
  font-size: 0.68rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  margin: 0 0 6px;
}
.context-text {
  font-size: 0.95rem;
  color: #ebebf5;
  line-height: 1.5;
  margin: 0;
}
</style>
