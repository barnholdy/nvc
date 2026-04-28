<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn v-if="step === 1" icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-btn v-else icon @click="prevStep">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-toolbar-title>{{ isEditMode ? 'Muster bearbeiten' : 'Muster' }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="grey--text body-1">{{ step }} / {{ totalSteps }}</span>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <pattern-add-name
          v-show="step === 1"
          :initialValue="name"
          @changed="name = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-name>

        <pattern-add-trigger
          v-show="step === 2"
          :initialValue="trigger"
          @changed="trigger = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-trigger>

        <pattern-add-reaction
          v-show="step === 3"
          :availableFeelings="availableFeelings">
        </pattern-add-reaction>

        <pattern-add-narrative
          v-show="step === 4"
          :initialValue="narrative"
          @changed="narrative = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-narrative>

        <pattern-add-origin
          v-show="step === 5"
          :initialValue="origin"
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
import PatternAddName from '@/views/PatternAddName.vue';
import PatternAddTrigger from '@/views/PatternAddTrigger.vue';
import PatternAddReaction from '@/views/PatternAddReaction.vue';
import PatternAddNarrative from '@/views/PatternAddNarrative.vue';
import PatternAddOrigin from '@/views/PatternAddOrigin.vue';
import availableFeelingsSrc from '../assets/feelings.json';

function buildFeelings(selectedFeelings) {
  return availableFeelingsSrc.feelings.filter(f => f.rank >= -80).map(f => ({
    ...f,
    isSelected: selectedFeelings.some(sf => sf.name === f.name),
  }));
}

export default {
  name: 'pattern-add',
  components: {
    PatternAddName,
    PatternAddTrigger,
    PatternAddReaction,
    PatternAddNarrative,
    PatternAddOrigin,
  },
  data() {
    const editEntry = this.$store.getters.patterns
      .find(p => p.time === parseInt(this.$route.params.time, 10));
    return {
      step: 1,
      totalSteps: 5,
      editEntry: editEntry || null,
      name: editEntry ? editEntry.name || '' : '',
      trigger: editEntry ? editEntry.trigger : '',
      availableFeelings: buildFeelings(editEntry ? editEntry.feelings : []),
      narrative: editEntry ? editEntry.narrative : '',
      origin: editEntry ? editEntry.origin : '',
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
    isStepComplete() {
      if (this.step === 1) return this.name.trim() !== '';
      if (this.step === 2) return this.trigger.trim() !== '';
      if (this.step === 3) return this.selectedFeelings.length > 0;
      if (this.step === 4) return this.narrative.trim() !== '';
      if (this.step === 5) return this.origin.trim() !== '';
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
        narrative: this.narrative,
        origin: this.origin,
      };
      if (this.isEditMode) {
        this.$store.dispatch('updatePattern', { time: this.editEntry.time, ...payload });
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
