<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Name</h1>
      <p class="body-1 grey--text mt-1">Wie möchtest du diesen Eintrag nennen?</p>
    </v-flex>
    <v-flex>
      <v-text-field
        label="z.B. „Kritik von meinem Chef""
        placeholder="..."
        v-model="text"
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  name: 'the-work-add-name',
  props: {
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
