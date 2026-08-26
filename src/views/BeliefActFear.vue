<template>
  <div>
    <wizard-context label="Situation" :quote="situation"></wizard-context>

    <p class="wizard-question">Was befürchtest du?</p>
    <p class="wizard-body">Sei präzise: Wer reagiert wie, wenn du das tust?</p>

    <input-card
      v-model="fear"
      label="Deine Befürchtung"
      :rows="3"
      @focussed="$emit('focussed')"
      @blurred="$emit('blurred')"
    ></input-card>

    <p class="wizard-question">Wie stark erwartest du, dass sie eintritt?</p>

    <meter-card
      :value="fearExpected"
      label="Erwartet"
      minLabel="gar nicht"
      maxLabel="genau so schlimm"
      @input="fearExpected = $event"
    >
      <!-- The number is what the result is later held against, so it says
           where it stands — but it is yours to move. -->
      <template v-if="isEvaluated" slot="hint">
        Diese Handlung ist schon ausgewertet. Änderst du das hier, ändert sich auch der
        Vergleich mit dem, was wirklich passiert ist.
      </template>
      <template v-else-if="plannedAtLabel" slot="hint">
        Notiert am {{ plannedAtLabel }} — solange die Handlung noch aussteht, kannst du
        das anpassen.
      </template>
    </meter-card>

    <p class="wizard-note">
      Danach führst du genau das aus — nicht mehr, nicht weniger. Der Impuls, im letzten
      Moment doch ins alte Muster zu kippen, ist die Überzeugung selbst. Bemerke ihn,
      folge ihm nicht. Das Ergebnis trägst du später im Tagebuch ein.
    </p>
  </div>
</template>

<script>
import moment from 'moment';
import WizardContext from '@/components/WizardContext.vue';
import InputCard from '@/components/InputCard.vue';
import MeterCard from '@/components/MeterCard.vue';
import { experimentState } from '@/utils/experiment';

export default {
  name: 'belief-act-fear',
  components: { WizardContext, InputCard, MeterCard },
  props: {
    situation: { type: String, default: '' },
    experiment: { type: Object, required: true },
  },
  data() {
    return {
      fear: this.experiment.fear || '',
      fearExpected: typeof this.experiment.fearExpected === 'number'
        ? this.experiment.fearExpected
        : 5,
    };
  },
  computed: {
    isEvaluated() {
      return experimentState(this.experiment) === 'evaluated';
    },
    plannedAtLabel() {
      if (!this.experiment.plannedAt) return '';
      moment.locale('de');
      return moment(this.experiment.plannedAt).format('D. MMMM YYYY');
    },
  },
  watch: {
    fear() { this.emitChange(); },
    fearExpected() { this.emitChange(); },
  },
  // Sent once at the start too, so the anchor shown on the slider is the one
  // that gets saved even when nobody moves it.
  created() {
    this.emitChange();
  },
  methods: {
    emitChange() {
      this.$emit('changed', { fear: this.fear, fearExpected: this.fearExpected });
    },
  },
};
</script>

