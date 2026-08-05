<template>
  <v-flex>
    <p v-if="limitHint" class="limit-hint">{{ limitHint }}</p>

    <div
      v-for="cat in categories"
      :key="cat.id"
      class="need-card mb-2"
      :style="{ borderColor: categoryColor(cat.id) }"
    >
      <div class="need-card-header" @click="toggleCategory(cat.id)">
        <span class="need-emoji">{{ categoryEmoji(cat.id) }}</span>
        <div class="need-row-body">
          <span class="need-row-label" :style="{ color: categoryColor(cat.id) }">{{ cat.label }}</span>
          <div v-if="selectedIn(cat).length" class="need-selections">
            <span
              v-for="item in selectedIn(cat)"
              :key="'s-' + item.name"
              class="need-sel-chip"
              :style="{ backgroundColor: categoryColor(cat.id), color: '#000' }"
              @click.stop="toggle(item.name)"
            >{{ item.name }}<span class="chip-x">×</span></span>
          </div>
        </div>
        <v-icon small :color="categoryColor(cat.id)">
          {{ isCategoryOpen(cat.id) ? 'expand_less' : 'expand_more' }}
        </v-icon>
      </div>

      <div v-if="isCategoryOpen(cat.id)" class="need-card-body">
        <div v-for="c in cat.cluster" :key="c.id">
          <div class="cluster-row" @click.stop="toggleCluster(c.id)">
            <!-- The bar reports what is chosen in this cluster, the way the
                 feeling clusters report theirs. -->
            <span
              v-if="countIn(c) > 0"
              class="cluster-fill"
              :style="{ width: pctIn(c) + '%', background: categoryColor(cat.id) }"
            ></span>
            <span class="cluster-label">{{ c.label }}</span>
            <span v-if="countIn(c) > 0" class="cluster-count">
              {{ countIn(c) }}/{{ c.beduerfnisse.length }}
            </span>
          </div>

          <div v-if="isClusterOpen(c.id)" class="selection-section">
            <div class="chips-wrap">
              <span
                v-for="name in c.beduerfnisse"
                :key="name"
                class="my-chip"
                :style="isSelected(name)
                  ? { backgroundColor: categoryColor(cat.id), color: '#000' }
                  : { backgroundColor: '#3a3a3c', color: categoryColor(cat.id) }"
                @click.stop="toggle(name)"
              >{{ name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </v-flex>
</template>

<script>
import {
  needCategories,
  needCategoryColor,
  needCategoryEmoji,
  categoryIdForNeed,
  sortNeeds,
} from '@/utils/needs';

// The Bedürfnis tree, drawn like the Gefühl tree: a card per Grundkategorie,
// clusters inside it, the needs themselves as chips. Its own taxonomy and its
// own colours — nothing here depends on what was felt a step earlier.
export default {
  name: 'need-picker',
  props: {
    initialNeeds: { type: Array, default: function() { return []; } },
    // How many may be picked at once. 0 means no limit.
    maxSelections: { type: Number, default: 0 },
  },
  data: function() {
    return {
      activeCategoryId: null,
      activeClusterId: null,
      selected: sortNeeds(this.initialNeeds.filter(function(n) { return n && n.name; })
        .map(function(n) { return { name: n.name, categoryId: categoryIdForNeed(n.name) }; })),
      categories: needCategories,
    };
  },
  computed: {
    limitHint: function() {
      if (this.maxSelections !== 1) return '';
      return 'Wähle ein Bedürfnis.';
    },
  },
  methods: {
    categoryColor: function(id) { return needCategoryColor(id); },
    categoryEmoji: function(id) { return needCategoryEmoji(id); },
    isCategoryOpen: function(id) { return this.activeCategoryId === id; },
    isClusterOpen: function(id) { return this.activeClusterId === id; },
    toggleCategory: function(id) {
      if (this.activeCategoryId === id) {
        this.activeCategoryId = null;
      } else {
        this.activeCategoryId = id;
      }
      this.activeClusterId = null;
    },
    toggleCluster: function(id) {
      this.activeClusterId = this.activeClusterId === id ? null : id;
    },
    isSelected: function(name) {
      return this.selected.some(function(n) { return n.name === name; });
    },
    selectedIn: function(cat) {
      return this.selected.filter(function(n) { return n.categoryId === cat.id; });
    },
    countIn: function(cluster) {
      var self = this;
      return (cluster.beduerfnisse || []).filter(function(n) { return self.isSelected(n); }).length;
    },
    pctIn: function(cluster) {
      var total = (cluster.beduerfnisse || []).length;
      if (!total) return 0;
      return Math.round((this.countIn(cluster) / total) * 100);
    },
    toggle: function(name) {
      var idx = this.selected.findIndex(function(n) { return n.name === name; });
      if (idx >= 0) {
        this.selected.splice(idx, 1);
      } else {
        // At a limit of one a tap reads as "this one instead", so the oldest
        // pick makes way rather than the tap being refused.
        while (this.maxSelections && this.selected.length >= this.maxSelections) {
          this.selected.shift();
        }
        this.selected.push({ name: name, categoryId: categoryIdForNeed(name) });
      }
      this.$emit('change', sortNeeds(this.selected).map(function(n) {
        return { name: n.name, categoryId: n.categoryId };
      }));
    },
  },
};
</script>

<style scoped lang="scss">
.limit-hint {
  font-size: 0.8rem;
  color: #636366;
  margin: 10px 0 12px;
}

.need-card {
  border: 1.5px solid;
  border-radius: 12px;
  background: #1c1c1e;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}
.need-card-header {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  cursor: pointer;
}
.need-emoji {
  font-size: 1.35rem;
  margin-right: 12px;
  flex-shrink: 0;
}
.need-row-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.need-row-label {
  font-size: 0.95rem;
  font-weight: 600;
}
.need-selections {
  display: flex;
  flex-wrap: wrap;
  margin-top: 6px;
}
.need-sel-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  margin: 2px 4px 2px 0;
  cursor: pointer;
}
.chip-x {
  margin-left: 5px;
  font-size: 0.9rem;
  line-height: 1;
  opacity: 0.65;
}

.need-card-body {
  border-top: 1px solid #2c2c2e;
}
.cluster-row {
  position: relative;
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid #2c2c2e;
  cursor: pointer;
  overflow: hidden;
}
.cluster-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  opacity: 0.18;
}
.cluster-label {
  position: relative;
  font-size: 0.875rem;
  color: #ebebf5;
  flex: 1;
}
.cluster-count {
  position: relative;
  font-size: 0.72rem;
  color: #8e8e93;
  flex-shrink: 0;
  margin-left: 8px;
}
.selection-section {
  padding: 10px 14px 12px;
  border-bottom: 1px solid #2c2c2e;
}
.chips-wrap {
  display: flex;
  flex-wrap: wrap;
}
.my-chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 500;
  margin: 3px 4px 3px 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
</style>
