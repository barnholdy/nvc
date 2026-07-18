<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Gefühle &amp; Bedürfnisse</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}"</p>
    </v-flex>

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
            <div v-if="selFeelings.filter(function(f){ return f.emotionId === e.id; }).length > 0" class="emotion-selections">
              <span
                v-for="item in selFeelings.filter(function(f){ return f.emotionId === e.id; })"
                :key="'f_' + item.name"
                class="emotion-sel-chip"
                :style="{ backgroundColor: emotionColor(e.id), color: '#000' }"
              >{{ item.name }}</span>
            </div>
          </div>
          <v-icon small :color="emotionColor(e.id)">{{ activeEmotionId === e.id ? 'expand_less' : 'expand_more' }}</v-icon>
        </div>

        <!-- Clusters (when emotion is expanded) -->
        <div v-if="activeEmotionId === e.id" class="emotion-card-body">
          <div v-for="c in e.unterkategorien" :key="c.id">

            <div class="cluster-row" @click.stop="toggleCluster(c.id)">
              {{ c.label }}
            </div>

            <!-- Feelings + Needs (when cluster is expanded) -->
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
                    ? { backgroundColor: '#c8963e', color: '#000' }
                    : { backgroundColor: '#3a3a3c', color: '#c8963e' }"
                  @click.stop="toggleNeed(n.name, e.id)"
                >{{ n.name }}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Selected needs box -->
      <div v-if="selNeeds.length > 0" class="needs-box mt-3">
        <p class="section-label">Ausgewählte Bedürfnisse</p>
        <div class="chips-wrap">
          <span
            v-for="item in selNeeds"
            :key="'sn_' + item.name"
            class="emotion-sel-chip"
            :style="{ backgroundColor: '#c8963e', color: '#000' }"
          >{{ item.name }}</span>
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

.emotion-card-body {
  border-top: 1px solid #2c2c2e;
}

.cluster-row {
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

.selection-section {
  padding: 12px 14px 10px 20px;
  background: #111;
  border-top: 1px solid #2c2c2e;
}

.section-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #636366;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 6px;
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

.needs-box {
  border: 1.5px solid #c8963e;
  border-radius: 12px;
  background: #1c1c1e;
  padding: 13px 14px;
}
.needs-box .chips-wrap { margin-top: 4px; }
</style>
