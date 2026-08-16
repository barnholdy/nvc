<template>
  <div>
    <!-- The situation this step is about, labelled the same way every other
         wizard step labels the text it carries forward. -->
    <wizard-context label="Situation" :quote="trigger"></wizard-context>

    <p class="wizard-question">Welche Überzeugungen stecken dahinter?</p>
    <p class="wizard-body">Welche tiefer liegenden Überzeugungen sind damit verbunden? Sie wird in der Regel beim Aussprechen eine Emotion auslösen. Schreibe in Ich-Form.</p>

    <!-- Writing a new one is the answer to the question above, so it sits
         directly under it rather than below the list of existing ones. -->
    <div class="new-belief">
      <template v-if="showNewInput">
        <!-- Each rung the laddering has already climbed, oldest first. Kept in
             view so the chain reads as one thought, not a series of unrelated
             fields. -->
        <p v-for="(rung, i) in ladder" :key="i" class="ladder-rung">„{{ rung }}“</p>

        <p v-if="ladder.length" class="wizard-body ladder-question">{{ DEEPER_QUESTION }}</p>

        <input-card
          v-model="newBeliefText"
          :label="ladder.length ? 'Deine Antwort' : 'Neue Überzeugung'"
          :placeholder="ladder.length ? '…' : 'Ich bin nicht gut genug...'"
          :rows="2"
        ></input-card>

        <!-- Two ways on: one more rung down, or stop here and keep what
             stands. Only the last rung becomes the belief. -->
        <div class="ladder-actions">
          <button class="card-btn ladder-quiet" :disabled="!hasText" @click="goDeeper">Tiefer gehen</button>
          <button class="card-btn" :disabled="!hasText" @click="createBelief">Hinzufügen</button>
          <button class="card-btn ladder-quiet" @click="cancelNew">Abbrechen</button>
        </div>
      </template>
      <template v-else>
        <button class="card-btn new-belief-btn" @click="showNewInput = true">Neue Überzeugung</button>
      </template>
    </div>

    <!-- Common starting points, for whoever cannot yet put their own into
         words. Offered once they have said they want to write one, not
         before — tapping one adds it straight away, the same way tapping an
         already-captured belief below does. -->
    <template v-if="showNewInput && suggestedBeliefs.length">
      <p class="wizard-question">Anregungen</p>
      <div
        v-for="text in suggestedBeliefs"
        :key="text"
        class="card suggestion-card"
        @click="addSuggestion(text)"
      >{{ text }}</div>
    </template>

    <template v-if="selectedBeliefObjects.length">
      <p class="wizard-question">Wie glaubwürdig sind sie gerade?</p>
      <div v-for="b in selectedBeliefObjects" :key="b.time">
        <div class="card belief-head-card">
          <p class="card-title">„{{ b.belief }}“</p>
          <button class="belief-remove" @click="removeSelected(b.time)">
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
    </template>

    <template v-if="unselectedBeliefs.length">
      <p class="wizard-question">Schon erfasste Überzeugungen</p>
      <div
        v-for="b in unselectedBeliefs"
        :key="b.time"
        class="card available-card"
        @click="addBelief(b.time)"
      >
        <p class="card-title available-title">„{{ b.belief }}“</p>
        <div v-if="credibilityOf(b) !== null" class="score-row">
          <span class="score-value">{{ round(credibilityOf(b)) }}</span>
          <span class="score-max">/10</span>
          <span class="score-label">Glaubwürdigkeit</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import WizardContext from '@/components/WizardContext.vue';
import InputCard from '@/components/InputCard.vue';
import MeterCard from '@/components/MeterCard.vue';
import { beliefCredibility } from '@/utils/credibility';

const TRUTH_DEFAULT = 5;

// Laddering: what someone first writes down is usually a surface complaint,
// and the belief underneath it comes out by asking the same question of each
// answer in turn.
const DEEPER_QUESTION = 'Angenommen, das stimmt — was würde das über dich bedeuten?';

// Common core beliefs, for whoever is staring at the blank field. Offered
// as a starting point, not a diagnosis — tapping one adds it exactly like
// writing it in would.
const CORE_BELIEF_SUGGESTIONS = [
  'Ich bin nicht gut genug.',
  'Ich bin nicht liebenswert.',
  'Ich werde verlassen.',
  'Ich muss perfekt sein, um akzeptiert zu werden.',
  'Ich bin machtlos.',
  'Die Welt ist gefährlich.',
  'Ich bin verantwortlich für die Gefühle anderer.',
  'Meine Bedürfnisse zählen nicht.',
  'Ich muss es allen recht machen.',
  'Fehler sind inakzeptabel.',
];

export default {
  name: 'pattern-add-beliefs',
  components: { WizardContext, InputCard, MeterCard },
  props: {
    allBeliefs: { type: Array, default: function() { return []; } },
    // For the credibility shown on "schon erfasste" beliefs — the same
    // average the belief cards show, not a rating taken here.
    patterns: { type: Array, default: function() { return []; } },
    journal: { type: Array, default: function() { return []; } },
    selectedBeliefIds: { type: Array, default: function() { return []; } },
    initialTruths: { type: Object, default: function() { return {}; } },
    trigger: { type: String, default: '' },
  },
  data() {
    return {
      selectedIds: this.selectedBeliefIds.slice(),
      truths: Object.assign({}, this.initialTruths),
      showNewInput: false,
      newBeliefText: '',
      // Every answer already given, oldest first. Context only — the belief
      // that gets saved is whatever stands in the field at the end.
      ladder: [],
      DEEPER_QUESTION,
    };
  },
  computed: {
    hasText() { return this.newBeliefText.trim().length > 0; },
    selectedBeliefObjects() {
      var beliefs = this.allBeliefs;
      return this.selectedIds.map(function(id) {
        return beliefs.find(function(b) { return b.time === id; });
      }).filter(Boolean);
    },
    unselectedBeliefs() {
      var selectedIds = this.selectedIds;
      return this.allBeliefs.filter(function(b) {
        return selectedIds.indexOf(b.time) === -1;
      });
    },
    // Whatever is already a real belief has its own card above — offering it
    // again here would just be a second, less informative way to add it.
    suggestedBeliefs() {
      var have = this.allBeliefs.map(function(b) {
        return (b.belief || '').trim().toLowerCase();
      });
      return CORE_BELIEF_SUGGESTIONS.filter(function(text) {
        return have.indexOf(text.toLowerCase()) === -1;
      });
    },
  },
  watch: {
    selectedIds: function(val) {
      this.$emit('changed', val.slice());
      this.emitTruths();
    },
  },
  methods: {
    credibilityOf(belief) { return beliefCredibility(this.patterns, belief, this.journal); },
    round(v) { return String(Math.round(v * 10) / 10).replace('.', ','); },
    // The rating belongs to this situation, not to the belief: the same belief
    // rated again later is what makes a trend.
    truthOf(time) {
      const v = this.truths[time];
      return typeof v === 'number' ? v : TRUTH_DEFAULT;
    },
    setTruth(time, value) {
      this.$set(this.truths, time, Number(value));
      this.emitTruths();
    },
    emitTruths() {
      const out = {};
      this.selectedIds.forEach((id) => { out[id] = this.truthOf(id); });
      this.$emit('truthsChanged', out);
    },
    addBelief(time) {
      if (this.selectedIds.indexOf(time) === -1) {
        this.selectedIds = this.selectedIds.concat([time]);
      }
    },
    removeSelected(time) {
      this.selectedIds = this.selectedIds.filter(function(id) { return id !== time; });
      this.$delete(this.truths, time);
    },
    cancelNew() {
      this.resetNew();
    },
    resetNew() {
      this.showNewInput = false;
      this.newBeliefText = '';
      this.ladder = [];
    },
    // One rung down: what stands now becomes context, and the same question is
    // asked of it. Nothing is saved yet.
    goDeeper() {
      if (!this.hasText) return;
      this.ladder.push(this.newBeliefText.trim());
      this.newBeliefText = '';
    },
    // Stop here. Only what stands in the field becomes the belief — the rungs
    // above it were the way to get to it, not beliefs in their own right.
    createBelief() {
      if (!this.hasText) return;
      var time = +new Date();
      this.$store.dispatch('saveBelief', { time: time, belief: this.newBeliefText.trim() });
      this.selectedIds = this.selectedIds.concat([time]);
      this.resetNew();
    },
    // Lands in the field rather than becoming a belief straight away — a
    // starting point that can still be reworded, the same way a suggestion
    // is used everywhere else in the app.
    addSuggestion(text) {
      this.newBeliefText = text;
    },
  },
};
</script>

<style scoped lang="scss">
.new-belief { margin: 0 0 4px; }
.new-belief-btn { margin: 0 16px; }

/* The rungs already climbed. Quieter than the field below them: they are what
   was said on the way here, not what is being answered now. */
.ladder-rung {
  font-size: 0.9rem;
  color: #8e8e93;
  line-height: 1.4;
  margin: 0 16px 6px;
  padding-left: 10px;
  border-left: 2px solid #2c2c2e;
  word-break: break-word;
}
.ladder-question { margin-top: 10px; }
.ladder-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 16px;
}
/* Only Hinzufügen ends the ladder, so the other two step back. */
.ladder-quiet { border-color: #3a3a3c; color: #8e8e93; }
.card-btn:disabled { opacity: 0.4; cursor: default; }

/* The belief and its rating are one block, so the card above the meter loses
   its bottom margin. */
.belief-head-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 0;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
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

.available-card {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
.available-title { color: #ebebf5; }

/* Full-width cards rather than chips: a suggestion is a whole sentence. */
.suggestion-card {
  font-size: 0.95rem;
  line-height: 1.45;
  color: #ebebf5;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
</style>
