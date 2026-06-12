<template>
  <v-layout column>
    <v-flex class="mt-2 mb-5">
      <h1 class="headline font-weight-regular">Gefühl</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}"</p>
      <p class="body-1 grey--text mt-2">Was fühlst du, wenn der Glaube wahr ist?</p>
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
  name: 'belief-add-feeling',
  components: { TagList },
  props: {
    belief: { type: String, default: '' },
    availableFeelings: Array,
  },
};
</script>

<style scoped lang="scss">
.belief-quote {
  font-style: italic;
}
</style>
