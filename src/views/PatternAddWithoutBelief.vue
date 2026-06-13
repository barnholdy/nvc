<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Neue Perspektive</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}"</p>
      <p class="body-1 grey--text mt-2">{{ descriptionText }}</p>
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
    <template v-if="availableFeelings && availableFeelings.length">
      <v-flex class="mt-4 mb-2">
        <p class="body-1 grey--text">Wie würdest du dich fühlen?</p>
      </v-flex>
      <v-flex>
        <tag-list
          :items="availableFeelings"
          :isInteractive="true"
          :isFilterNameEnabled="true"
          :isFilterValenceEnabled="true"
        ></tag-list>
      </v-flex>
    </template>
  </v-layout>
</template>

<script>
import TagList from '@/components/TagList.vue';

export default {
  name: 'pattern-add-without-belief',
  components: { TagList },
  props: {
    belief: { type: String, default: '' },
    initialValue: { type: String, default: '' },
    needs: { type: Array, default: function() { return []; } },
    availableFeelings: { type: Array, default: null },
  },
  computed: {
    needsText() {
      var selected = (this.needs || []).filter(function(n) { return n.isSelected; });
      return selected.map(function(n) { return n.name; }).join(', ');
    },
    descriptionText() {
      if (this.needsText) {
        return 'Stell dir vor, deine Bedürfnisse nach ' + this.needsText + ' wären erfüllt und du könntest den Gedanken nicht denken. Wer wärst du ohne diesen Glauben?';
      }
      return 'Stell dir vor, du könntest den Gedanken nicht denken. Wer wärst du ohne diesen Glauben?';
    },
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
