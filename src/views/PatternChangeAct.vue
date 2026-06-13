<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Handeln</h1>
      <template v-if="withoutBelief">
        <p class="body-1 belief-quote mt-1">„{{ withoutBelief }}"</p>
        <div v-if="withoutBeliefFeelings && withoutBeliefFeelings.length" class="mb-2">
          <tag-list :items="withoutBeliefFeelings"></tag-list>
        </div>
      </template>
      <p class="body-1 grey--text mt-2">Eine einzelne Gegenhandlung ist eine Ausnahme. Fünf beginnen, eine neue Spur zu legen und signalisieren, dass sich wirklich etwas verändert hat. Manifestiere deine neue Perspektive und Gefühle, indem du fünf konkrete Gegenhandlungen aufschreibst und umsetzt.</p>
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
import TagList from '@/components/TagList.vue';

export default {
  name: 'pattern-change-act',
  components: { TagList },
  props: {
    belief: { type: String, default: '' },
    withoutBelief: { type: String, default: '' },
    withoutBeliefFeelings: { type: Array, default: function() { return []; } },
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
