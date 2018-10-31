<template>
  <v-layout column transition="slide-x-reverse-transition">
    <v-flex class="mt-2 mb-5">
      <h1 class="headline font-weight-regular">Wie fühlst du dich in der Situation?</h1>
    </v-flex>

    <v-flex>
      <tag-list
        :items="availableFeelings"
        :isInteractive="true"
        :isFilterNameEnabled="true"
        :isFilterValenceEnabled="true"
      ></tag-list>
    </v-flex>
    <!--
    <v-flex>
      <v-btn
        :disabled="!isComplete"
        @click="reset"
        block large color="secondary">
        zurücksetzen
      </v-btn>
    </v-flex>
    -->
  </v-layout>
</template>

<script>
import TagList from '@/components/TagList.vue';

export default {
  name: 'check-in-add-feeling',
  components: {
    TagList,
  },
  props: {
    availableFeelings: Array,
    isComplete: Boolean,
  },
  methods: {
    reset() {
      this.$emit('reset');
    },
  },
};
</script>

<style scoped lang="scss">
</style>
