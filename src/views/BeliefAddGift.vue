<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Kluge Lösung</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}“</p>
      <p class="body-1 white--text mt-3">Was hat dir diese Überzeugung damals gebracht?</p>
    </v-flex>

    <v-flex class="mb-3">
      <div class="chip-list">
        <button
          v-for="chip in chips"
          :key="chip"
          type="button"
          class="gift-chip"
          :class="{ selected: chip === gift }"
          @click="toggle(chip)"
        >{{ chip }}</button>
      </div>
    </v-flex>

    <v-flex>
      <div class="reframe-card">
        <p class="reframe-text">
          Diese Überzeugung war kein Fehler. Für das Kind, das du warst, war sie eine kluge
          Lösung — sie hat dir damals
          <span v-if="gift" class="reframe-gift">{{ gift }}</span><span v-else>etwas Wichtiges</span>
          gebracht. Heute darfst du prüfen, ob du sie noch brauchst.
        </p>
      </div>
    </v-flex>
  </v-layout>
</template>

<script>
import { giftChips } from '@/utils/originArc';

// The chips come from the needs the user already picked two steps earlier, so
// this screen asks for a tap rather than for the same words a second time.
export default {
  name: 'belief-add-gift',
  props: {
    belief: { type: String, default: '' },
    needs: { type: Array, default: () => [] },
    initialValue: { type: String, default: null },
  },
  data() {
    return { gift: this.initialValue || null };
  },
  computed: {
    chips() {
      return giftChips(this.needs);
    },
  },
  methods: {
    toggle(chip) {
      this.gift = this.gift === chip ? null : chip;
      this.$emit('changed', this.gift);
    },
  },
};
</script>

<style scoped lang="scss">
.belief-quote { font-style: italic; }

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.gift-chip {
  font-size: 0.85rem;
  color: #ebebf5;
  background: #2c2c2e;
  border: 1.5px solid transparent;
  border-radius: 999px;
  padding: 7px 14px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:focus-visible {
    outline: 2px solid #4ade80;
    outline-offset: 2px;
  }
  &.selected {
    border-color: #4ade80;
    color: #4ade80;
    font-weight: 600;
  }
}

.reframe-card {
  background: #1c1c1e;
  border-left: 3px solid #4ade80;
  border-radius: 8px;
  padding: 14px 16px;
}
.reframe-text {
  font-size: 0.92rem;
  color: #ebebf5;
  line-height: 1.6;
  margin: 0;
}
.reframe-gift {
  color: #4ade80;
  font-weight: 600;
}
</style>
