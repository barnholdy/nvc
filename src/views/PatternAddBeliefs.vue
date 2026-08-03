<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Überzeugungen</h1>
      <p v-if="trigger" class="subheading grey--text situation-quote mt-1">„{{ trigger }}"</p>
      <p class="body-1 grey--text mt-2">Welche tiefer liegenden Überzeugungen sind damit verbunden?</p>
    </v-flex>

    <v-flex v-if="selectedBeliefObjects.length" class="mb-2">
      <div v-for="b in selectedBeliefObjects" :key="b.time" class="belief-row">
        <div class="belief-head">
          <p class="belief-text">{{ b.belief }}</p>
          <button class="belief-remove" @click="removeSelected(b.time)">
            <v-icon small color="#ff453a">close</v-icon>
          </button>
        </div>
        <p class="truth-question">Für wie wahr hältst du die Überzeugung?</p>
        <div class="slider-row">
          <span class="slider-end-label">0</span>
          <input
            type="range"
            min="0"
            max="10"
            :value="truthOf(b.time)"
            class="truth-slider"
            @input="setTruth(b.time, $event.target.value)"
          />
          <span class="slider-end-label">10</span>
        </div>
        <p class="slider-value-label">{{ truthOf(b.time) }}</p>
      </div>
    </v-flex>

    <v-flex class="mt-1">
      <div v-if="unselectedBeliefs.length" class="available-chips mt-2">
        <p class="caption grey--text mb-1">Hinzufügen:</p>
        <div class="chip-list">
          <v-chip
            v-for="b in unselectedBeliefs"
            :key="b.time"
            class="available-chip"
            @click="addBelief(b.time)"
          >{{ b.belief }}</v-chip>
        </div>
      </div>

      <template v-if="showNewInput">
        <v-text-field
          v-model="newBeliefText"
          label="Neue Überzeugung"
          placeholder="Ich bin nicht gut genug..."
          single-line
          hide-details
          class="mb-2"
          @keyup.enter="createBelief"
        ></v-text-field>
        <v-btn small flat color="primary" :disabled="!newBeliefText.trim()" @click="createBelief">Hinzufügen</v-btn>
        <v-btn small flat color="grey" @click="cancelNew">Abbrechen</v-btn>
      </template>
      <template v-else>
        <v-btn small flat color="primary" @click="showNewInput = true">
          <v-icon small left>add</v-icon>
          Neue Überzeugung
        </v-btn>
      </template>
    </v-flex>
  </v-layout>
</template>

<script>
const TRUTH_DEFAULT = 5;

export default {
  name: 'pattern-add-beliefs',
  props: {
    allBeliefs: { type: Array, default: function() { return []; } },
    selectedBeliefIds: { type: Array, default: function() { return []; } },
    initialTruths: { type: Object, default: function() { return {}; } },
    trigger: { type: String, default: '' },
  },
  data() {
    return {
      selectedIds: this.selectedBeliefIds.slice(),
      truths: Object.assign({}, this.initialTruths),
      showNewInput: false,
      newBeliefText: '',
    };
  },
  computed: {
    selectedBeliefObjects() {
      var beliefs = this.allBeliefs;
      return this.selectedIds.map(function(id) {
        return beliefs.find(function(b) { return b.time === id; });
      }).filter(Boolean);
    },
    unselectedBeliefs() {
      var selectedIds = this.selectedIds;
      return this.allBeliefs.filter(function(b) {
        return selectedIds.indexOf(b.time) === -1;
      });
    },
  },
  watch: {
    selectedIds: function(val) {
      this.$emit('changed', val.slice());
      this.emitTruths();
    },
  },
  methods: {
    // The rating belongs to this situation, not to the belief: the same belief
    // rated again later is what makes a trend.
    truthOf(time) {
      const v = this.truths[time];
      return typeof v === 'number' ? v : TRUTH_DEFAULT;
    },
    setTruth(time, value) {
      this.$set(this.truths, time, parseInt(value, 10));
      this.emitTruths();
    },
    emitTruths() {
      const out = {};
      this.selectedIds.forEach((id) => { out[id] = this.truthOf(id); });
      this.$emit('truthsChanged', out);
    },
    addBelief(time) {
      if (this.selectedIds.indexOf(time) === -1) {
        this.selectedIds = this.selectedIds.concat([time]);
      }
    },
    removeSelected(time) {
      this.selectedIds = this.selectedIds.filter(function(id) { return id !== time; });
      this.$delete(this.truths, time);
    },
    cancelNew() {
      this.showNewInput = false;
      this.newBeliefText = '';
    },
    createBelief() {
      if (!this.newBeliefText.trim()) return;
      var time = +new Date();
      this.$store.dispatch('saveBelief', { time: time, belief: this.newBeliefText.trim() });
      this.selectedIds = this.selectedIds.concat([time]);
      this.newBeliefText = '';
      this.showNewInput = false;
    },
  },
};
</script>

<style scoped lang="scss">
.situation-quote {
  font-style: italic;
  white-space: pre-wrap;
}
.belief-row {
  padding: 12px 0;
  border-top: 1px solid #2c2c2e;
  &:first-of-type { border-top: none; }
}
.belief-head {
  display: flex;
  align-items: flex-start;
}
.belief-text {
  flex: 1;
  min-width: 0;
  font-size: 0.95rem;
  color: #ebebf5;
  line-height: 1.4;
  margin: 0;
  word-break: break-word;
}
.belief-remove {
  background: none;
  border: none;
  padding: 2px 4px;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 8px;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
.truth-question {
  font-size: 0.8rem;
  color: #8e8e93;
  margin: 8px 0 4px;
}
.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px;
}
.slider-end-label {
  font-size: 0.72rem;
  color: #636366;
  flex-shrink: 0;
}
.truth-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #3a3a3c;
  outline: none;
  cursor: pointer;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #4ade80;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }
  &::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 50%;
    background: #4ade80;
    cursor: pointer;
  }
}
.slider-value-label {
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
  margin: 6px 0 0;
}
.available-chips { margin-top: 8px; }
.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.available-chip {
  cursor: pointer;
  white-space: normal;
  height: auto !important;
  padding: 4px 10px !important;
}
</style>
