<template>
  <v-layout column>
    <v-flex class="mt-2 mb-5">
      <h1 class="headline font-weight-regular">Gefühl</h1>
      <p class="body-1 grey--text mt-1">Jedes Urteil ist auch ein Spiegel: Es zeigt was in dir gerade unerfüllt, verletzt oder ungehört ist. Wenn du dem Urteil mit Neugier statt mit Rechtfertigung begegnest, öffnet sich ein Raum, in dem du das eigentliche Gefühl und das dahinterliegende Bedürfnis erkennen kannst.</p>
      <p class="body-1 grey--text mt-2">Was fühlst du, wenn der Glaube wahr ist? Was müsstest du fühlen, wenn du den Glauben nicht glauben könntest?</p>
    </v-flex>
    <v-flex>
      <tag-list
        :items="availableFeelings"
        :isInteractive="true"
        :isFilterNameEnabled="true"
        :isFilterValenceEnabled="true"
      ></tag-list>
    </v-flex>
  </v-layout>
</template>

<script>
import TagList from '@/components/TagList.vue';

export default {
  name: 'pattern-add-reaction',
  components: { TagList },
  props: {
    availableFeelings: Array,
  },
};
</script>

<style scoped lang="scss">
</style>
