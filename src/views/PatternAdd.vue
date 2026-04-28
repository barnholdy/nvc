<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn v-if="step === 1" icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-btn v-else icon @click="prevStep">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-toolbar-title>Muster</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="grey--text body-1">{{ step }} / {{ totalSteps }}</span>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <pattern-add-trigger
          v-show="step === 1"
          @changed="trigger = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-trigger>

        <pattern-add-reaction
          v-show="step === 2"
          :availableFeelings="availableFeelings">
        </pattern-add-reaction>

        <pattern-add-narrative
          v-show="step === 3"
          @changed="narrative = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-narrative>

        <pattern-add-origin
          v-show="step === 4"
          @changed="origin = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-origin>
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
import PatternAddTrigger from '@/views/PatternAddTrigger.vue';
import PatternAddReaction from '@/views/PatternAddReaction.vue';
import PatternAddNarrative from '@/views/PatternAddNarrative.vue';
import PatternAddOrigin from '@/views/PatternAddOrigin.vue';
import availableFeelingsSrc from '../assets/feelings.json';

export default {
  name: 'pattern-add',
  components: {
    PatternAddTrigger,
    PatternAddReaction,
    PatternAddNarrative,
    PatternAddOrigin,
  },
  data() {
    return {
      step: 1,
      totalSteps: 4,
      trigger: '',
      availableFeelings: availableFeelingsSrc.feelings.filter(f => f.rank >= -80),
      narrative: '',
      origin: '',
      isFooterFixed: true,
    };
  },
  computed: {
    selectedFeelings() {
      return this.availableFeelings.filter(f => f.isSelected);
    },
    isStepComplete() {
      if (this.step === 1) return this.trigger.trim() !== '';
      if (this.step === 2) return this.selectedFeelings.length > 0;
      if (this.step === 3) return this.narrative.trim() !== '';
      if (this.step === 4) return this.origin.trim() !== '';
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
      this.$store.dispatch('savePattern', {
        trigger: this.trigger,
        feelings: this.selectedFeelings,
        narrative: this.narrative,
        origin: this.origin,
      });
      this.$router.push('/patterns');
      this.reset();
    },
    close() {
      this.$router.push('/patterns');
      this.reset();
    },
    reset() {
      this.step = 1;
      this.trigger = '';
      this.availableFeelings = availableFeelingsSrc.feelings.filter(f => f.rank >= -80);
      this.narrative = '';
      this.origin = '';
    },
  },
};
</script>

<style scoped lang="scss">
</style>
