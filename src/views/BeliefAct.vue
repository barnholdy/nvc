<template>
  <div class="wizard-page">
    <v-content>
      <wizard-header title="Handlung planen" :step="step" :total="totalSteps"></wizard-header>
      <div>
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
          @changed="experiment.situation = $event">
        </belief-act-situation>

        <belief-act-fear
          v-show="step === fearStep"
          :situation="experiment.situation"
          :experiment="experiment"
          @changed="onFearChanged">
        </belief-act-fear>
      </div>
      <div class="wizard-bottom-space"></div>
    </v-content>

    <wizard-footer
      :disabled="step < totalSteps && !isStepComplete"
      :nextLabel="step < totalSteps ? 'Weiter' : 'Speichern'"
      @back="back"
      @next="step < totalSteps ? nextStep() : save()"
    ></wizard-footer>
  </div>
</template>

<script>
import BeliefActPickBelief from '@/views/BeliefActPickBelief.vue';
import BeliefActSituation from '@/views/BeliefActSituation.vue';
import BeliefActFear from '@/views/BeliefActFear.vue';
import WizardHeader from '@/components/WizardHeader.vue';
import WizardFooter from '@/components/WizardFooter.vue';
import { createExperiment, isPlanned } from '@/utils/experiment';
import { beliefStatus } from '@/utils/beliefStatus';
import { beliefCredibility } from '@/utils/credibility';
import { situationsForBelief } from '@/utils/patterns';

// "Gewandelt" is the stage where a behavioural experiment has something to
// test: there is a new perspective to act from.
const ACTIONABLE_STATUSES = ['done'];

export default {
  name: 'belief-act',
  components: {
    BeliefActPickBelief,
    BeliefActSituation,
    BeliefActFear,
    WizardHeader,
    WizardFooter,
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
    // On the first step there is nothing to go back to but the way out.
    back() {
      if (this.step === 1) this.close();
      else this.prevStep();
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
