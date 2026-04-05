<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn v-if="isFirstStep" icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-btn v-else icon @click="prevStep">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-toolbar-title>The Work</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="grey--text body-1">{{ step }} / {{ totalSteps }}</span>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <the-work-add-belief
          v-show="step === 1"
          @beliefChanged="belief = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </the-work-add-belief>

        <the-work-add-is-true
          v-show="step === 2"
          :belief="belief"
          @answered="isTrue = $event">
        </the-work-add-is-true>

        <the-work-add-is-really-true
          v-show="step === 3"
          :belief="belief"
          @answered="isReallyTrue = $event">
        </the-work-add-is-really-true>

        <the-work-add-with-belief
          v-show="step === 4"
          :belief="belief"
          @changed="withBelief = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </the-work-add-with-belief>

        <the-work-add-without-belief
          v-show="step === 5"
          :belief="belief"
          @changed="withoutBelief = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </the-work-add-without-belief>

        <the-work-add-turnaround
          v-show="step === 6"
          :belief="belief"
          @changed="turnaround = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </the-work-add-turnaround>
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
import TheWorkAddBelief from '@/views/TheWorkAddBelief.vue';
import TheWorkAddIsTrue from '@/views/TheWorkAddIsTrue.vue';
import TheWorkAddIsReallyTrue from '@/views/TheWorkAddIsReallyTrue.vue';
import TheWorkAddWithBelief from '@/views/TheWorkAddWithBelief.vue';
import TheWorkAddWithoutBelief from '@/views/TheWorkAddWithoutBelief.vue';
import TheWorkAddTurnaround from '@/views/TheWorkAddTurnaround.vue';

export default {
  name: 'the-work-add',
  components: {
    TheWorkAddBelief,
    TheWorkAddIsTrue,
    TheWorkAddIsReallyTrue,
    TheWorkAddWithBelief,
    TheWorkAddWithoutBelief,
    TheWorkAddTurnaround,
  },
  data() {
    return {
      step: 1,
      totalSteps: 6,
      belief: '',
      isTrue: null,
      isReallyTrue: null,
      withBelief: '',
      withoutBelief: '',
      turnaround: '',
      isFooterFixed: true,
    };
  },
  computed: {
    isStepComplete() {
      if (this.step === 1) return this.belief.trim() !== '';
      if (this.step === 2) return this.isTrue !== null;
      if (this.step === 3) return this.isReallyTrue !== null;
      if (this.step === 4) return this.withBelief.trim() !== '';
      if (this.step === 5) return this.withoutBelief.trim() !== '';
      if (this.step === 6) return this.turnaround.trim() !== '';
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
      this.$store.dispatch('saveTheWork', {
        belief: this.belief,
        isTrue: this.isTrue,
        isReallyTrue: this.isReallyTrue,
        withBelief: this.withBelief,
        withoutBelief: this.withoutBelief,
        turnaround: this.turnaround,
      });
      this.$router.push('/the-work');
      this.reset();
    },
    close() {
      this.$router.push('/the-work');
      this.reset();
    },
    reset() {
      this.step = 1;
      this.belief = '';
      this.isTrue = null;
      this.isReallyTrue = null;
      this.withBelief = '';
      this.withoutBelief = '';
      this.turnaround = '';
    },
  },
};
</script>

<style scoped lang="scss">
</style>
