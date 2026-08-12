<template>
  <div v-if="fear || outcome" class="card">
    <div v-if="fear" class="detail-row">
      <span class="detail-label">Befürchtung</span>
      <p class="detail-value open">{{ fear }}</p>
    </div>
    <div v-if="outcome" class="detail-row">
      <span class="detail-label">Passiert</span>
      <p class="detail-value open">{{ outcome }}</p>
    </div>
  </div>
</template>

<script>
// The three later steps of the result wizard all look back at the same things.
// One component so they cannot drift apart. Same card and detail-row language
// the belief cards use — always unfolded here, since re-reading both is the
// whole point of these steps.
export default {
  name: 'experiment-recall',
  props: {
    fear: { type: String, default: '' },
    outcome: { type: String, default: '' },
  },
};
</script>

<style scoped lang="scss">
.detail-row {
  display: block;
  cursor: default;
  &:active { opacity: 1; }
}
.detail-row .detail-label { display: block; margin-bottom: 6px; }
</style>
