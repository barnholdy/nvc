<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn v-if="step === 1" icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-btn v-else icon @click="prevStep">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-toolbar-title>Handeln</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="grey--text body-1">{{ step }} / {{ totalSteps }}</span>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <belief-act-situation
          v-show="step === 1"
          :belief="entry ? entry.belief : ''"
          :initialValue="experiment.situation"
          @changed="experiment.situation = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </belief-act-situation>

        <belief-act-fear
          v-show="step === 2"
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
          :disabled="!experiment.situation.trim()"
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
import BeliefActSituation from '@/views/BeliefActSituation.vue';
import BeliefActFear from '@/views/BeliefActFear.vue';
import { createExperiment, isPlanned } from '@/utils/experiment';

export default {
  name: 'belief-act',
  components: {
    BeliefActSituation,
    BeliefActFear,
  },
  data() {
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
      entry: entry || null,
      step: 1,
      totalSteps: 2,
      experiment: existing
        ? Object.assign({}, existing)
        : createExperiment(Date.now()),
      isFooterFixed: true,
    };
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
      this.$router.push('/beliefs');
    },
  },
};
</script>

<style scoped lang="scss">
</style>
