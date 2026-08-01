<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Situation</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}"</p>
      <p class="body-1 grey--text mt-2">
        In welcher konkreten Situation in den nächsten Tagen könntest du dich so verhalten,
        als würde diese Überzeugung nicht gelten? Wo, mit wem, wann?
      </p>
    </v-flex>
    <v-flex>
      <v-text-field
        placeholder="..."
        v-model="text"
        multi-line
        rows="6"
        hide-details
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
      <p class="constraint-text mt-2">
        Klein, konkret, überprüfbar — ein Moment, kein Lebensthema.
      </p>
      <p v-if="isVague" class="follow-up-text">
        Nenne einen einzelnen Moment mit Ort und Person.
      </p>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  name: 'belief-act-situation',
  props: {
    belief: { type: String, default: '' },
    initialValue: { type: String, default: '' },
  },
  data() {
    return { text: this.initialValue };
  },
  computed: {
    isVague() {
      const t = this.text.trim();
      return t.length > 0 && (t.length < 25 || t.indexOf(' ') === -1);
    },
  },
  watch: {
    text(val) { this.$emit('changed', val); },
  },
};
</script>

<style scoped lang="scss">
.belief-quote { font-style: italic; }
.constraint-text {
  font-size: 0.8rem;
  color: #8e8e93;
  line-height: 1.5;
  margin: 0;
}
.follow-up-text {
  font-size: 0.8rem;
  color: #fd9927;
  line-height: 1.5;
  margin: 4px 0 0;
}
</style>
