<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Überzeugungen</h1>
      <p v-if="trigger" class="subheading grey--text situation-quote mt-1">„{{ trigger }}"</p>
      <p class="body-1 grey--text mt-2">Welche tiefer liegenden Überzeugungen sind damit verbunden?</p>
    </v-flex>

    <v-flex v-if="selectedBeliefObjects.length" class="mb-2">
      <div class="selected-chips">
        <v-chip
          v-for="b in selectedBeliefObjects"
          :key="b.time"
          close
          class="selected-chip"
          @input="removeSelected(b.time)"
        >{{ b.belief }}</v-chip>
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
export default {
  name: 'pattern-add-beliefs',
  props: {
    allBeliefs: { type: Array, default: function() { return []; } },
    selectedBeliefIds: { type: Array, default: function() { return []; } },
    trigger: { type: String, default: '' },
  },
  data() {
    return {
      selectedIds: this.selectedBeliefIds.slice(),
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
    },
  },
  methods: {
    addBelief(time) {
      if (this.selectedIds.indexOf(time) === -1) {
        this.selectedIds = this.selectedIds.concat([time]);
      }
    },
    removeSelected(time) {
      this.selectedIds = this.selectedIds.filter(function(id) { return id !== time; });
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
.selected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.selected-chip {
  white-space: normal;
  height: auto !important;
  padding: 4px 10px !important;
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
