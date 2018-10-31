<template>
  <div class="tag-list">
    <input
      v-show="isInteractive && isFilterNameEnabled"
      v-model="filterName"
      type="search"
      placeholder="suchen..."
      class="filter" />
    <br />
    <v-slider
      v-show="isInteractive && isFilterValenceEnabled"
      v-model="filterValence"
      step="1"
      ticks="always"
      tick-size="2"
      min="-2"
      max="2"
      append-icon="mood"
      prepend-icon="mood_bad"
      color="primary"
      track-color="primary"
    ></v-slider>
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
    isFilterNameEnabled: {
      type: Boolean,
      default: false,
    },
    isFilterValenceEnabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      filterName: '',
      filterValence: 0,
    };
  },
  watch: {
    filterName: 'filterItems',
    filterValence: 'filterItems',
  },
  mounted() {
    this.sortItems();
    this.filterItems();
  },
  methods: {
    toggleSelection(index) {
      if (this.isInteractive) {
        const item = this.items[index];
        item.isSelected = !item.isSelected;
        this.$set(this.items, index, item);
      }
    },
    filterItems() {
      if (!this.items) return;
      this.items.forEach((item) => {
        // eslint-disable-next-line no-param-reassign
        item.isFiltered =
          (
            (
              item.name.toLowerCase().indexOf(this.filterName.toLowerCase()) < 0
              && this.isFilterNameEnabled
            )
            || (
              parseInt(item.valence, 10) !== this.filterValence
                && this.isFilterValenceEnabled
            )
          )
          && !item.isSelected;
      });
    },
    sortItems() {
      if (!this.items) return;
      this.items.sort((a, b) => {
        if (a.valence !== b.valence) { // sort by valence
          if (a.valence < b.valence) return 1;
          if (a.valence > b.valence) return -1;
          return 0;
        }
        // within same type sort by name
        if (a.name.toUpperCase() < b.name.toUpperCase()) return -1;
        if (a.name.toUpperCase() > b.name.toUpperCase()) return 1;
        return 0;
      });
    },
    getColorForItem(item) {
      switch (parseInt(item.valence, 10)) {
        case 2:
          return COLORS.green;
        case 1:
          return COLORS.green;
        case 0:
          return COLORS.blue;
        case -1:
          return COLORS.red;
        case -2:
          return COLORS.red;
        default:
          return COLORS.yellow;
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
  height: 2.8rem;
  font-size: 1rem;
  border: solid .05rem;
  border-color: #2c3e50;
  color: #2c3e50;
}
</style>
