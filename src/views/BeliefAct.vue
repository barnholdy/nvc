<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn v-if="step === 1" icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-btn v-else icon @click="prevStep">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-toolbar-title>Handlung planen</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="grey--text body-1">{{ step }} / {{ totalSteps }}</span>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <!-- Only when the wizard was opened without a belief, from the
             Handlungen list. -->
        <belief-act-pick-belief
          v-if="needsBelief"
          v-show="step === 1"
          :beliefs="allBeliefs"
          :patterns="allPatterns"
          :initialValue="beliefTime"
          @changed="beliefTime = $event">
        </belief-act-pick-belief>

        <belief-act-situation
          v-show="step === situationStep"
          :entry="entry"
          :situations="situations"
          :patterns="allPatterns"
          :allBeliefs="everyBelief"
          :initialValue="experiment.situation"
          @changed="experiment.situation = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </belief-act-situation>

        <belief-act-fear
          v-show="step === fearStep"
          :situation="experiment.situation"
          :experiment="experiment"
          @changed="onFearChanged"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </belief-act-fear>
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
          @click="save"
          block large color="primary">
          speichern
        </v-btn>
      </v-footer>
    </v-content>
  </div>
</template>

<script>
import BeliefActPickBelief from '@/views/BeliefActPickBelief.vue';
import BeliefActSituation from '@/views/BeliefActSituation.vue';
import BeliefActFear from '@/views/BeliefActFear.vue';
import { createExperiment, isPlanned } from '@/utils/experiment';
import { beliefStatus } from '@/utils/beliefStatus';
import { beliefCredibility } from '@/utils/credibility';
import { situationsForBelief } from '@/utils/patterns';

// "Gewandelt" and "Gehandelt" — the two stages where a behavioural experiment
// has something to test.
const ACTIONABLE_STATUSES = ['done', 'acted'];

export default {
  name: 'belief-act',
  components: {
    BeliefActPickBelief,
    BeliefActSituation,
    BeliefActFear,
  },
  data() {
    // Without a :time in the route the wizard starts one step earlier and asks
    // which belief this is about.
    const needsBelief = !this.$route.params.time;
    const entry = this.$store.getters.beliefs
      .find(function(b) { return b.time === parseInt(this.$route.params.time, 10); }, this);
    const r = (entry && entry.reflection) || {};
    // With an id, continue that experiment; without, always start a new one —
    // that is how a belief accumulates several runs.
    const wanted = this.$route.params.experimentId
      ? parseInt(this.$route.params.experimentId, 10)
      : null;
    const existing = wanted !== null
      ? (r.experiments || []).find(function(x) { return x.id === wanted; })
      : null;
    return {
      needsBelief: needsBelief,
      beliefTime: entry ? entry.time : null,
      step: 1,
      totalSteps: needsBelief ? 3 : 2,
      experiment: existing
        ? Object.assign({}, existing)
        : createExperiment(Date.now()),
      isFooterFixed: true,
    };
  },
  computed: {
    // Only beliefs that have been through the change wizard: an experiment
    // tests a new perspective, and without one there is nothing to act from.
    // Ordered by the two numbers the buttons show: credibility first, then how
    // many situations the belief appears in — the most believed and most
    // present one is the one worth testing next.
    allBeliefs() {
      const patterns = this.$store.getters.patterns;
      return this.$store.getters.beliefs
        .filter(b => ACTIONABLE_STATUSES.indexOf(beliefStatus(b)) !== -1)
        .map(b => ({
          belief: b,
          credibility: beliefCredibility(patterns, b),
          situations: situationsForBelief(patterns, b.time).length,
        }))
        .sort((x, y) => {
          // Compared at whole points, which is the resolution the readings were
          // given in and the most a slider can be read at. Raw averages differ
          // in the third decimal often enough that the situation count would
          // otherwise never decide anything, while the two bars look identical.
          // Never rated sorts last: "highest first" cannot rank a value nobody
          // gave, and an unrated belief is the least informed choice, not the
          // strongest one.
          const cx = x.credibility === null ? -1 : Math.round(x.credibility);
          const cy = y.credibility === null ? -1 : Math.round(y.credibility);
          if (cx !== cy) return cy - cx;
          if (x.situations !== y.situations) return y.situations - x.situations;
          // Equal on both counts — newest first, as the list did throughout.
          return y.belief.time - x.belief.time;
        })
        .map(s => s.belief);
    },
    // The pick step reads credibility and situation counts off these.
    allPatterns() {
      return this.$store.getters.patterns;
    },
    // Unfiltered, unlike allBeliefs above: the suggestion prompt needs every
    // action that already exists, wherever it sits, so none is proposed twice.
    everyBelief() {
      return this.$store.getters.beliefs;
    },
    // Resolved on demand: in pick mode the belief only exists once chosen.
    entry() {
      if (this.beliefTime === null) return null;
      return this.$store.getters.beliefs.find(b => b.time === this.beliefTime) || null;
    },
    situations() {
      return situationsForBelief(this.$store.getters.patterns, this.beliefTime);
    },
    situationStep() { return this.needsBelief ? 2 : 1; },
    fearStep() { return this.needsBelief ? 3 : 2; },
    isStepComplete() {
      if (this.needsBelief && this.step === 1) return this.beliefTime !== null;
      return this.experiment.situation.trim() !== '';
    },
  },
  methods: {
    onFearChanged(payload) {
      this.experiment.fear = payload.fear;
      this.experiment.fearExpected = payload.fearExpected;
    },
    nextStep() {
      this.step += 1;
      this.$vuetify.goTo(0, { duration: 0 });
    },
    prevStep() {
      this.step -= 1;
      this.$vuetify.goTo(0, { duration: 0 });
    },
    // Stamp plannedAt once steps 1+2 are complete — that starts the 7-day clock
    // and locks the anchor.
    mergedExperiments() {
      const r = (this.entry && this.entry.reflection) || {};
      const list = (r.experiments || []).slice();
      const current = Object.assign({}, this.experiment);
      if (!current.plannedAt && isPlanned(current)) current.plannedAt = Date.now();
      if (!current.situation && !current.fear) {
        return list.filter(function(x) { return x.id !== current.id; });
      }
      const idx = list.findIndex(function(x) { return x.id === current.id; });
      if (idx >= 0) list.splice(idx, 1, current);
      else list.push(current);
      return list;
    },
    save() {
      if (!this.entry) { this.$router.push('/beliefs'); return; }
      const r = this.entry.reflection || {};
      const saved = Object.assign({}, this.entry, {
        reflection: Object.assign({}, r, { experiments: this.mergedExperiments() }),
      });
      this.$store.dispatch('updateBelief', saved);
      // The experiment is now planned — show it where it waits to be carried out.
      this.$router.push({ path: '/actions', query: { tab: 'planned' } });
    },
    close() {
      // Back where the wizard was opened from.
      this.$router.push(this.needsBelief ? '/actions' : '/beliefs');
    },
  },
};
</script>

<style scoped lang="scss">
</style>
