<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Beliefs</h1>
      <p class="body-1 grey--text mt-2">Welche Glaubenssätze sind mit diesem Muster verbunden?</p>
    </v-flex>

    <v-flex v-if="allBeliefs.length === 0 && !showNewInput" class="mb-2">
      <p class="body-1 grey--text">Noch keine Beliefs vorhanden.</p>
    </v-flex>

    <v-flex v-for="b in allBeliefs" :key="b.time" class="belief-row">
      <v-checkbox
        :label="b.belief"
        :input-value="isSelected(b.time)"
        @change="toggleBelief(b.time, $event)"
        hide-details
        color="primary"
      ></v-checkbox>
    </v-flex>

    <v-flex class="mt-3">
      <template v-if="showNewInput">
        <v-text-field
          v-model="newBeliefText"
          label="Neuer Belief"
          placeholder="Ich bin nicht gut genug..."
          single-line
          hide-details
          autofocus
          class="mb-2"
          @keyup.enter="createBelief"
        ></v-text-field>
        <v-btn small flat color="primary" :disabled="!newBeliefText.trim()" @click="createBelief">Hinzufügen</v-btn>
        <v-btn small flat color="grey" @click="showNewInput = false; newBeliefText = ''">Abbrechen</v-btn>
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
      showNewInput: false,
      newBeliefText: '',
    };
  },
  methods: {
    isSelected(time) {
      return this.selectedIds.indexOf(time) !== -1;
    },
    toggleBelief(time, val) {
      if (val) {
        if (this.selectedIds.indexOf(time) === -1) {
          this.selectedIds.push(time);
        }
      } else {
        var idx = this.selectedIds.indexOf(time);
        if (idx !== -1) {
          this.selectedIds.splice(idx, 1);
        }
      }
      this.$emit('changed', this.selectedIds.slice());
    },
    createBelief() {
      if (!this.newBeliefText.trim()) return;
      var time = +new Date();
      this.$store.dispatch('saveBelief', { time: time, belief: this.newBeliefText.trim() });
      this.selectedIds.push(time);
      this.$emit('changed', this.selectedIds.slice());
      this.newBeliefText = '';
      this.showNewInput = false;
    },
  },
};
</script>

<style scoped lang="scss">
.belief-row {
  margin-bottom: 4px;
}
</style>
