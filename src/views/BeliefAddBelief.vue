<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Glaube / Urteil</h1>
      <p class="body-1 grey--text mt-2">Was glaubst du, dass wahr ist? Hast du ein Urteil?</p>
    </v-flex>
    <v-flex>
      <v-text-field
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
