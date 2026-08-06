<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn v-if="step === 1" icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-btn v-else icon @click="prevStep">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-toolbar-title>{{ isEditMode ? 'Situation bearbeiten' : 'Neue Situation' }}</v-toolbar-title>
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

        <pattern-add-beliefs
          v-show="step === 2"
          :allBeliefs="allBeliefs"
          :selectedBeliefIds="selectedBeliefIds"
          :initialTruths="beliefTruths"
          :trigger="trigger"
          @changed="selectedBeliefIds = $event"
          @truthsChanged="beliefTruths = $event">
        </pattern-add-beliefs>
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
import PatternAddBeliefs from '@/views/PatternAddBeliefs.vue';

export default {
  name: 'pattern-add',
  components: {
    PatternAddTrigger,
    PatternAddBeliefs,
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
      isFooterFixed: true,
    };
  },
  computed: {
    isEditMode() {
      return !!this.editEntry;
    },
    allBeliefs() {
      return this.$store.getters.beliefs;
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
