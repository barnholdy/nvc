<template>
  <div>
    <journal-recall :fact="fact" :feelings="feelings" :meaning="meaning"></journal-recall>

    <p class="wizard-question">Wie glaubwürdig fühlt sich die Überzeugung jetzt an?</p>
    <p class="wizard-body">
      Wähle jede Überzeugung, gegen die dieser Eintrag spricht, und fühle in dich hinein.
    </p>

    <!-- Chosen ones first, each with the slider it is being rated on — the
         same block a situation builds when it rates its own beliefs. -->
    <div v-for="b in selectedBeliefs" :key="b.time">
      <div class="card belief-head-card">
        <div class="belief-head-main">
          <p class="card-title">„{{ b.belief }}“</p>
          <!-- The sentence this entry is evidence for, kept in view while the
               belief it replaces is being rated. -->
          <p v-if="affirmationOf(b)" class="pick-belief-aff">„{{ affirmationOf(b) }}“</p>
        </div>
        <button class="belief-remove" @click="remove(b.time)">
          <v-icon small color="#ff453a">close</v-icon>
        </button>
      </div>
      <meter-card
        :value="truthOf(b.time)"
        label="Glaubwürdigkeit"
        minLabel="gar nicht"
        maxLabel="völlig"
        @input="setTruth(b.time, $event)"
      ></meter-card>
    </div>

    <template v-if="unselectedBeliefs.length">
      <p class="wizard-question">{{ selectedBeliefs.length ? 'Weitere Überzeugungen' : 'Deine Überzeugungen' }}</p>
      <div
        v-for="b in unselectedBeliefs"
        :key="b.time"
        class="card pick-belief"
        @click="add(b.time)"
      >
        <p class="card-title">„{{ b.belief }}“</p>
        <credibility-meter :standing="standingOf(b)" :baseline="baselineOf(b)"></credibility-meter>
        <p v-if="affirmationOf(b)" class="pick-belief-aff">„{{ affirmationOf(b) }}“</p>
      </div>
    </template>

    <!-- Says why the list is as short as it is. -->
    <p class="wizard-note">Wandle Überzeugungen, um sie hier zum Eintragen auszuwählen.</p>
  </div>
</template>

<script>
// Picking the beliefs and rating them is one step, the way a situation does
// it: the question only means anything about a belief you have named, and
// naming one without answering it leaves the entry half written.
import MeterCard from '@/components/MeterCard.vue';
import CredibilityMeter from '@/components/CredibilityMeter.vue';
import JournalRecall from '@/components/JournalRecall.vue';
import { beliefStatus } from '@/utils/beliefStatus';
import { beliefStanding, beliefCredibility } from '@/utils/credibility';

const DEFAULT_CREDIBILITY = 5;

export default {
  name: 'journal-add-fit',
  components: { MeterCard, CredibilityMeter, JournalRecall },
  props: {
    fact: { type: String, default: '' },
    feelings: { type: Array, default: () => [] },
    meaning: { type: String, default: '' },
    allBeliefs: { type: Array, default: () => [] },
    patterns: { type: Array, default: () => [] },
    journal: { type: Array, default: () => [] },
    initialSelected: { type: Array, default: () => [] },
    initialTruths: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      selectedIds: this.initialSelected.slice(),
      truths: Object.assign({}, this.initialTruths),
    };
  },
  computed: {
    // Only beliefs the wandeln wizard actually finished — an entry needs both
    // ends: the belief to weaken and the affirmation to build up.
    eligibleBeliefs() {
      return this.allBeliefs.filter(b => beliefStatus(b) === 'done'
        && b.affirmations && b.affirmations.length && b.affirmations.some(a => a && a.text));
    },
    // In the order they were picked, so a freshly added one lands at the end
    // rather than jumping somewhere into the middle.
    selectedBeliefs() {
      return this.selectedIds
        .map(id => this.eligibleBeliefs.find(b => b.time === id))
        .filter(Boolean);
    },
    unselectedBeliefs() {
      return this.eligibleBeliefs.filter(b => this.selectedIds.indexOf(b.time) === -1);
    },
  },
  watch: {
    selectedIds(val) {
      this.$emit('changed', val.slice());
      this.emitTruths();
    },
  },
  // A belief that arrives already chosen — from a belief's own card, or from
  // an entry being edited — shows the default on its slider without anything
  // having moved it. Sending the numbers up once at the start makes what is
  // on screen what gets saved.
  created() {
    if (this.selectedIds.length) this.emitTruths();
  },
  methods: {
    standingOf(belief) { return beliefStanding(this.patterns, belief, this.journal); },
    baselineOf(belief) { return beliefCredibility(this.patterns, belief, this.journal); },
    affirmationOf(belief) {
      return (belief.affirmations || []).map(a => a && a.text).filter(Boolean).join(' · ');
    },
    // The rating belongs to this entry, not to the belief: the same belief
    // rated again in the next entry is what makes a trend.
    truthOf(time) {
      const v = this.truths[time];
      return typeof v === 'number' ? v : DEFAULT_CREDIBILITY;
    },
    setTruth(time, value) {
      this.$set(this.truths, time, Number(value));
      this.emitTruths();
    },
    // Whatever is selected gets a number, even one never dragged: the slider
    // shows the default, so the default is what was answered.
    emitTruths() {
      const out = {};
      this.selectedIds.forEach((id) => { out[id] = this.truthOf(id); });
      this.$emit('truthsChanged', out);
    },
    add(time) {
      if (this.selectedIds.indexOf(time) === -1) {
        this.selectedIds = this.selectedIds.concat([time]);
      }
    },
    remove(time) {
      this.selectedIds = this.selectedIds.filter(id => id !== time);
      this.$delete(this.truths, time);
    },
  },
};
</script>

<style scoped lang="scss">
/* The belief and its rating are one block, so the card above the meter loses
   its bottom margin — the same join a situation's belief cards make. */
.belief-head-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 0;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
.belief-head-main { flex: 1; min-width: 0; }
.belief-head-card + .meter-card {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
.belief-remove {
  background: none;
  border: none;
  padding: 2px 4px;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
.pick-belief {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.7; }
}
.pick-belief-aff {
  font-size: 0.88rem;
  color: #8e8e93;
  margin: 10px 0 0;
  line-height: 1.4;
}
</style>
