<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Gefühle &amp; Bedürfnisse</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}"</p>
    </v-flex>

    <!-- Summary of selected items -->
    <v-flex v-if="selFeelings.length > 0 || selNeeds.length > 0" class="mb-3">
      <div class="summary-section">
        <span
          v-for="item in selFeelings"
          :key="'sf_' + item.name"
          class="my-chip"
          :style="{ backgroundColor: emotionColor(item.emotionId), color: '#000' }"
          @click="removeFeeling(item.name)"
        >{{ item.name }} <span class="my-chip-x">×</span></span>
        <span
          v-for="item in selNeeds"
          :key="'sn_' + item.name"
          class="my-chip"
          :style="{ backgroundColor: emotionColor(item.emotionId), color: '#000' }"
          @click="removeNeed(item.name)"
        >{{ item.name }} <span class="my-chip-x">×</span></span>
      </div>
    </v-flex>

    <!-- Accordion: all levels always visible -->
    <v-flex>
      <div v-for="e in taxonomy.grundemotionen" :key="e.id" class="mb-2">

        <!-- Level 1: Emotion row -->
        <div
          class="emotion-row"
          :style="{ borderLeftColor: emotionColor(e.id) }"
          @click="toggleEmotion(e.id)"
        >
          <div class="emotion-row-body">
            <span class="emotion-row-label" :style="{ color: emotionColor(e.id) }">{{ e.label }}</span>
            <span class="emotion-row-desc">{{ e.beschreibung }}</span>
          </div>
          <v-icon small :color="emotionColor(e.id)">{{ activeEmotionId === e.id ? 'expand_less' : 'expand_more' }}</v-icon>
        </div>

        <!-- Level 2: Clusters (when emotion is expanded) -->
        <div v-if="activeEmotionId === e.id" class="cluster-section">
          <div v-for="c in e.unterkategorien" :key="c.id" class="mb-1">

            <div
              class="cluster-row"
              :style="{ borderLeftColor: emotionColor(e.id) }"
              @click.stop="toggleCluster(c.id)"
            >
              <span>{{ c.label }}</span>
              <v-icon small color="#8e8e93">{{ activeClusterId === c.id ? 'expand_less' : 'expand_more' }}</v-icon>
            </div>

            <!-- Level 3: Feelings + Needs (when cluster is expanded) -->
            <div v-if="activeClusterId === c.id" class="selection-section">
              <p class="section-label">Gefühle</p>
              <div class="chips-wrap mb-3">
                <span
                  v-for="f in c.gefuehle"
                  :key="f.name"
                  class="my-chip"
                  :style="isSelectedFeeling(f.name)
                    ? { backgroundColor: emotionColor(e.id), color: '#000' }
                    : { backgroundColor: '#3a3a3c', color: emotionColor(e.id) }"
                  @click.stop="toggleFeeling(f.name, e.id)"
                >{{ f.name }}</span>
              </div>
              <p class="section-label">Bedürfnisse</p>
              <div class="chips-wrap">
                <span
                  v-for="n in c.beduerfnisse"
                  :key="n.name"
                  class="my-chip"
                  :style="isSelectedNeed(n.name)
                    ? { backgroundColor: emotionColor(e.id), color: '#000' }
                    : { backgroundColor: '#3a3a3c', color: emotionColor(e.id) }"
                  @click.stop="toggleNeed(n.name, e.id)"
                >{{ n.name }}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  name: 'belief-add-feeling-need',
  props: {
    belief: { type: String, default: '' },
    taxonomy: { type: Object, required: true },
    initialFeelings: { type: Array, default: function() { return []; } },
    initialNeeds: { type: Array, default: function() { return []; } },
  },
  data: function() {
    var self = this;
    return {
      activeEmotionId: null,
      activeClusterId: null,
      selFeelings: this.initialFeelings.map(function(f) {
        return { name: f.name, emotionId: self.findEmotionForFeeling(f.name) };
      }),
      selNeeds: this.initialNeeds.map(function(n) {
        return { name: n.name, emotionId: self.findEmotionForNeed(n.name) };
      }),
    };
  },
  methods: {
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
    isSelectedFeeling: function(name) {
      return this.selFeelings.some(function(f) { return f.name === name; });
    },
    isSelectedNeed: function(name) {
      return this.selNeeds.some(function(n) { return n.name === name; });
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
    toggleNeed: function(name, emotionId) {
      var idx = this.selNeeds.findIndex(function(n) { return n.name === name; });
      if (idx >= 0) {
        this.selNeeds.splice(idx, 1);
      } else {
        this.selNeeds.push({ name: name, emotionId: emotionId });
      }
      this.emitChange();
    },
    removeFeeling: function(name) {
      var idx = this.selFeelings.findIndex(function(f) { return f.name === name; });
      if (idx >= 0) { this.selFeelings.splice(idx, 1); }
      this.emitChange();
    },
    removeNeed: function(name) {
      var idx = this.selNeeds.findIndex(function(n) { return n.name === name; });
      if (idx >= 0) { this.selNeeds.splice(idx, 1); }
      this.emitChange();
    },
    emitChange: function() {
      this.$emit('change', {
        feelings: this.selFeelings.map(function(f) { return { name: f.name }; }),
        needs: this.selNeeds.map(function(n) { return { name: n.name }; }),
      });
    },
    findEmotionForFeeling: function(name) {
      var emotions = this.taxonomy.grundemotionen;
      for (var i = 0; i < emotions.length; i++) {
        var cats = emotions[i].unterkategorien;
        for (var j = 0; j < cats.length; j++) {
          if (cats[j].gefuehle.some(function(f) { return f.name === name; })) {
            return emotions[i].id;
          }
        }
      }
      return 'freude';
    },
    findEmotionForNeed: function(name) {
      var emotions = this.taxonomy.grundemotionen;
      for (var i = 0; i < emotions.length; i++) {
        var cats = emotions[i].unterkategorien;
        for (var j = 0; j < cats.length; j++) {
          if (cats[j].beduerfnisse.some(function(n) { return n.name === name; })) {
            return emotions[i].id;
          }
        }
      }
      return 'freude';
    },
    emotionColor: function(id) {
      var map = {
        freude: '#4ade80',
        traurigkeit: '#60a5fa',
        wut: '#f87171',
        angst: '#fb923c',
        ueberraschung: '#c084fc',
        ekel: '#a3e635',
      };
      return map[id] || '#9e9e9e';
    },
  },
};
</script>

<style scoped lang="scss">
.belief-quote { font-style: italic; }

.summary-section {
  display: flex;
  flex-wrap: wrap;
  padding: 4px 0;
}

.emotion-row {
  display: flex;
  align-items: center;
  padding: 13px 12px 13px 14px;
  border-radius: 8px;
  border-left: 4px solid;
  background: #2c2c2e;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { background: #3a3a3c; }
}
.emotion-row-body { flex: 1; min-width: 0; }
.emotion-row-label { display: block; font-weight: 600; font-size: 0.95rem; }
.emotion-row-desc { display: block; font-size: 0.78rem; color: #8e8e93; margin-top: 2px; }

.cluster-section {
  margin: 4px 0 0 12px;
}

.cluster-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 12px 11px 14px;
  border-radius: 8px;
  border-left: 4px solid;
  background: #1c1c1e;
  color: #fff;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.88rem;
  -webkit-tap-highlight-color: transparent;
  &:active { background: #2c2c2e; }
}

.selection-section {
  padding: 12px 12px 8px 14px;
  background: #111;
  border-radius: 0 0 8px 8px;
  margin-bottom: 4px;
  border-left: 4px solid #2c2c2e;
}

.section-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #636366;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 6px;
}
.chips-wrap { display: flex; flex-wrap: wrap; }

.my-chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  margin: 3px 4px 3px 0;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
  &:active { opacity: 0.7; }
}
.my-chip-x {
  margin-left: 4px;
  font-size: 1rem;
  line-height: 1;
  opacity: 0.7;
}
</style>
