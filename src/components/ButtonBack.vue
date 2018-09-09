<template>
  <router-link :to="to" class="button-back">&#8249;</router-link>
</template>

<script>
export default {
  name: 'ButtonBack',
  props: {
    to: String,
  },
};
</script>

<style scoped lang="scss">
.button-back {
  width: 3rem;
  height: 3rem;
  display: inline-block;
  color: initial;
  text-decoration: none;
  font-size: 1.8rem;
  line-height: 3rem;
}
</style>
