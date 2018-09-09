<template>
  <div class="tag-list">
    <input
      v-show="isInteractive"
      v-model="filterText"
      type="search"
      placeholder="suchen..."
      class="filter" />
    <br />
    <tag
      v-for="(item, index) in items"
      :key="index"
      :color="getColorForItem(item)"
      :isActive="!!item.isSelected || !isInteractive"
      v-show="!item.isFiltered"
      @click="toggleSelection(index)">
      {{ item.name }}
    </tag>
  </div>
</template>

<script>
import Tag, { COLORS } from '@/components/Tag.vue';

export default {
  name: 'tag-list',
  components: {
    Tag,
  },
  props: {
    items: Array,
    isInteractive: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      filterText: '',
    };
  },
  watch: {
    filterText: 'filterItems',
  },
  mounted() {
    this.sortItems();
    this.filterItems(this.filterText);
  },
  methods: {
    toggleSelection(index) {
      if (this.isInteractive) {
        const item = this.items[index];
        item.isSelected = !item.isSelected;
        this.$set(this.items, index, item);
      }
    },
    filterItems(filterText) {
      if (!this.items) return;
      this.items.forEach((item) => {
        // eslint-disable-next-line no-param-reassign
        item.isFiltered =
          item.name.toLowerCase().indexOf(filterText.toLowerCase()) < 0
          && !item.isSelected;
      });
    },
    sortItems() {
      if (!this.items) return;
      this.items.sort((a, b) => {
        if (a.type !== b.type) { // sort by type
          if (a.type < b.type) return 1;
          if (a.type > b.type) return -1;
          return 0;
        }
        // within same type sort by name
        if (a.name.toUpperCase() < b.name.toUpperCase()) return -1;
        if (a.name.toUpperCase() > b.name.toUpperCase()) return 1;
        return 0;
      });
    },
    getColorForItem(item) {
      switch (item.type) {
        case 'positive':
          return COLORS.green;
        case 'neutral':
          return COLORS.yellow;
        case 'negative':
          return COLORS.red;
        default:
          return COLORS.blue;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.filter {
  vertical-align: top;
  width: 100%;
  padding: 0.6rem;
  margin: .2rem;
  height: 2rem;
  font-size: 1rem;
  border: solid .05rem;
  border-color: #2c3e50;
  color: #2c3e50;
}
</style>
