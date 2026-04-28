<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <p class="caption grey--text mb-1">{{ patternName }}</p>
      <h1 class="headline font-weight-regular">Ankündigen</h1>
      <p class="body-1 grey--text mt-2">Nenn dieses Muster öffentlich — jemandem, der relevant ist. Die Ankündigung selbst ist die Verpflichtung, nicht die Veränderung. Sie durchbricht die private Scham-Schleife.</p>
    </v-flex>
    <v-flex>
      <v-text-field
        label="Ich kündige an, dass…"
        placeholder="..."
        v-model="text"
        multi-line
        rows="4"
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  name: 'pattern-change-announce',
  props: {
    patternName: { type: String, default: '' },
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
</style>
