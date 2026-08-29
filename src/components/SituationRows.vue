<template>
  <div class="card">
    <div v-for="p in situations" :key="p.time" class="situation-row">
      <p class="situation-text">{{ p.fact }}</p>
    </div>
  </div>
</template>

<script>
// Read-only list of the situations a belief appeared in, set apart from each
// other the same way the belief detail view separates its linked ones.
export default {
  name: 'situation-rows',
  props: {
    situations: { type: Array, default: function() { return []; } },
  },
};
</script>

<style scoped lang="scss">
.situation-row {
  padding: 10px 0;
  border-top: 1px solid var(--border-subtle);
  &:first-of-type { border-top: none; padding-top: 0; }
  &:last-of-type { padding-bottom: 0; }
}
.situation-text {
  font-size: 0.95rem;
  color: var(--text-primary);
  line-height: 1.5;
  margin: 0;
}
</style>
