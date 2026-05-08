<template>
  <v-layout column>
    <v-flex class="mt-2 mb-5">
      <h1 class="headline font-weight-regular">Bedürfnis</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}"</p>
      <p class="body-1 grey--text mt-2">Was brauchst du in der Situation?</p>
    </v-flex>
    <v-flex>
      <tag-list
        :items="availableNeeds"
        :isInteractive="true"
        :isFilterNameEnabled="true"
      ></tag-list>
    </v-flex>
  </v-layout>
</template>

<script>
import TagList from '@/components/TagList.vue';

export default {
  name: 'pattern-add-need',
  components: { TagList },
  props: {
    belief: String,
    availableNeeds: Array,
  },
};
</script>

<style scoped lang="scss">
.belief-quote {
  font-style: italic;
}
</style>
