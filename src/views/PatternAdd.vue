<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn v-if="step === 1" icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-btn v-else icon @click="prevStep">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-toolbar-title>{{ isEditMode ? 'Muster bearbeiten' : 'Meine Muster' }}</v-toolbar-title>
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

        <pattern-add-is-true
          v-show="step === 3"
          :belief="belief"
          :initialValue="isTrue"
          @answered="isTrue = $event">
        </pattern-add-is-true>

        <pattern-add-is-really-true
          v-show="step === 4"
          :belief="belief"
          :initialValue="isReallyTrue"
          @answered="isReallyTrue = $event">
        </pattern-add-is-really-true>

        <pattern-add-reaction
          v-show="step === 5"
          :belief="belief"
          :availableFeelings="availableFeelings">
        </pattern-add-reaction>

        <pattern-add-with-belief
          v-show="step === 6"
          :belief="belief"
          :initialValue="withBelief"
          @changed="withBelief = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-with-belief>

        <pattern-add-origin
          v-show="step === 7"
          :belief="belief"
          :initialValue="origin"
          @changed="origin = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-origin>

        <pattern-add-without-belief
          v-show="step === 8"
          :belief="belief"
          :initialValue="withoutBelief"
          @changed="withoutBelief = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-without-belief>

        <pattern-add-turnaround
          v-show="step === 9"
          :belief="belief"
          :initialValue="turnaround"
          @changed="turnaround = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-turnaround>

        <pattern-add-name
          v-show="step === 10"
          :belief="belief"
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
import PatternAddIsTrue from '@/views/PatternAddIsTrue.vue';
import PatternAddIsReallyTrue from '@/views/PatternAddIsReallyTrue.vue';
import PatternAddWithBelief from '@/views/PatternAddWithBelief.vue';
import PatternAddOrigin from '@/views/PatternAddOrigin.vue';
import PatternAddWithoutBelief from '@/views/PatternAddWithoutBelief.vue';
import PatternAddTurnaround from '@/views/PatternAddTurnaround.vue';
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
    PatternAddBelief,
    PatternAddIsTrue,
    PatternAddIsReallyTrue,
    PatternAddWithBelief,
    PatternAddOrigin,
    PatternAddWithoutBelief,
    PatternAddTurnaround,
  },
  data() {
    const editEntry = this.$store.getters.patterns
      .find(p => p.time === parseInt(this.$route.params.time, 10));
    return {
      step: 1,
      totalSteps: 10,
      editEntry: editEntry || null,
      name: editEntry ? editEntry.name || '' : '',
      trigger: editEntry ? editEntry.trigger || '' : '',
      availableFeelings: buildFeelings(editEntry ? editEntry.feelings || [] : []),
      belief: editEntry ? editEntry.belief : '',
      isTrue: editEntry ? editEntry.isTrue : null,
      isReallyTrue: editEntry ? editEntry.isReallyTrue : null,
      withBelief: editEntry ? editEntry.withBelief : '',
      origin: editEntry ? editEntry.origin || '' : '',
      withoutBelief: editEntry ? editEntry.withoutBelief : '',
      turnaround: editEntry ? editEntry.turnaround : '',
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
      if (this.step === 1) return this.trigger.trim() !== '';
      if (this.step === 2) return this.belief.trim() !== '';
      if (this.step === 3) return this.isTrue !== null;
      if (this.step === 4) return this.isReallyTrue !== null;
      if (this.step === 5) return this.selectedFeelings.length > 0;
      if (this.step === 6) return this.withBelief.trim() !== '';
      if (this.step === 7) return this.origin.trim() !== '';
      if (this.step === 8) return this.withoutBelief.trim() !== '';
      if (this.step === 9) return this.turnaround.trim() !== '';
      if (this.step === 10) return this.name.trim() !== '';
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
        belief: this.belief,
        isTrue: this.isTrue,
        isReallyTrue: this.isReallyTrue,
        withBelief: this.withBelief,
        origin: this.origin,
        withoutBelief: this.withoutBelief,
        turnaround: this.turnaround,
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
