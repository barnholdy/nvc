<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn v-if="step === 1" icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-btn v-else icon @click="prevStep">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-toolbar-title>{{ entry ? entry.belief : '' }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="grey--text body-1">{{ step }} / {{ totalSteps }}</span>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <pattern-add-without-belief
          v-show="step === 1"
          :belief="entry ? entry.belief : ''"
          :initialValue="withoutBelief"
          @changed="withoutBelief = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-without-belief>

        <belief-change-turnaround
          v-show="step === 2"
          :belief="entry ? entry.belief : ''"
          :initialTurnarounds="turnarounds"
          @changed="turnarounds = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </belief-change-turnaround>

        <pattern-change-affirmation
          v-show="step === 3"
          :belief="entry ? entry.belief : ''"
          :initialAffirmations="affirmations"
          @changed="affirmations = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-change-affirmation>

        <pattern-change-act
          v-show="step === 4"
          :belief="entry ? entry.belief : ''"
          :initialValue="changeAct"
          @changed="changeAct = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-change-act>
      </v-container>

      <v-footer :fixed="isFooterFixed" color="white elevation-3" height="44">
        <v-btn
          v-if="step < totalSteps"
          @click="nextStep"
          block large color="primary">
          weiter
        </v-btn>
        <v-btn
          v-else
          @click="save"
          block large color="primary">
          speichern
        </v-btn>
      </v-footer>
    </v-content>
  </div>
</template>

<script>
import PatternAddWithoutBelief from '@/views/PatternAddWithoutBelief.vue';
import BeliefChangeTurnaround from '@/views/BeliefChangeTurnaround.vue';
import PatternChangeAffirmation from '@/views/PatternChangeAffirmation.vue';
import PatternChangeAct from '@/views/PatternChangeAct.vue';

export default {
  name: 'belief-change',
  components: {
    PatternAddWithoutBelief,
    BeliefChangeTurnaround,
    PatternChangeAffirmation,
    PatternChangeAct,
  },
  data() {
    const entry = this.$store.getters.beliefs
      .find(function(b) { return b.time === parseInt(this.$route.params.time, 10); }, this);
    return {
      entry: entry || null,
      step: 1,
      totalSteps: 4,
      withoutBelief: entry ? entry.withoutBelief || '' : '',
      turnarounds: entry ? entry.turnarounds || [] : [],
      affirmations: entry ? entry.affirmations || [] : [],
      changeAct: entry ? entry.changeAct || '' : '',
      isFooterFixed: true,
    };
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
      this.$store.dispatch('updateBelief', Object.assign({}, this.entry, {
        withoutBelief: this.withoutBelief,
        turnarounds: this.turnarounds,
        affirmations: this.affirmations,
        changeAct: this.changeAct,
      }));
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
