<template>
  <div class="wizard-page">
    <v-content>
      <wizard-header title="Überzeugung wandeln" :step="step" :total="totalSteps"></wizard-header>
      <div>
        <belief-change-absoluteness
          v-show="step === 1"
          :belief="entry ? entry.belief : ''"
          :truth="standingTruth"
          :initialValue="exceptions"
          @changed="exceptions = $event">
        </belief-change-absoluteness>

        <pattern-add-without-belief
          v-show="step === 2"
          :belief="entry ? entry.belief : ''"
          :needs="entry ? entry.needs || [] : []"
          :exceptions="exceptions"
          :initialValue="withoutBelief"
          @changed="withoutBelief = $event">
        </pattern-add-without-belief>

        <belief-add-feeling-need
          v-show="step === 3"
          headline="Was passiert im Körper?"
          prompt="Bleib einen Moment in dieser Vorstellung. Wird etwas leichter, weiter, wärmer — oder bleibt es gleich?"
          :belief="entry ? entry.belief : ''"
          :exceptions="exceptions"
          :perspective="withoutBelief"
          :taxonomy="taxonomy"
          :initialFeelings="withoutBeliefFeelings"
          :maxSelections="MAX_FEELINGS"
          @change="withoutBeliefFeelings = $event">
          <div slot="beforeList">
            <meter-card
              :value="bodyIntensity"
              label="Körperempfindung"
              minLabel="nichts"
              maxLabel="deutlich"
              @input="bodyIntensity = $event"
            ></meter-card>

            <div v-if="bodyIntensity < INTENSITY_THRESHOLD" class="intensity-hint">
              <p class="intensity-hint-text">
                Noch zu weit weg. Gehen wir kleiner: Wo kannst du die neue Reaktion so ändern,
                dass sie greifbarer für dich wird?
              </p>
              <button class="card-btn" @click="goToStep(2)">Zurück zur neuen Reaktion</button>
            </div>

            <p class="wizard-question">Was fühlst du?</p>
          </div>
        </belief-add-feeling-need>

        <pattern-change-affirmation
          v-show="step === 4"
          :belief="entry ? entry.belief : ''"
          :credibility="situationTruth"
          :reaction="entry ? entry.withBelief || '' : ''"
          :origin="entry && entry.reflection ? entry.reflection.origin || '' : ''"
          :originFeelings="entry && entry.feelings ? entry.feelings : []"
          :exceptions="exceptions"
          :withoutBelief="withoutBelief"
          :withoutBeliefFeelings="withoutBeliefFeelings"
          :needs="entry && entry.needs ? entry.needs : []"
          :initialAffirmations="affirmations"
          :allAffirmations="allAffirmations"
          @changed="affirmations = $event">
        </pattern-change-affirmation>
      </div>
      <div class="wizard-bottom-space"></div>
    </v-content>

    <wizard-footer
      :disabled="!isStepComplete"
      :nextLabel="step < totalSteps ? 'Weiter' : 'Speichern'"
      @back="back"
      @next="step < totalSteps ? nextStep() : save()"
    ></wizard-footer>
  </div>
</template>

<script>
import BeliefChangeAbsoluteness from '@/views/BeliefChangeAbsoluteness.vue';
import PatternAddWithoutBelief from '@/views/PatternAddWithoutBelief.vue';
import BeliefAddFeelingNeed from '@/views/BeliefAddFeelingNeed.vue';
import { MAX_FEELINGS } from '@/utils/emotions';
import { beliefCredibility, beliefStanding } from '@/utils/credibility';
import PatternChangeAffirmation from '@/views/PatternChangeAffirmation.vue';
import WizardHeader from '@/components/WizardHeader.vue';
import WizardFooter from '@/components/WizardFooter.vue';
import MeterCard from '@/components/MeterCard.vue';
import { beliefStatus } from '@/utils/beliefStatus';
import taxonomy from '../assets/taxonomy.json';

// Below this the body sensation counts as "not there yet" and the wizard offers
// a way back to reshape the new reaction.
const INTENSITY_THRESHOLD = 4;

const FEELINGS_STEP = 3;

export default {
  name: 'belief-change',
  components: {
    BeliefChangeAbsoluteness,
    PatternAddWithoutBelief,
    BeliefAddFeelingNeed,
    PatternChangeAffirmation,
    WizardHeader,
    WizardFooter,
    MeterCard,
  },
  data() {
    const entry = this.$store.getters.beliefs
      .find(function(b) { return b.time === parseInt(this.$route.params.time, 10); }, this);
    const r = entry && entry.reflection ? entry.reflection : {};
    return {
      entry: entry || null,
      step: 1,
      totalSteps: 4,
      taxonomy: taxonomy,
      exceptions: r.exceptions || '',
      // Midpoint so the "too far away" hint does not fire before it is touched.
      bodyIntensity: typeof r.bodyIntensity === 'number' ? r.bodyIntensity : 5,
      withoutBelief: r.withoutBelief || '',
      withoutBeliefFeelings: r.withoutBeliefFeelings || [],
      // One affirmation per belief. Older entries can carry more; the wizard
      // only ever shows the first, so saving must not write the rest back.
      affirmations: entry ? (entry.affirmations || []).slice(0, 1) : [],
    };
  },
  computed: {
    INTENSITY_THRESHOLD() { return INTENSITY_THRESHOLD; },
    MAX_FEELINGS() { return MAX_FEELINGS; },
    // The frozen anchor this belief was first rated at — feeds the
    // suggestion prompt's weighting, not shown anywhere on screen.
    situationTruth() {
      return beliefCredibility(this.$store.getters.patterns, this.entry, this.$store.getters.journal);
    },
    // Where the belief stands right now — the number the first step shows,
    // the same one the Überzeugungen list shows as its headline.
    standingTruth() {
      return beliefStanding(this.$store.getters.patterns, this.entry, this.$store.getters.journal);
    },
    // Beliefs worked on before the limit existed can hold more than five new
    // feelings; the way forward opens once they are back within it.
    isStepComplete() {
      if (this.step === FEELINGS_STEP) {
        return this.withoutBeliefFeelings.length <= MAX_FEELINGS;
      }
      return true;
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
    // On the first step there is nothing to go back to but the way out.
    back() {
      if (this.step === 1) this.close();
      else this.prevStep();
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
          // Experiments belong to the Handeln wizard now; carry them through
          // untouched, otherwise this literal would wipe them.
          experiments: (this.entry && this.entry.reflection
            && this.entry.reflection.experiments) || [],
        },
      });
      this.$store.dispatch('updateBelief', saved);
      // This flow usually moves the belief to "Gewandelt" — open that tab.
      this.$router.push({ path: '/beliefs', query: { tab: beliefStatus(saved) } });
    },
    close() {
      this.$router.push('/beliefs');
    },
  },
};
</script>

<style scoped lang="scss">
/* Orange, like everywhere else the app says "this needs attention". Sits in
   the page's own margin, not the card grid, because it belongs to the meter
   above it. */
.intensity-hint {
  margin: 12px 14px 0;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid #fd9927;
}
.intensity-hint-text {
  font-size: 0.9rem;
  color: #8e8e93;
  line-height: 1.5;
  margin: 0 0 10px;
}
.intensity-hint .card-btn { border-color: #fd9927; color: #fd9927; }
</style>
