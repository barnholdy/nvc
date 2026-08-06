<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">{{ headlineText }}</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}“</p>

      <!-- What was written a step or two earlier. Picking feelings is easier
           with the reaction still in view than from memory. -->
      <belief-context
        :exceptions="exceptions"
        :perspective="perspective"
        :reaction="reaction"
        :origin="contextOrigin">
      </belief-context>

      <p class="body-1 grey--text mt-3 wizard-prompt">{{ promptText }}</p>
    </v-flex>

    <!-- Optional block between the prompt and the list -->
    <slot name="beforeList"></slot>

    <!-- Directly above the list it belongs to, and so below whatever the slot
         asked last — in the wandeln wizard that is "Was fühlst du?". -->
    <p v-if="limitHint" class="limit-hint" :class="{ 'over-limit': isOverLimit }">{{ limitHint }}</p>

    <v-flex>
      <div
        v-for="e in taxonomy.grundemotionen"
        :key="e.id"
        class="emotion-card mb-2"
        :style="{ borderColor: emotionColor(e.id) }"
      >
        <!-- Header -->
        <div class="emotion-card-header" @click="toggleEmotion(e.id)">
          <span class="emotion-emoji">{{ emotionEmoji(e.id) }}</span>
          <div class="emotion-row-body">
            <span class="emotion-row-label" :style="{ color: emotionColor(e.id) }">{{ e.label }}</span>
            <span class="emotion-row-desc">{{ e.beschreibung }}</span>
            <div v-if="selectedFeelingsFor(e.id).length > 0" class="emotion-selections">
              <span
                v-for="item in selectedFeelingsFor(e.id)"
                :key="'f-' + item.name"
                class="emotion-sel-chip emotion-sel-chip--removable"
                :style="{ backgroundColor: emotionColor(e.id), color: '#000' }"
                @click.stop="toggleFeeling(item.name, item.emotionId)"
              >{{ item.name }}<span class="chip-x">×</span></span>
            </div>
          </div>
          <v-icon small :color="emotionColor(e.id)">{{ isEmotionOpen(e.id) ? 'expand_less' : 'expand_more' }}</v-icon>
        </div>

        <!-- Clusters (when emotion is expanded) -->
        <div v-if="isEmotionOpen(e.id)" class="emotion-card-body">
          <div v-for="c in e.unterkategorien" :key="c.id">

            <div class="cluster-row" @click.stop="toggleCluster(c.id)">
              <span
                v-if="clusterFeelingCount(c) > 0"
                class="cluster-fill"
                :style="{ width: clusterPct(c) + '%', background: emotionColor(e.id) }"
              ></span>
              <span class="cluster-label">{{ c.label }}</span>
              <span v-if="clusterFeelingCount(c) > 0" class="cluster-count">
                {{ clusterFeelingCount(c) }}/{{ clusterFeelingTotal(c) }}
              </span>
            </div>

            <!-- Selectable items (when cluster is expanded) -->
            <div v-if="isClusterOpen(c.id)" class="selection-section">
              <div class="chips-wrap">
                <span
                  v-for="item in (c.gefuehle || [])"
                  :key="item.name"
                  class="my-chip"
                  :style="isSelectedFeeling(item.name)
                    ? { backgroundColor: emotionColor(e.id), color: '#000' }
                    : { backgroundColor: '#3a3a3c', color: emotionColor(e.id) }"
                  @click.stop="toggleFeeling(item.name, e.id)"
                >{{ item.name }}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

    </v-flex>
  </v-layout>
</template>

<script>
import BeliefContext from '@/views/BeliefContext.vue';
import { emotionColor, emotionValence, emotionIdForFeeling } from '@/utils/emotions';

// The Gefühl tree. Bedürfnisse used to be picked here too, through the same
// component in a second mode — they have their own tree and their own picker
// now, so this one only does one thing.
export default {
  name: 'belief-add-feeling-need',
  components: { BeliefContext },
  props: {
    belief: { type: String, default: '' },
    // The reaction from the earlier step, shown read-only for context.
    reaction: { type: String, default: '' },
    taxonomy: { type: Object, required: true },
    headline: { type: String, default: '' },
    prompt: { type: String, default: '' },
    // Written in the change wizard's first step, carried forward as context.
    exceptions: { type: String, default: '' },
    // Optional second quote under the belief — the change wizard shows the new
    // reaction the feelings are meant to refer to.
    perspective: { type: String, default: '' },
    initialFeelings: { type: Array, default: function() { return []; } },
    // How many may be picked at once. 0 means no limit.
    maxSelections: { type: Number, default: 0 },
    // Shown above the list when the step follows an origin question.
    contextOrigin: { type: String, default: '' },
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
    headlineText: function() {
      return this.headline || 'Gefühle';
    },
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
    promptText: function() {
      return this.prompt || 'Was fühlst du, wenn die Überzeugung wahr ist?';
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
    emotionEmoji: function(id) {
      var map = {
        freude: '😊',
        traurigkeit: '😢',
        wut: '😠',
        angst: '😰',
        ueberraschung: '😮',
        ekel: '🤢',
      };
      return map[id] || '😶';
    },
  },
};
</script>

<style scoped lang="scss">
.belief-quote { font-style: italic; }
.limit-hint {
  font-size: 0.8rem;
  color: #636366;
  margin: 10px 0 12px;
  &.over-limit {
    color: #fd9927;
    font-weight: 600;
  }
}

.emotion-card {
  border: 1.5px solid;
  border-radius: 12px;
  background: #1c1c1e;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}

.emotion-card-header {
  display: flex;
  align-items: center;
  padding: 13px 14px;
  cursor: pointer;
  &:active { background: #2c2c2e; }
}

.emotion-emoji {
  font-size: 1.6rem;
  margin-right: 12px;
  flex-shrink: 0;
  line-height: 1;
}

.emotion-row-body { flex: 1; min-width: 0; }
.emotion-row-label { display: block; font-weight: 600; font-size: 0.95rem; }
.emotion-row-desc { display: block; font-size: 0.78rem; color: #8e8e93; margin-top: 2px; }
.emotion-selections { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 7px; }

.emotion-sel-chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.72rem;
  font-weight: 600;
}
.emotion-sel-chip--removable {
  padding-right: 5px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.7; }
}
.chip-x {
  margin-left: 5px;
  font-size: 0.9rem;
  line-height: 1;
  vertical-align: -1px;
  opacity: 0.65;
}

.emotion-card-body {
  border-top: 1px solid #2c2c2e;
}

.cluster-row {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 11px 14px 11px 20px;
  color: #fff;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.88rem;
  border-top: 1px solid #2c2c2e;
  -webkit-tap-highlight-color: transparent;
  &:first-child { border-top: none; }
  &:active { background: #2c2c2e; }
}

.cluster-fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  opacity: 0.3;
  min-width: 10px;
  transition: width 0.25s ease;
  pointer-events: none;
}
.cluster-label { position: relative; z-index: 1; flex: 1; min-width: 0; }
.cluster-count {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  margin-left: 8px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #8e8e93;
}

.selection-section {
  padding: 12px 14px 10px 20px;
  background: #111;
  border-top: 1px solid #2c2c2e;
}

.chips-wrap { display: flex; flex-wrap: wrap; }

.my-chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  margin: 3px 4px 3px 0;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
  &:active { opacity: 0.7; }
}
</style>
