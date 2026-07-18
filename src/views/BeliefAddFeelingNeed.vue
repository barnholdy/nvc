<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Gefühle &amp; Bedürfnisse</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}"</p>
    </v-flex>

    <!-- Summary of selected items -->
    <v-flex v-if="selFeelings.length > 0 || selNeeds.length > 0" class="mb-3">
      <div class="summary-section">
        <v-chip
          v-for="name in selFeelings"
          :key="'sf_' + name"
          small close color="#4ade80" text-color="#000"
          class="mr-1 mb-1"
          @input="removeFeeling(name)"
        >{{ name }}</v-chip>
        <v-chip
          v-for="name in selNeeds"
          :key="'sn_' + name"
          small close color="#1565c0" text-color="#fff"
          class="mr-1 mb-1"
          @input="removeNeed(name)"
        >{{ name }}</v-chip>
      </div>
    </v-flex>

    <!-- Breadcrumb for level 2/3 -->
    <v-flex v-if="level !== 'primary'" class="mb-2">
      <div class="fn-breadcrumb">
        <span class="fn-crumb fn-clickable" @click="level = 'primary'">Grundemotionen</span>
        <v-icon small color="#999">chevron_right</v-icon>
        <span v-if="level === 'secondary'" class="fn-crumb fn-active">{{ activePrimary.label }}</span>
        <template v-if="level === 'cluster'">
          <span class="fn-crumb fn-clickable" @click="level = 'secondary'">{{ activePrimary.label }}</span>
          <v-icon small color="#999">chevron_right</v-icon>
          <span class="fn-crumb fn-active">{{ activeCluster.label }}</span>
        </template>
      </div>
    </v-flex>

    <!-- Level 1: Grundemotionen -->
    <v-flex v-if="level === 'primary'">
      <div class="emotion-grid">
        <div
          v-for="e in taxonomy.grundemotionen"
          :key="e.id"
          class="emotion-card"
          :class="'emotion-' + e.id"
          @click="choosePrimary(e)"
        >{{ e.label }}</div>
      </div>
    </v-flex>

    <!-- Level 2: Unterkategorien -->
    <v-flex v-else-if="level === 'secondary'">
      <div
        v-for="c in activePrimary.unterkategorien"
        :key="c.id"
        class="cluster-row"
        :style="{ borderLeftColor: emotionColor(activePrimary.id) }"
        @click="chooseCluster(c)"
      >
        <span>{{ c.label }}</span>
        <v-icon small>chevron_right</v-icon>
      </div>
    </v-flex>

    <!-- Level 3: Feelings + Needs for selected cluster -->
    <v-flex v-else>
      <p class="section-label">Gefühle</p>
      <div class="chips-wrap mb-3">
        <v-chip
          v-for="f in activeCluster.gefuehle"
          :key="f.name"
          small
          :color="isSelectedFeeling(f.name) ? '#4ade80' : undefined"
          :text-color="isSelectedFeeling(f.name) ? '#000' : undefined"
          :outline="!isSelectedFeeling(f.name)"
          class="mr-1 mb-1"
          @click="toggleFeeling(f.name)"
        >{{ f.name }}</v-chip>
      </div>
      <p class="section-label">Bedürfnisse</p>
      <div class="chips-wrap">
        <v-chip
          v-for="n in activeCluster.beduerfnisse"
          :key="n.name"
          small
          :color="isSelectedNeed(n.name) ? '#1565c0' : undefined"
          :text-color="isSelectedNeed(n.name) ? '#fff' : undefined"
          :outline="!isSelectedNeed(n.name)"
          class="mr-1 mb-1"
          @click="toggleNeed(n.name)"
        >{{ n.name }}</v-chip>
      </div>
      <div class="mt-4 text-xs-center">
        <v-btn flat color="primary" @click="level = 'primary'">
          <v-icon left>add</v-icon>Weiteres Gefühl hinzufügen
        </v-btn>
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
    return {
      level: 'primary',
      activePrimary: null,
      activeCluster: null,
      selFeelings: this.initialFeelings.map(function(f) { return f.name; }),
      selNeeds: this.initialNeeds.map(function(n) { return n.name; }),
    };
  },
  methods: {
    choosePrimary: function(emotion) {
      this.activePrimary = emotion;
      this.level = 'secondary';
    },
    chooseCluster: function(cluster) {
      this.activeCluster = cluster;
      this.level = 'cluster';
    },
    goBack: function() {
      if (this.level === 'cluster') {
        this.level = 'secondary';
      } else if (this.level === 'secondary') {
        this.level = 'primary';
      }
    },
    isSelectedFeeling: function(name) {
      return this.selFeelings.indexOf(name) >= 0;
    },
    isSelectedNeed: function(name) {
      return this.selNeeds.indexOf(name) >= 0;
    },
    toggleFeeling: function(name) {
      var idx = this.selFeelings.indexOf(name);
      if (idx >= 0) {
        this.selFeelings.splice(idx, 1);
      } else {
        this.selFeelings.push(name);
      }
      this.emitChange();
    },
    toggleNeed: function(name) {
      var idx = this.selNeeds.indexOf(name);
      if (idx >= 0) {
        this.selNeeds.splice(idx, 1);
      } else {
        this.selNeeds.push(name);
      }
      this.emitChange();
    },
    removeFeeling: function(name) {
      var idx = this.selFeelings.indexOf(name);
      if (idx >= 0) { this.selFeelings.splice(idx, 1); }
      this.emitChange();
    },
    removeNeed: function(name) {
      var idx = this.selNeeds.indexOf(name);
      if (idx >= 0) { this.selNeeds.splice(idx, 1); }
      this.emitChange();
    },
    emitChange: function() {
      this.$emit('change', {
        feelings: this.selFeelings.map(function(name) { return { name: name }; }),
        needs: this.selNeeds.map(function(name) { return { name: name }; }),
      });
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

.fn-breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82rem;
}
.fn-crumb { color: #999; }
.fn-active { color: #333; font-weight: 600; }
.fn-clickable { cursor: pointer; &:hover { color: #333; } }

.emotion-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 8px;
}
.emotion-card {
  padding: 18px 6px;
  border-radius: 12px;
  text-align: center;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  border: 2px solid;
  transition: opacity 0.15s;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.7; }
}
.emotion-freude       { background: rgba(74,222,128,0.12);  border-color: #4ade80; color: #16a34a; }
.emotion-traurigkeit  { background: rgba(96,165,250,0.12);  border-color: #60a5fa; color: #2563eb; }
.emotion-wut          { background: rgba(248,113,113,0.12); border-color: #f87171; color: #dc2626; }
.emotion-angst        { background: rgba(251,146,60,0.12);  border-color: #fb923c; color: #ea580c; }
.emotion-ueberraschung { background: rgba(192,132,252,0.12); border-color: #c084fc; color: #9333ea; }
.emotion-ekel         { background: rgba(163,230,53,0.12);  border-color: #a3e635; color: #65a30d; }

.cluster-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 12px 13px 14px;
  margin-bottom: 8px;
  border-radius: 8px;
  border-left: 4px solid;
  background: #2c2c2e;
  color: #fff;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  -webkit-tap-highlight-color: transparent;
  &:active { background: #3a3a3c; }
}

.section-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 8px;
}
.chips-wrap { display: flex; flex-wrap: wrap; }
</style>
