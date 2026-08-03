<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Zurück ins Jetzt</h1>
      <p class="body-1 white--text mt-3">
        Bevor du speicherst: einen Moment zurück ins Jetzt. Atme ruhig mit dem Kreis mit.
      </p>
    </v-flex>

    <v-flex class="breath-wrap">
      <div class="breath-circle" aria-hidden="true"></div>
    </v-flex>

    <v-flex class="mt-2">
      <p class="body-1 white--text mb-1">Nenne drei Dinge, die du gerade siehst.</p>
      <v-text-field
        v-for="(slot, i) in slots"
        :key="i"
        :placeholder="`${i + 1}. …`"
        :value="slot"
        single-line
        hide-details
        class="ground-field"
        @input="setSlot(i, $event)"
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
    </v-flex>

    <v-flex class="mt-4">
      <p class="closing-line">Das von damals ist vorbei — du bist hier.</p>
    </v-flex>
  </v-layout>
</template>

<script>
import { GROUNDING_SLOTS } from '@/utils/originArc';

// Naming three things in the room is what ends the excursion into the past.
// All three fields stay optional — the breath alone is already the point.
export default {
  name: 'belief-add-grounding',
  props: {
    initialValue: { type: Array, default: () => [] },
  },
  data() {
    const slots = [];
    for (let i = 0; i < GROUNDING_SLOTS; i += 1) {
      slots.push(this.initialValue[i] || '');
    }
    return { slots: slots };
  },
  methods: {
    setSlot(index, value) {
      this.$set(this.slots, index, value);
      this.$emit('changed', this.slots.map(s => s.trim()).filter(s => s));
    },
  },
};
</script>

<style scoped lang="scss">
.breath-wrap {
  display: flex;
  justify-content: center;
  padding: 18px 0 6px;
}
.breath-circle {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 3px solid #4ade80;
  animation: breathe 8s ease-in-out infinite;
}
@keyframes breathe {
  0%   { transform: scale(0.72); opacity: 0.45; }
  50%  { transform: scale(1);    opacity: 1; }
  100% { transform: scale(0.72); opacity: 0.45; }
}
// Anyone who asked their system not to animate things should not get a pulsing
// circle in a screen about calming down.
@media (prefers-reduced-motion: reduce) {
  .breath-circle {
    animation: none;
    transform: scale(1);
    opacity: 1;
  }
}

.ground-field { margin-top: 4px; }

.closing-line {
  font-size: 0.875rem;
  color: #8e8e93;
  line-height: 1.6;
  margin: 0;
}
</style>
