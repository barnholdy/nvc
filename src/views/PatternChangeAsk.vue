<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Um Hilfe bitten</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}"</p>
      <p class="body-1 grey--text mt-2">Bitte andere um Hilfe. Das Fragen durchbricht die Isolation, die Muster aufrechthält. Die meisten Muster bestehen im Verborgenen — andere einzuladen verändert das relationale Feld.</p>
    </v-flex>
    <v-flex>
      <v-text-field
        label="Ich bitte… um Unterstützung dabei, …"
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
  name: 'pattern-change-ask',
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
.belief-quote {
  font-style: italic;
}
</style>
