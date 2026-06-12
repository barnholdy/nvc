<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Ursprung im Elternhaus</h1>
      <p class="subheading grey--text resentment-quote mt-1">„{{ resentment }}"</p>
      <p class="body-1 grey--text mt-2">Wie bezieht dieser Groll sich auf etwas, das deine Eltern nicht bieten konnten?</p>
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
  name: 'resentment-add-parents',
  props: {
    resentment: { type: String, default: '' },
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
.resentment-quote {
  font-style: italic;
}
</style>
