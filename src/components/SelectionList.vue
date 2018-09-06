<template>
  <ul class="selection-list">
    <li v-for="selection in selectionListSorted" v-bind:key="selection">
      <span>{{ selection }}</span>
      <button class="remove-button" @click="removeSelection(selection)">-</button>
    </li>
  </ul>
</template>

<script>
import { uniq } from 'lodash';

export default {
  name: 'SelectionList',
  props: {
    selectionList: Array,
  },
  computed: {
    selectionListSorted() {
      return uniq(this.selectionList).sort();
    },
  },
  methods: {
    removeSelection(selection) {
      this.$emit('selectionRemoved', selection);
    },
  },
};
</script>

<style scoped lang="scss">
.selection-list {
  text-align: left;
  .remove-button {
    margin-left: .5rem;
  }
}
</style>
