<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Ursprung</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}“</p>
      <p class="body-1 white--text mt-3">
        Wann hast du diese Überzeugung zum ersten Mal gelernt? Welche frühere Erfahrung hat sie
        plausibel gemacht?
      </p>
    </v-flex>
    <v-flex>
      <v-text-field
        placeholder="So viel oder so wenig, wie du magst. Ein Stichwort reicht."
        v-model="text"
        multi-line
        rows="6"
        hide-details
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
      <p class="field-hint mt-2">So viel oder so wenig, wie du magst. Ein Stichwort reicht.</p>
    </v-flex>
  </v-layout>
</template>

<script>
// Titration is the point: an empty field still moves on. What the third
// sub-question used to ask — what the belief brought you — gets its own screen
// now, where it can be answered by tapping instead of writing.
export default {
  name: 'belief-add-origin',
  props: {
    belief: { type: String, default: '' },
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
.belief-quote { font-style: italic; }
.field-hint {
  font-size: 0.875rem;
  color: #8e8e93;
  line-height: 1.5;
  margin: 0;
}
</style>
