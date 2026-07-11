<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn v-if="step === 1" icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-btn v-else icon @click="prevStep">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-toolbar-title>{{ isEditMode ? 'Überzeugung bearbeiten' : 'Neue Überzeugung' }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="grey--text body-1">{{ step }} / {{ totalSteps }}</span>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <belief-add-belief
          v-show="step === 1"
          :initialValue="belief"
          @beliefChanged="belief = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </belief-add-belief>

        <belief-add-feeling
          v-show="step === 2"
          :belief="belief"
          :availableFeelings="availableFeelings">
        </belief-add-feeling>

        <belief-add-reaction
          v-show="step === 3"
          :belief="belief"
          :initialValue="withBelief"
          @changed="withBelief = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </belief-add-reaction>

        <belief-add-need
          v-show="step === 4"
          :belief="belief"
          :availableNeeds="availableNeeds">
        </belief-add-need>

        <belief-add-hypothese
          v-show="step === 5"
          :belief="belief"
          :initialValue="origin"
          @changed="origin = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </belief-add-hypothese>

      </v-container>

      <v-footer :fixed="isFooterFixed" color="white elevation-3" height="44">
        <v-btn
          v-if="step < totalSteps"
          :disabled="!isStepComplete"
          @click="nextStep"
          block large color="primary">
          weiter
        </v-btn>
        <v-btn
          v-else
          :disabled="!isStepComplete"
          @click="save"
          block large color="primary">
          speichern
        </v-btn>
      </v-footer>
    </v-content>
  </div>
</template>

<script>
import BeliefAddBelief from '@/views/BeliefAddBelief.vue';
import BeliefAddFeeling from '@/views/BeliefAddFeeling.vue';
import BeliefAddReaction from '@/views/BeliefAddReaction.vue';
import BeliefAddNeed from '@/views/BeliefAddNeed.vue';
import BeliefAddHypothese from '@/views/BeliefAddHypothese.vue';
import availableFeelingsSrc from '../assets/feelings.json';
import availableNeedsSrc from '../assets/needs.json';

function buildFeelings(selectedFeelings) {
  return availableFeelingsSrc.feelings.filter(function(f) { return f.rank >= -80; }).map(function(f) {
    return Object.assign({}, f, { isSelected: selectedFeelings.some(function(sf) { return sf.name === f.name; }) });
  });
}

function buildNeeds(selectedNeeds) {
  return availableNeedsSrc.needs.filter(function(n) { return n.rank >= -80; }).map(function(n) {
    return Object.assign({}, n, { isSelected: selectedNeeds.some(function(sn) { return sn.name === n.name; }) });
  });
}

export default {
  name: 'belief-add',
  components: {
    BeliefAddBelief,
    BeliefAddFeeling,
    BeliefAddReaction,
    BeliefAddNeed,
    BeliefAddHypothese,
  },
  data() {
    const editEntry = this.$store.getters.beliefs
      .find(function(b) { return b.time === parseInt(this.$route.params.time, 10); }, this);
    return {
      step: 1,
      totalSteps: 5,
      editEntry: editEntry || null,
      belief: editEntry ? editEntry.belief : '',
      availableFeelings: buildFeelings(editEntry ? editEntry.feelings || [] : []),
      availableNeeds: buildNeeds(editEntry ? editEntry.needs || [] : []),
      withBelief: editEntry ? editEntry.withBelief || '' : '',
      origin: editEntry && editEntry.reflection ? editEntry.reflection.origin || '' : '',
      isFooterFixed: true,
    };
  },
  computed: {
    isEditMode() {
      return !!this.editEntry;
    },
    selectedFeelings() {
      return this.availableFeelings.filter(function(f) { return f.isSelected; });
    },
    selectedNeeds() {
      return this.availableNeeds.filter(function(n) { return n.isSelected; });
    },
    isStepComplete() {
      if (this.step === 1) return this.belief.trim() !== '';
      return true;
    },
  },
  methods: {
    nextStep() {
      this.step += 1;
      this.$vuetify.goTo(0, { duration: 0 });
    },
    prevStep() {
      this.step -= 1;
      this.$vuetify.goTo(0, { duration: 0 });
    },
    save() {
      var existingReflection = this.editEntry ? (this.editEntry.reflection || {}) : {};
      const payload = {
        belief: this.belief,
        feelings: this.selectedFeelings,
        withBelief: this.withBelief,
        needs: this.selectedNeeds,
        reflection: Object.assign({ withoutBelief: '', turnarounds: [], changeAct: '' }, existingReflection, { origin: this.origin }),
      };
      if (this.isEditMode) {
        this.$store.dispatch('updateBelief', Object.assign({}, this.editEntry, payload));
      } else {
        this.$store.dispatch('saveBelief', payload);
      }
      this.$router.push('/beliefs');
    },
    close() {
      this.$router.push('/beliefs');
    },
  },
};
</script>

<style scoped lang="scss">
</style>
