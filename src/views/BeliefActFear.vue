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
      :readonly="isLocked"
      minLabel="gar nicht"
      maxLabel="genau so schlimm"
      :color="isLocked ? '#fd9927' : ''"
      @input="fearExpected = $event"
    >
      <template v-if="isLocked" slot="hint">
        Festgeschrieben am {{ plannedAtLabel }} — bleibt unverändert, damit der spätere
        Vergleich etwas wert ist.
      </template>
    </meter-card>

    <p class="wizard-note">
      Danach führst du genau das aus — nicht mehr, nicht weniger. Der Impuls, im letzten
      Moment doch ins alte Muster zu kippen, ist die Überzeugung selbst. Bemerke ihn,
      folge ihm nicht. Das Ergebnis trägst du später unter „Handlungen“ ein.
    </p>
  </div>
</template>

<script>
import moment from 'moment';
import WizardContext from '@/components/WizardContext.vue';
import InputCard from '@/components/InputCard.vue';
import MeterCard from '@/components/MeterCard.vue';

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
      // Once planned, the anchor must not move.
      isLocked: !!this.experiment.plannedAt,
    };
  },
  computed: {
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

