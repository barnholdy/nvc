<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Glaubenssätze</h1>
      <p class="body-1 grey--text mt-2">Welche Glaubenssätze sind mit diesem Muster verbunden?</p>
    </v-flex>

    <v-flex>
      <v-select
        v-model="selectedIds"
        :items="allBeliefs"
        item-text="belief"
        item-value="time"
        multiple
        chips
        deletable-chips
        label="Glaubenssätze auswählen"
        no-data-text="Noch keine Glaubenssätze vorhanden"
      ></v-select>
    </v-flex>

    <v-flex class="mt-2">
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
      showNewInput: false,
      newBeliefText: '',
    };
  },
  watch: {
    selectedIds: function(val) {
      this.$emit('changed', val.slice());
    },
  },
  methods: {
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
</style>
