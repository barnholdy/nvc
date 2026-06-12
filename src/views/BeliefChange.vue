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
        <belief-add-hypothese
          v-show="step === 1"
          :belief="entry ? entry.belief : ''"
          :initialValue="origin"
          @changed="origin = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </belief-add-hypothese>

        <pattern-add-without-belief
          v-show="step === 2"
          :belief="entry ? entry.belief : ''"
          :initialValue="withoutBelief"
          @changed="withoutBelief = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-without-belief>

        <belief-change-turnaround
          v-show="step === 3"
          :belief="entry ? entry.belief : ''"
          :initialTurnarounds="turnarounds"
          @changed="turnarounds = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </belief-change-turnaround>

        <pattern-change-affirmation
          v-show="step === 4"
          :belief="entry ? entry.belief : ''"
          :initialAffirmations="affirmations"
          @changed="affirmations = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-change-affirmation>

        <pattern-change-act
          v-show="step === 5"
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
import BeliefAddHypothese from '@/views/BeliefAddHypothese.vue';
import PatternAddWithoutBelief from '@/views/PatternAddWithoutBelief.vue';
import BeliefChangeTurnaround from '@/views/BeliefChangeTurnaround.vue';
import PatternChangeAffirmation from '@/views/PatternChangeAffirmation.vue';
import PatternChangeAct from '@/views/PatternChangeAct.vue';

export default {
  name: 'belief-change',
  components: {
    BeliefAddHypothese,
    PatternAddWithoutBelief,
    BeliefChangeTurnaround,
    PatternChangeAffirmation,
    PatternChangeAct,
  },
  data() {
    const entry = this.$store.getters.beliefs
      .find(function(b) { return b.time === parseInt(this.$route.params.time, 10); }, this);
    const r = entry && entry.reflection ? entry.reflection : {};
    return {
      entry: entry || null,
      step: 1,
      totalSteps: 5,
      origin: r.origin || '',
      withoutBelief: r.withoutBelief || '',
      turnarounds: r.turnarounds || [],
      affirmations: entry ? entry.affirmations || [] : [],
      changeAct: r.changeAct || '',
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
        affirmations: this.affirmations,
        reflection: {
          origin: this.origin,
          withoutBelief: this.withoutBelief,
          turnarounds: this.turnarounds,
          changeAct: this.changeAct,
        },
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
