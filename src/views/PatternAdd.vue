<template>
  <div class="wizard-page">
    <v-content>
      <wizard-header
        :title="isEditMode ? 'Situation bearbeiten' : 'Neue Situation'"
        :step="step"
        :total="totalSteps"
      ></wizard-header>

      <pattern-add-trigger
        v-show="step === 1"
        :initialValue="trigger"
        @changed="trigger = $event">
      </pattern-add-trigger>

      <pattern-add-beliefs
        v-show="step === 2"
        :allBeliefs="allBeliefs"
        :patterns="allPatterns"
        :selectedBeliefIds="selectedBeliefIds"
        :initialTruths="beliefTruths"
        :trigger="trigger"
        @changed="selectedBeliefIds = $event"
        @truthsChanged="beliefTruths = $event">
      </pattern-add-beliefs>

      <div class="wizard-bottom-space"></div>
    </v-content>

    <wizard-footer
      :disabled="!isStepComplete"
      :nextLabel="step < totalSteps ? 'Weiter' : 'Speichern'"
      @back="back"
      @next="step < totalSteps ? nextStep() : save()"
    ></wizard-footer>
  </div>
</template>

<script>
import PatternAddTrigger from '@/views/PatternAddTrigger.vue';
import PatternAddBeliefs from '@/views/PatternAddBeliefs.vue';
import WizardHeader from '@/components/WizardHeader.vue';
import WizardFooter from '@/components/WizardFooter.vue';

export default {
  name: 'pattern-add',
  components: {
    PatternAddTrigger,
    PatternAddBeliefs,
    WizardHeader,
    WizardFooter,
  },
  data() {
    var editEntry = this.$store.getters.patterns
      .find(function(p) { return p.time === parseInt(this.$route.params.time, 10); }, this);
    return {
      step: 1,
      totalSteps: 2,
      editEntry: editEntry || null,
      trigger: editEntry ? editEntry.trigger || '' : '',
      selectedBeliefIds: editEntry ? editEntry.beliefs || [] : [],
      beliefTruths: editEntry ? editEntry.beliefTruths || {} : {},
    };
  },
  computed: {
    isEditMode() {
      return !!this.editEntry;
    },
    allBeliefs() {
      return this.$store.getters.beliefs;
    },
    // So the "schon erfasst" list can show the same credibility number the
    // belief cards do.
    allPatterns() {
      return this.$store.getters.patterns;
    },
    isStepComplete() {
      if (this.step === 2) return this.selectedBeliefIds.length > 0;
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
    // On the first step there is nothing to go back to but the way out.
    back() {
      if (this.step === 1) this.close();
      else this.prevStep();
    },
    save() {
      var payload = {
        trigger: this.trigger,
        beliefs: this.selectedBeliefIds,
        // How true each belief was held at this point in time. Stored on the
        // situation, so repeated situations form a trend per belief.
        beliefTruths: this.beliefTruths,
      };
      if (this.isEditMode) {
        this.$store.dispatch('updatePattern', Object.assign({}, this.editEntry, payload));
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
