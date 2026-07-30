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

        <belief-add-reaction
          v-show="step === 2"
          :belief="belief"
          :initialValue="withBelief"
          @changed="withBelief = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </belief-add-reaction>

        <belief-add-feeling-need
          v-show="step === 3"
          mode="feelings"
          :belief="belief"
          :taxonomy="taxonomy"
          :initialFeelings="selectedFeelings"
          @change="selectedFeelings = $event">
        </belief-add-feeling-need>

        <belief-add-feeling-need
          v-show="step === 4"
          mode="needs"
          :belief="belief"
          :taxonomy="taxonomy"
          :initialNeeds="selectedNeeds"
          :contextFeelings="selectedFeelings"
          @change="selectedNeeds = $event">
        </belief-add-feeling-need>

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
import BeliefAddReaction from '@/views/BeliefAddReaction.vue';
import BeliefAddFeelingNeed from '@/views/BeliefAddFeelingNeed.vue';
import BeliefAddHypothese from '@/views/BeliefAddHypothese.vue';
import taxonomy from '../assets/taxonomy.json';

export default {
  name: 'belief-add',
  components: {
    BeliefAddBelief,
    BeliefAddReaction,
    BeliefAddFeelingNeed,
    BeliefAddHypothese,
  },
  data() {
    const editEntry = this.$store.getters.beliefs
      .find(function(b) { return b.time === parseInt(this.$route.params.time, 10); }, this);
    return {
      step: 1,
      totalSteps: 5,
      taxonomy: taxonomy,
      editEntry: editEntry || null,
      belief: editEntry ? editEntry.belief : '',
      selectedFeelings: editEntry ? editEntry.feelings || [] : [],
      selectedNeeds: editEntry ? editEntry.needs || [] : [],
      withBelief: editEntry ? editEntry.withBelief || '' : '',
      origin: editEntry && editEntry.reflection ? editEntry.reflection.origin || '' : '',
      isFooterFixed: true,
    };
  },
  computed: {
    isEditMode() {
      return !!this.editEntry;
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
