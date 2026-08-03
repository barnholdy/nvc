<template>
  <div>
    <div v-if="fear" class="recall-block">
      <p class="expand-label">Das hattest du befürchtet</p>
      <p class="recall-text">{{ fear }}</p>
      <p v-if="belief" class="recall-belief">„{{ belief }}“</p>
    </div>

    <div v-if="outcome" class="recall-block">
      <p class="expand-label">Das ist passiert</p>
      <p class="recall-text">{{ outcome }}</p>
    </div>
  </div>
</template>

<script>
// The three later steps of the result wizard all look back at the same things.
// One component so they cannot drift apart.
export default {
  name: 'experiment-recall',
  props: {
    belief: { type: String, default: '' },
    fear: { type: String, default: '' },
    outcome: { type: String, default: '' },
  },
};
</script>

<style scoped lang="scss">
.recall-block { margin-bottom: 16px; }
.expand-label {
  font-size: 0.68rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 6px;
  font-weight: 600;
}
.recall-text {
  font-size: 0.95rem;
  color: #ebebf5;
  line-height: 1.5;
  margin: 0;
}
.recall-belief {
  font-size: 0.95rem;
  color: #8e8e93;
  font-style: italic;
  line-height: 1.5;
  margin: 4px 0 0;
}
</style>
