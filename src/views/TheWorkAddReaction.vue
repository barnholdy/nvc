<template>
  <v-layout column>
    <v-flex class="mt-2 mb-5">
      <h1 class="headline font-weight-regular">Reaktion</h1>
      <p class="body-1 grey--text mt-1">Wie fühlst du dich in der Situation?</p>
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
  name: 'the-work-add-reaction',
  components: { TagList },
  props: {
    availableFeelings: Array,
  },
};
</script>

<style scoped lang="scss">
</style>
