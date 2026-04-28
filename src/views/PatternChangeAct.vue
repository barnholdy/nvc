<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <p class="caption grey--text mb-1">{{ patternName }}</p>
      <h1 class="headline font-weight-regular">Handeln</h1>
      <p class="body-1 grey--text mt-2">Eine einzelne Gegenhandlung ist eine Ausnahme. Fünf beginnen, eine neue Spur zu legen — genug Wiederholung, um dir und anderen zu signalisieren, dass sich wirklich etwas verändert hat. Schreibe fünf konkrete Gegenhandlungen auf.</p>
    </v-flex>
    <v-flex>
      <v-text-field
        label="Ich werde…"
        placeholder="..."
        v-model="text"
        multi-line
        rows="5"
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  name: 'pattern-change-act',
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
