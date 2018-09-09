<template>
  <router-link :to="to" class="button-add">+</router-link>
</template>

<script>
export default {
  name: 'ButtonAdd',
  props: {
    to: String,
  },
};
</script>

<style scoped lang="scss">
.button-add {
  width: 3rem;
  height: 3rem;
  display: inline-block;
  color: initial;
  text-decoration: none;
  font-size: 1.7rem;
  line-height: 3rem;
}
</style>
