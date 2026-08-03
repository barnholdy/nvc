<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Überzeugung</h1>
      <p class="body-1 grey--text mt-2">Was ist deine Überzeugung, die du für wahr hältst?</p>
    </v-flex>
    <v-flex>
      <!-- Same size as the affirmation field: a belief is a sentence, not a
           label, and the box should say so. -->
      <v-textarea
        placeholder="..."
        v-model="belief"
        auto-grow
        rows="4"
        hide-details
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-textarea>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  name: 'belief-add-belief',
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
