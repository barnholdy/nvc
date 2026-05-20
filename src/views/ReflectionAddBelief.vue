<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Zugrundeliegender Glaubenssatz</h1>
      <p class="subheading grey--text fear-quote mt-1">„{{ fear }}"</p>
      <p class="body-1 grey--text mt-2">Was glaubst du über dich selbst, das diese Angst antreibt?</p>
    </v-flex>
    <v-flex>
      <v-text-field
        placeholder="..."
        v-model="text"
        multi-line
        rows="8"
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  name: 'reflection-add-belief',
  props: {
    fear: { type: String, default: '' },
    initialValue: { type: String, default: '' },
  },
  data() {
    return { text: this.initialValue };
  },
  watch: {
    text(val) { this.$emit('changed', val); },
  },
};
</script>

<style scoped lang="scss">
.fear-quote {
  font-style: italic;
}
</style>
