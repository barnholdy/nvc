<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Befürchtung</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ situation }}"</p>
      <p class="body-1 grey--text mt-2">
        Was genau befürchtest du, wenn du das tust? Sei präzise: Wer reagiert wie?
      </p>
    </v-flex>

    <v-flex>
      <v-text-field
        placeholder="..."
        v-model="fear"
        multi-line
        rows="5"
        hide-details
        :disabled="isLocked"
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>

      <p class="body-1 grey--text mt-4 mb-2">
        Wie stark erwartest du, dass diese Befürchtung eintritt?
      </p>

      <template v-if="isLocked">
        <div class="locked-anchor">
          <span class="locked-value">{{ fearExpected }}</span>
          <span class="locked-note">
            Festgeschrieben am {{ plannedAtLabel }} — bleibt unverändert, damit der
            spätere Vergleich etwas wert ist.
          </span>
        </div>
      </template>
      <template v-else>
        <div class="slider-row">
          <span class="slider-end-label">0</span>
          <input type="range" min="0" max="100" v-model.number="fearExpected" class="fear-slider" />
          <span class="slider-end-label">100</span>
        </div>
        <p class="slider-value-label">{{ fearExpected }}</p>
        <div class="scale-legend">
          <span>0 = gar nicht</span>
          <span>100 = genau so schlimm wie befürchtet</span>
        </div>
      </template>

      <p class="outlook-text mt-4">
        Danach führst du genau das aus — nicht mehr, nicht weniger. Der Impuls, im letzten
        Moment doch ins alte Muster zu kippen, ist die Überzeugung selbst. Bemerk ihn,
        folg ihm nicht. Das Ergebnis trägst du später unter „Handlungen" ein.
      </p>
    </v-flex>
  </v-layout>
</template>

<script>
import moment from 'moment';

export default {
  name: 'belief-act-fear',
  props: {
    situation: { type: String, default: '' },
    experiment: { type: Object, required: true },
  },
  data() {
    return {
      fear: this.experiment.fear || '',
      fearExpected: typeof this.experiment.fearExpected === 'number'
        ? this.experiment.fearExpected
        : 50,
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
  methods: {
    emitChange() {
      this.$emit('changed', { fear: this.fear, fearExpected: this.fearExpected });
    },
  },
};
</script>

<style scoped lang="scss">
.belief-quote { font-style: italic; }
.outlook-text {
  font-size: 0.85rem;
  color: #8e8e93;
  line-height: 1.5;
  margin: 0;
}

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
.fear-slider {
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
.scale-legend {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: #636366;
  margin-top: 2px;
}

.locked-anchor {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1.5px solid #fd9927;
}
.locked-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fd9927;
  flex-shrink: 0;
}
.locked-note {
  font-size: 0.78rem;
  color: #8e8e93;
  line-height: 1.45;
}
</style>
