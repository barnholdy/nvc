<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn v-if="step === 1" icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-btn v-else icon @click="prevStep">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-toolbar-title>Überzeugung verändern</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="grey--text body-1">{{ step }} / {{ totalSteps }}</span>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <belief-change-absoluteness
          v-show="step === 1"
          :belief="entry ? entry.belief : ''"
          :initialValue="exceptions"
          @changed="exceptions = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </belief-change-absoluteness>

        <pattern-add-without-belief
          v-show="step === 2"
          :belief="entry ? entry.belief : ''"
          :initialValue="withoutBelief"
          @changed="withoutBelief = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-without-belief>

        <belief-add-feeling-need
          v-show="step === 3"
          mode="feelings"
          headline="Neue Gefühle"
          prompt="Bleib einen Moment in dieser Vorstellung. Was passiert im Körper? Wird etwas leichter, weiter, wärmer — oder bleibt es gleich?"
          :belief="entry ? entry.belief : ''"
          :perspective="withoutBelief"
          :taxonomy="taxonomy"
          :initialFeelings="withoutBeliefFeelings"
          @change="withoutBeliefFeelings = $event">
          <v-flex slot="beforeList" class="mb-4">
            <p class="body-1 grey--text mb-2">Wie stark ist diese Empfindung gerade? 0 = nichts, 10 = deutlich.</p>
            <div class="slider-row">
              <span class="slider-end-label">0</span>
              <input type="range" min="0" max="10" v-model.number="bodyIntensity" class="intensity-slider" />
              <span class="slider-end-label">10</span>
            </div>
            <p class="slider-value-label">{{ bodyIntensity }}</p>
            <div v-if="bodyIntensity < INTENSITY_THRESHOLD" class="intensity-hint">
              <p class="intensity-hint-text">
                Noch zu weit weg. Gehen wir kleiner: Wo kannst du die Perspektive ändern,
                dass sie greifbarer für dich wird?
              </p>
              <v-btn small flat color="primary" class="ml-0" @click="goToStep(2)">
                <v-icon small left>chevron_left</v-icon>
                Zurück zur neuen Perspektive
              </v-btn>
            </div>
          </v-flex>
        </belief-add-feeling-need>

        <pattern-change-affirmation
          v-show="step === 4"
          :belief="entry ? entry.belief : ''"
          :withoutBelief="withoutBelief"
          :withoutBeliefFeelings="withoutBeliefFeelings"
          :initialAffirmations="affirmations"
          :allAffirmations="allAffirmations"
          @changed="affirmations = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-change-affirmation>

        <pattern-change-act
          v-show="step === 5"
          :belief="entry ? entry.belief : ''"
          :withoutBelief="withoutBelief"
          :withoutBeliefFeelings="withoutBeliefFeelings"
          :affirmations="affirmations"
          :initialActs="changeActs"
          :allActs="allActs"
          @changed="changeActs = $event"
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
import BeliefChangeAbsoluteness from '@/views/BeliefChangeAbsoluteness.vue';
import PatternAddWithoutBelief from '@/views/PatternAddWithoutBelief.vue';
import BeliefAddFeelingNeed from '@/views/BeliefAddFeelingNeed.vue';
import PatternChangeAffirmation from '@/views/PatternChangeAffirmation.vue';
import PatternChangeAct from '@/views/PatternChangeAct.vue';
import taxonomy from '../assets/taxonomy.json';
import { beliefStatus } from '@/utils/beliefStatus';

// Below this the body sensation counts as "not there yet" and the wizard offers
// a way back to reshape the new perspective.
const INTENSITY_THRESHOLD = 4;

export default {
  name: 'belief-change',
  components: {
    BeliefChangeAbsoluteness,
    PatternAddWithoutBelief,
    BeliefAddFeelingNeed,
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
      taxonomy: taxonomy,
      exceptions: r.exceptions || '',
      // Midpoint so the "too far away" hint does not fire before it is touched.
      bodyIntensity: typeof r.bodyIntensity === 'number' ? r.bodyIntensity : 5,
      withoutBelief: r.withoutBelief || '',
      withoutBeliefFeelings: r.withoutBeliefFeelings || [],
      affirmations: entry ? entry.affirmations || [] : [],
      changeActs: r.changeActs || (r.changeAct ? r.changeAct.split('\n').filter(Boolean) : []),
      isFooterFixed: true,
    };
  },
  computed: {
    INTENSITY_THRESHOLD() { return INTENSITY_THRESHOLD; },
    allActs() {
      var seen = {};
      var result = [];
      this.$store.getters.beliefs.forEach(function(b) {
        var acts = (b.reflection && b.reflection.changeActs) || [];
        acts.forEach(function(a) {
          if (a && !seen[a]) { seen[a] = true; result.push(a); }
        });
      });
      return result;
    },
    allAffirmations() {
      var seen = {};
      var result = [];
      this.$store.getters.beliefs.forEach(function(b) {
        (b.affirmations || []).forEach(function(a) {
          if (a.text && !seen[a.text]) {
            seen[a.text] = true;
            result.push({ text: a.text, count: a.count || 1 });
          }
        });
      });
      return result;
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
    goToStep(step) {
      this.step = step;
      this.$vuetify.goTo(0, { duration: 0 });
    },
    save() {
      const saved = Object.assign({}, this.entry, {
        affirmations: this.affirmations,
        reflection: {
          origin: this.entry && this.entry.reflection ? (this.entry.reflection.origin || '') : '',
          exceptions: this.exceptions,
          bodyIntensity: this.bodyIntensity,
          withoutBelief: this.withoutBelief,
          withoutBeliefFeelings: this.withoutBeliefFeelings,
          turnarounds: [],
          changeAct: '',
          changeActs: this.changeActs,
        },
      });
      this.$store.dispatch('updateBelief', saved);
      // This flow usually moves the belief to "Verändert" — open that tab.
      this.$router.push({ path: '/beliefs', query: { tab: beliefStatus(saved) } });
    },
    close() {
      this.$router.push('/beliefs');
    },
  },
};
</script>

<style scoped lang="scss">
.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px;
}
.slider-end-label {
  font-size: 0.78rem;
  color: #8e8e93;
  flex-shrink: 0;
}
.intensity-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #3a3a3c;
  outline: none;
  cursor: pointer;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #4ade80;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }
  &::-moz-range-thumb {
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 50%;
    background: #4ade80;
    cursor: pointer;
  }
}
.slider-value-label {
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 8px 0 0;
}
.intensity-hint {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1.5px solid #fd9927;
}
.intensity-hint-text {
  font-size: 0.875rem;
  color: #8e8e93;
  line-height: 1.5;
  margin: 0 0 6px;
}
</style>
