<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Glaubenssätze</h1>
      <p class="body-1 grey--text mt-2">Welche Glaubenssätze sind mit diesem Muster verbunden?</p>
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

    <v-flex>
      <v-select
        v-model="selectValue"
        :items="allBeliefs"
        item-text="belief"
        item-value="time"
        label="Glaubenssatz hinzufügen"
        no-data-text="Noch keine Glaubenssätze vorhanden"
        @change="addFromSelect"
      ></v-select>
    </v-flex>

    <v-flex class="mt-1">
      <template v-if="showNewInput">
        <v-text-field
          v-model="newBeliefText"
          label="Neuer Glaubenssatz"
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
          Neuen Glaubenssatz
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
  },
  data() {
    return {
      selectedIds: this.selectedBeliefIds.slice(),
      selectValue: null,
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
    addFromSelect(time) {
      if (!time) return;
      if (this.selectedIds.indexOf(time) === -1) {
        this.selectedIds = this.selectedIds.concat([time]);
      }
      var self = this;
      this.$nextTick(function() { self.selectValue = null; });
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
</style>
