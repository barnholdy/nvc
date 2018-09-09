<template>
  <router-link :to="to" tag="button" class="button"><slot></slot></router-link>
</template>

<script>
export default {
  name: 'RouterButton',
  props: {
    to: String,
  },
};
</script>

<style scoped lang="scss">
.button {
  margin: .5rem .25rem 1rem .25rem;
  height: 2rem;
  border-color: #2c3e50;
  color: #2c3e50;
  background-color: white;
  border: solid .05rem;
  font-size: 1rem;
}
.button[disabled] {
  border-color: #ccc;
  color: #ccc;
}
</style>
