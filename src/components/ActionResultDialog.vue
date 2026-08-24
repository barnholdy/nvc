<template>
  <v-dialog :value="!!row" fullscreen persistent>
    <div v-if="row" class="wizard-page">
      <wizard-header title="Handlung auswerten" :step="step" :total="4"></wizard-header>

      <div v-show="step === 1">
        <wizard-context label="Situation" :quote="situation"></wizard-context>
        <p class="wizard-question">Was ist tatsächlich passiert?</p>
        <p class="wizard-body">Beschreibe es, bevor du es bewertest.</p>
        <input-card v-model="outcome" label="Was ist passiert" :rows="4"></input-card>
      </div>

      <!-- The fear is shown again: rating it from memory is guesswork. -->
      <div v-show="step === 2">
        <wizard-context
          label="Situation"
          :quote="situation"
          :fear="fear"
          :outcome="outcome"
        ></wizard-context>

        <p class="wizard-question">Wie stark ist deine Befürchtung tatsächlich eingetreten?</p>
        <meter-card
          :value="actual"
          label="Tatsächlich eingetreten"
          minLabel="gar nicht"
          maxLabel="genau so schlimm"
          @input="actual = $event"
        ></meter-card>
      </div>

      <div v-show="step === 3">
        <wizard-context
          label="Situation"
          :quote="situation"
          :fear="fear"
          :outcome="outcome"
          :fear-expected="expected"
          :fear-actual="actual"
        ></wizard-context>

        <p class="wizard-question">Was sagt dir das?</p>
        <input-card v-model="learning" label="Deine Erkenntnis" :rows="3"></input-card>
      </div>

      <div v-show="step === 4">
        <wizard-context
          label="Situation"
          :quote="situation"
          :fear="fear"
          :outcome="outcome"
          :learning="learning"
          :fear-expected="expected"
          :fear-actual="actual"
        ></wizard-context>

        <p class="wizard-question">Wie glaubwürdig fühlt sich die Überzeugung jetzt an?</p>
        <p class="wizard-body">Fühle in dich hinein.</p>

        <p class="wizard-note pole">{{ beliefText }}</p>
        <meter-card
          :value="beliefTruth"
          label="Glaubwürdigkeit"
          minLabel="gar nicht"
          maxLabel="völlig"
          @input="beliefTruth = $event"
        ></meter-card>
      </div>

      <div class="wizard-bottom-space"></div>

      <wizard-footer
        :disabled="step === 1 && !outcome.trim()"
        :nextLabel="step < 4 ? 'Weiter' : 'Speichern'"
        @back="step === 1 ? $emit('close') : step--"
        @next="step < 4 ? step++ : save()"
      ></wizard-footer>
    </div>
  </v-dialog>
</template>

<script>
// Evaluating a run is the same four questions wherever it is started from —
// its own list or the Tagebuch — so it lives in one place and both open it.
import WizardHeader from '@/components/WizardHeader.vue';
import WizardFooter from '@/components/WizardFooter.vue';
import WizardContext from '@/components/WizardContext.vue';
import InputCard from '@/components/InputCard.vue';
import MeterCard from '@/components/MeterCard.vue';
import { saveExperiment } from '@/utils/experimentWrite';
import triggerConfetti from '@/utils/confetti';

const DEFAULT_RATING = 5;

export default {
  name: 'action-result-dialog',
  components: {
    WizardHeader, WizardFooter, WizardContext, InputCard, MeterCard,
  },
  props: {
    // `{ experiment, beliefTime, beliefText }`, or null while closed.
    row: { type: Object, default: null },
  },
  data() {
    return {
      step: 1,
      outcome: '',
      actual: DEFAULT_RATING,
      learning: '',
      beliefTruth: DEFAULT_RATING,
    };
  },
  computed: {
    experiment() { return (this.row && this.row.experiment) || {}; },
    situation() { return this.experiment.situation || ''; },
    fear() { return this.experiment.fear || ''; },
    expected() {
      return typeof this.experiment.fearExpected === 'number' ? this.experiment.fearExpected : null;
    },
    beliefText() { return (this.row && this.row.beliefText) || ''; },
  },
  watch: {
    // Opened on a run: start at its first question, with whatever it already
    // carries — a second evaluation edits rather than starts over.
    row: {
      immediate: true,
      handler(row) {
        if (!row) return;
        const x = row.experiment || {};
        this.step = 1;
        this.outcome = x.outcome || '';
        this.actual = typeof x.fearActual === 'number' ? x.fearActual : DEFAULT_RATING;
        this.learning = x.learning || '';
        this.beliefTruth = typeof x.beliefTruth === 'number' ? x.beliefTruth : DEFAULT_RATING;
      },
    },
  },
  methods: {
    save() {
      const x = this.experiment;
      const now = Date.now();
      saveExperiment(this.$store, this.row.beliefTime, x.id, {
        outcome: this.outcome.trim(),
        fearActual: this.actual,
        learning: this.learning.trim(),
        // Evaluating implies it was carried out. Without this the belief would
        // never count as acted on, which keys off doneAt — and that is one of
        // the two ways it reaches "Gewandelt".
        doneAt: x.doneAt || now,
        completedAt: now,
        // How credible the belief is after the experiment — the same 0-10
        // question a situation asks, so it counts as another reading of it.
        beliefTruth: this.beliefTruth,
      });
      this.$emit('saved');
      this.$emit('close');
      triggerConfetti();
    },
  },
};
</script>
