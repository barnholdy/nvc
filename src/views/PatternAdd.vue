<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn v-if="step === 1" icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-btn v-else icon @click="prevStep">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-toolbar-title>{{ isEditMode ? (editEntry.name || editEntry.belief) : 'Meine Muster' }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="grey--text body-1">{{ step }} / {{ totalSteps }}</span>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <pattern-add-trigger
          v-show="step === 1"
          :initialValue="trigger"
          @changed="trigger = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-trigger>

        <pattern-add-belief
          v-show="step === 2"
          :initialValue="belief"
          @beliefChanged="belief = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-belief>

        <pattern-add-reaction
          v-show="step === 3"
          :belief="belief"
          :availableFeelings="availableFeelings">
        </pattern-add-reaction>

        <pattern-add-with-belief
          v-show="step === 4"
          :belief="belief"
          :initialValue="withBelief"
          @changed="withBelief = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-with-belief>

        <pattern-add-need
          v-show="step === 5"
          :belief="belief"
          :availableNeeds="availableNeeds">
        </pattern-add-need>

        <pattern-add-origin
          v-show="step === 6"
          :belief="belief"
          :initialValue="origin"
          @changed="origin = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-origin>

        <pattern-add-name
          v-show="step === 7"
          :belief="belief"
          :trigger="trigger"
          :withBelief="withBelief"
          :origin="origin"
          :selectedFeelings="selectedFeelings"
          :selectedNeeds="selectedNeeds"
          :initialValue="name"
          @changed="name = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-name>
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
import PatternAddName from '@/views/PatternAddName.vue';
import PatternAddTrigger from '@/views/PatternAddTrigger.vue';
import PatternAddReaction from '@/views/PatternAddReaction.vue';
import PatternAddBelief from '@/views/PatternAddBelief.vue';
import PatternAddWithBelief from '@/views/PatternAddWithBelief.vue';
import PatternAddOrigin from '@/views/PatternAddOrigin.vue';
import PatternAddNeed from '@/views/PatternAddNeed.vue';
import availableFeelingsSrc from '../assets/feelings.json';
import availableNeedsSrc from '../assets/needs.json';

function buildFeelings(selectedFeelings) {
  return availableFeelingsSrc.feelings.filter(f => f.rank >= -80).map(f => ({
    ...f,
    isSelected: selectedFeelings.some(sf => sf.name === f.name),
  }));
}

function buildNeeds(selectedNeeds) {
  return availableNeedsSrc.needs.filter(n => n.rank >= -80).map(n => ({
    ...n,
    isSelected: selectedNeeds.some(sn => sn.name === n.name),
  }));
}

export default {
  name: 'pattern-add',
  components: {
    PatternAddName,
    PatternAddTrigger,
    PatternAddReaction,
    PatternAddBelief,
    PatternAddWithBelief,
    PatternAddOrigin,
    PatternAddNeed,
  },
  data() {
    const editEntry = this.$store.getters.patterns
      .find(p => p.time === parseInt(this.$route.params.time, 10));
    return {
      step: 1,
      totalSteps: 7,
      editEntry: editEntry || null,
      name: editEntry ? editEntry.name || '' : '',
      trigger: editEntry ? editEntry.trigger || '' : '',
      availableFeelings: buildFeelings(editEntry ? editEntry.feelings || [] : []),
      availableNeeds: buildNeeds(editEntry ? editEntry.needs || [] : []),
      belief: editEntry ? editEntry.belief : '',
      withBelief: editEntry ? editEntry.withBelief : '',
      origin: editEntry ? editEntry.origin || '' : '',
      isFooterFixed: true,
    };
  },
  computed: {
    isEditMode() {
      return !!this.editEntry;
    },
    selectedFeelings() {
      return this.availableFeelings.filter(f => f.isSelected);
    },
    selectedNeeds() {
      return this.availableNeeds.filter(n => n.isSelected);
    },
    isStepComplete() {
      if (this.step === 1) return this.trigger.trim() !== '';
      if (this.step === 2) return this.belief.trim() !== '';
      if (this.step === 3) return this.selectedFeelings.length > 0;
      if (this.step === 4) return this.withBelief.trim() !== '';
      if (this.step === 5) return this.selectedNeeds.length > 0;
      if (this.step === 6) return this.origin.trim() !== '';
      if (this.step === 7) return this.name.trim() !== '';
      return false;
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
      const payload = {
        name: this.name,
        trigger: this.trigger,
        feelings: this.selectedFeelings,
        needs: this.selectedNeeds,
        belief: this.belief,
        withBelief: this.withBelief,
        origin: this.origin,
      };
      if (this.isEditMode) {
        this.$store.dispatch('updatePattern', { ...this.editEntry, ...payload });
      } else {
        this.$store.dispatch('savePattern', payload);
      }
      this.$router.push('/patterns');
    },
    close() {
      this.$router.push('/patterns');
    },
  },
};
</script>

<style scoped lang="scss">
</style>
