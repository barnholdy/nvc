<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <p class="caption grey--text mb-1">{{ patternName }}</p>
      <h1 class="headline font-weight-regular">Entschuldigen</h1>
      <p class="body-1 grey--text mt-2">Nicht aus Scham, sondern aufrecht. Eine aufrechte Entschuldigung erkennt die Auswirkung an, ohne in Selbstbestrafung zu verfallen — das macht sie wirksam.</p>
    </v-flex>
    <v-flex>
      <v-text-field
        label="Ich entschuldige mich bei… dafür, dass…"
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
  name: 'pattern-change-apologize',
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
