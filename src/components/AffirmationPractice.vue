<template>
  <div class="practice">
    <button type="button" class="close-btn" aria-label="Schließen" @click="$emit('close')">
      <v-icon color="#888780">close</v-icon>
    </button>

    <div class="breath-slot">
      <breath-circle size="min(92vw, 88vh)"></breath-circle>
    </div>

    <!-- Dead centre, over the disc. White with a soft shadow so it stays
         readable both against the black of the out-breath and the bright green
         of the in-breath. -->
    <p class="affirmation">„{{ text }}“</p>

    <!-- One word at a time, each at a different point around the disc. The
         positions are fixed and known to be clear of it; the order the words
         take them in is not. -->
    <p
      v-if="current"
      class="word"
      :class="{ shown: isShown }"
      :style="wordStyle"
    >{{ current.name }}</p>
  </div>
</template>

<script>
import BreathCircle from '@/components/BreathCircle.vue';
import { colorForFeeling, dedupeByName } from '@/utils/emotions';
import { colorForNeed } from '@/utils/needs';

// Points around the disc, as percentages of the screen. The disc now reaches
// nearly the full width, so there is no room beside it — every slot sits in the
// band above or below it. The lefts stay between 20% and 80% so a long word
// still fits on screen once it is centred on its point.
const SLOTS = [
  { top: '10%', left: '30%' },
  { top: '10%', left: '70%' },
  { top: '17%', left: '20%' },
  { top: '17%', left: '80%' },
  { top: '83%', left: '20%' },
  { top: '83%', left: '80%' },
  { top: '90%', left: '32%' },
  { top: '90%', left: '68%' },
];

const FADE_MS = 1800;
const HOLD_MS = 2600;

export default {
  name: 'affirmation-practice',
  components: { BreathCircle },
  props: {
    text: { type: String, default: '' },
    // The new feelings this sentence was written towards.
    feelings: { type: Array, default: function() { return []; } },
    // The needs it serves.
    needs: { type: Array, default: function() { return []; } },
  },
  data() {
    return { idx: 0, slot: 0, isShown: false, items: [] };
  },
  computed: {
    current() { return this.items[this.idx] || null; },
    wordStyle() {
      const slot = SLOTS[this.slot] || SLOTS[0];
      return { top: slot.top, left: slot.left, color: this.current ? this.current.color : null };
    },
  },
  mounted() {
    this.items = this.buildItems();
    if (!this.items.length) return;
    // First word appears on its own, then the cycle takes over.
    this.showTimer = setTimeout(() => { this.isShown = true; }, 300);
    this.cycle = setInterval(this.next, FADE_MS + HOLD_MS + FADE_MS);
  },
  beforeDestroy() {
    clearTimeout(this.showTimer);
    clearTimeout(this.swapTimer);
    clearInterval(this.cycle);
  },
  methods: {
    // Feelings and needs interleaved rather than one group after the other,
    // each already carrying its taxonomy's colour.
    buildItems() {
      const feelings = dedupeByName(this.feelings)
        .filter(f => f && f.name)
        .map(f => ({ name: f.name, color: colorForFeeling(f.name) }));
      const needs = dedupeByName(this.needs)
        .filter(n => n && n.name)
        .map(n => ({ name: n.name, color: colorForNeed(n.name) }));
      const mixed = [];
      const longer = Math.max(feelings.length, needs.length);
      for (let i = 0; i < longer; i += 1) {
        if (feelings[i]) mixed.push(feelings[i]);
        if (needs[i]) mixed.push(needs[i]);
      }
      return mixed;
    },
    next() {
      this.isShown = false;
      this.swapTimer = setTimeout(() => {
        this.idx = (this.idx + 1) % this.items.length;
        // Never the same point twice running, so a word always moves.
        this.slot = (this.slot + 1 + Math.floor(Math.random() * (SLOTS.length - 1)))
          % SLOTS.length;
        this.isShown = true;
      }, FADE_MS);
    },
  },
};
</script>

<style scoped lang="scss">
.practice {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 300;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.close-btn {
  position: absolute;
  /* Below the status bar when the app runs from the homescreen; the margin is
     the gap it used to have from the top of the screen. */
  top: var(--safe-top);
  margin-top: 12px;
  left: 8px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
.affirmation {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 78vw;
  margin: 0;
  text-align: center;
  font-size: 1.45rem;
  line-height: 1.5;
  font-weight: 400;
  font-style: italic;
  color: var(--text-primary);
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.6);
}
.breath-slot {
  display: flex;
  align-items: center;
  justify-content: center;
}
.word {
  position: absolute;
  transform: translate(-50%, -50%);
  margin: 0;
  max-width: 40vw;
  text-align: center;
  font-size: 1.35rem;
  font-weight: 600;
  line-height: 1.3;
  opacity: 0;
  transition: opacity 1800ms ease-in-out;
  pointer-events: none;
}
.word.shown { opacity: 1; }
/* The words still come and go — that is the content, not decoration — but
   without easing for anyone who asked for less motion. */
@media (prefers-reduced-motion: reduce) {
  .word { transition: none; }
}
</style>
