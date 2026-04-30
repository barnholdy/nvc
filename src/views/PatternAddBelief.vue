<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Glaube / Urteil</h1>
      <p class="body-1 grey--text mt-2">Jedes Urteil ist auch ein Spiegel: Es zeigt was in dir gerade unerfüllt, verletzt oder ungehört ist. Wenn du dem Urteil mit Neugier statt mit Rechtfertigung begegnest, öffnet sich ein Raum, in dem du das eigentliche Gefühl und das dahinterliegende Bedürfnis erkennen kannst.</p>
    </v-flex>
    <v-flex>
      <v-text-field
        label="Ich glaube, dass..."
        placeholder="..."
        v-model="belief"
        single-line
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  name: 'pattern-add-belief',
  props: {
    initialValue: { type: String, default: '' },
  },
  data() {
    return { belief: this.initialValue };
  },
  watch: {
    belief(val) { this.$emit('beliefChanged', val); },
  },
};
</script>

<style scoped lang="scss">
</style>
