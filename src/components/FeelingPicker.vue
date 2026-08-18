<template>
  <div>
    <p v-if="limitHint" class="wizard-note" :class="{ 'over-limit': isOverLimit }">{{ limitHint }}</p>

    <div v-for="e in taxonomy.grundemotionen" :key="e.id" class="pick-card">
      <div class="pick-head" @click="toggleEmotion(e.id)">
        <span class="pick-dot" :style="{ background: emotionColor(e.id) }"></span>
        <span class="pick-name">{{ e.label }}</span>
        <span class="pick-count">
          {{ selectedFeelingsFor(e.id).length ? selectedFeelingsFor(e.id).length + '/' : '' }}{{ emotionTotal(e) }}
        </span>
        <v-icon class="detail-chevron">
          {{ isEmotionOpen(e.id) ? 'expand_more' : 'chevron_right' }}
        </v-icon>
      </div>

      <p class="pick-desc">{{ e.beschreibung }}</p>

      <!-- What is already chosen stays visible whether the group is open or
           not: it is the answer, the tree is only the way to it. -->
      <div v-if="selectedFeelingsFor(e.id).length" class="pick-chips">
        <span
          v-for="item in selectedFeelingsFor(e.id)"
          :key="'f-' + item.name"
          class="pick-chip"
          :style="{ color: emotionColor(e.id) }"
          @click.stop="toggleFeeling(item.name, item.emotionId)"
        >{{ item.name }}<span class="pick-chip-x">×</span></span>
      </div>

      <div v-if="isEmotionOpen(e.id)" class="pick-body">
        <div v-for="c in e.unterkategorien" :key="c.id">
          <div class="pick-cluster" @click.stop="toggleCluster(c.id)">
            <span
              v-if="clusterFeelingCount(c) > 0"
              class="pick-cluster-fill"
              :style="{ width: clusterPct(c) + '%', background: emotionColor(e.id) }"
            ></span>
            <span class="pick-cluster-label">{{ c.label }}</span>
            <span v-if="clusterFeelingCount(c) > 0" class="pick-cluster-count">
              {{ clusterFeelingCount(c) }}/{{ clusterFeelingTotal(c) }}
            </span>
          </div>

          <div v-if="isClusterOpen(c.id)" class="pick-chips pick-chips-open">
            <!-- Every word carries the group's colour; chosen ones fill with
                 it so what is already picked still reads as the answer. -->
            <span
              v-for="item in (c.gefuehle || [])"
              :key="item.name"
              class="pick-chip"
              :class="{ chosen: isSelectedFeeling(item.name) }"
              :style="chipStyle(item.name, e.id)"
              @click.stop="toggleFeeling(item.name, e.id)"
            >{{ item.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { emotionColor, emotionValence, emotionIdForFeeling } from '@/utils/emotions';

// The Gefühl tree, on its own: an accordion of Grundemotionen, opening onto
// their clusters and words, with the current picks pinned to each header —
// whatever wizard step asks the question, the picking works the same way.
export default {
  name: 'feeling-picker',
  props: {
    taxonomy: { type: Object, required: true },
    initialFeelings: { type: Array, default: function() { return []; } },
    // How many may be picked at once. 0 means no limit.
    maxSelections: { type: Number, default: 0 },
  },
  data: function() {
    return {
      activeEmotionId: null,
      activeClusterId: null,
      selFeelings: this.initialFeelings.map(function(f) {
        return { name: f.name, emotionId: emotionIdForFeeling(f.name) };
      }),
    };
  },
  computed: {
    chosenCount: function() {
      return this.selFeelings.length;
    },
    isOverLimit: function() {
      return !!this.maxSelections && this.chosenCount > this.maxSelections;
    },
    // Say the limit out loud, and say it differently once it is exceeded — the
    // "weiter" button is disabled at that point and needs a reason on screen.
    limitHint: function() {
      if (!this.maxSelections) return '';
      if (this.maxSelections === 1) return 'Wähle ein Gefühl.';
      if (this.isOverLimit) {
        return this.chosenCount + ' von ' + this.maxSelections
          + ' gewählt — entferne welche, um weiterzugehen.';
      }
      return 'Wähle bis zu ' + this.maxSelections + ' — ' + this.chosenCount + ' von '
        + this.maxSelections + ' gewählt.';
    },
  },
  methods: {
    // Feeling chips on the card header, so a pick can be undone without
    // hunting it down in its cluster again.
    selectedFeelingsFor: function(emotionId) {
      return this.selFeelings.filter(function(item) {
        return (item.emotionId || emotionIdForFeeling(item.name)) === emotionId;
      });
    },
    clusterFeelingTotal: function(cluster) {
      return (cluster.gefuehle || []).length;
    },
    clusterFeelingCount: function(cluster) {
      var self = this;
      return (cluster.gefuehle || []).filter(function(f) {
        return self.isSelectedFeeling(f.name);
      }).length;
    },
    clusterPct: function(cluster) {
      var total = this.clusterFeelingTotal(cluster);
      if (!total) return 0;
      return Math.round((this.clusterFeelingCount(cluster) / total) * 100);
    },

    /* ── accordion ── */
    isEmotionOpen: function(id) {
      return this.activeEmotionId === id;
    },
    isClusterOpen: function(id) {
      return this.activeClusterId === id;
    },
    toggleEmotion: function(id) {
      if (this.activeEmotionId === id) {
        this.activeEmotionId = null;
        this.activeClusterId = null;
      } else {
        this.activeEmotionId = id;
        this.activeClusterId = null;
      }
    },
    toggleCluster: function(id) {
      this.activeClusterId = this.activeClusterId === id ? null : id;
    },

    /* ── selection state ── */
    isSelectedFeeling: function(name) {
      return this.selFeelings.some(function(f) { return f.name === name; });
    },
    toggleFeeling: function(name, emotionId) {
      var idx = this.selFeelings.findIndex(function(f) { return f.name === name; });
      if (idx >= 0) {
        this.selFeelings.splice(idx, 1);
      } else {
        this.selFeelings.push({ name: name, emotionId: emotionId });
      }
      this.emitChange();
    },
    emitChange: function() {
      this.$emit('change', this.selFeelings.map(function(x) {
        return {
          name: x.name,
          // Numeric valence kept for the profile statistics, derived from the
          // Grundemotion's `valenz` in the taxonomy.
          valence: emotionValence(x.emotionId),
          emotionId: x.emotionId,
        };
      }));
    },

    emotionColor: function(id) {
      return emotionColor(id);
    },
    // Every word in a group carries its colour; a chosen one fills with it so
    // it still reads as the answer once the group is a wall of chips.
    chipStyle: function(name, emotionId) {
      var color = emotionColor(emotionId);
      if (this.isSelectedFeeling(name)) {
        return { backgroundColor: color, borderColor: color, color: '#000' };
      }
      return { color: color };
    },
    // How many feelings the group holds altogether — the denominator the
    // header counts against.
    emotionTotal: function(e) {
      return (e.unterkategorien || []).reduce(function(sum, c) {
        return sum + ((c.gefuehle || []).length);
      }, 0);
    },
  },
};
</script>

<style scoped lang="scss">
/* Turns orange once the recommendation is exceeded — the way forward is
   blocked at that point and needs a reason on screen. */
.over-limit { color: #fd9927; font-weight: 600; }
</style>
