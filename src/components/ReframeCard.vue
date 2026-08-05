<template>
  <div class="reframe-card">
    <p class="reframe-text">
      Diese Überzeugung war kein Fehler. Für das Kind, das du warst, war sie eine kluge
      Lösung — sie hat dir damals
      <span v-if="gift" class="reframe-gift" :style="{ color: needColor }">{{ gift }}</span><span v-else>etwas Wichtiges</span>
      gebracht. Heute darfst du prüfen, ob du sie noch brauchst.
    </p>
  </div>
</template>

<script>
import { colorForNeed } from '@/utils/needs';

// Shown on Bedürfnis and again when asking for empathy, so the sentence
// cannot drift between the two.
export default {
  name: 'reframe-card',
  props: {
    gift: { type: String, default: '' },
  },
  computed: {
    // The need's own Grundkategorie colour, the same one the picker showed it in.
    needColor() { return colorForNeed(this.gift); },
  },
};
</script>

<style scoped lang="scss">
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
// The colour needs carry everywhere else — the word in this sentence is one.
.reframe-gift { font-weight: 600; }
</style>
