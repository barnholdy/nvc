<template>
  <button :style="saveButtonStyle" @click="clicked"><slot></slot></button>
</template>

<script>
export default {
  name: 'ButtonProgress',
  props: {
    progress: Number,
  },
  computed: {
    saveButtonStyle() {
      return {
        'background-size': `${100 - this.progress}%`,
      };
    },
  },
  methods: {
    clicked() {
      this.$emit('click');
    },
  },
};
</script>

<style scoped lang="scss">
button {
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=);
  background-repeat: no-repeat;
  background-size: 100%;
  background-color: #E8FFF2;
  background-position: right;
}
</style>
