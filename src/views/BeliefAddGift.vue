<template>
  <belief-add-feeling-need
    mode="needs"
    headline="Kluge Lösung"
    prompt="Was hat dir diese Überzeugung damals gebracht?"
    :belief="belief"
    :reaction="reaction"
    :taxonomy="taxonomy"
    :initialNeeds="initialNeeds"
    :contextFeelings="feelings"
    :contextOrigin="origin"
    :maxSelections="1"
    @change="onChange">
    <template slot="beforeList">
      <div class="reframe-card">
        <p class="reframe-text">
          Diese Überzeugung war kein Fehler. Für das Kind, das du warst, war sie eine kluge
          Lösung — sie hat dir damals
          <span v-if="gift" class="reframe-gift">{{ gift }}</span><span v-else>etwas Wichtiges</span>
          gebracht. Heute darfst du prüfen, ob du sie noch brauchst.
        </p>
      </div>
    </template>
  </belief-add-feeling-need>
</template>

<script>
import BeliefAddFeelingNeed from '@/views/BeliefAddFeelingNeed.vue';

// The need and the gift are the same answer to the same question: what this
// belief once did for you. So they are picked once, on one screen, and the
// reframe says the chosen word back.
export default {
  name: 'belief-add-gift',
  components: { BeliefAddFeelingNeed },
  props: {
    belief: { type: String, default: '' },
    reaction: { type: String, default: '' },
    taxonomy: { type: Object, required: true },
    feelings: { type: Array, default: () => [] },
    origin: { type: String, default: '' },
    initialNeeds: { type: Array, default: () => [] },
  },
  data() {
    return { needs: this.initialNeeds.slice() };
  },
  computed: {
    gift() {
      const last = this.needs[this.needs.length - 1];
      return last ? last.name : null;
    },
  },
  methods: {
    onChange(needs) {
      this.needs = needs;
      this.$emit('change', needs);
    },
  },
};
</script>

<style scoped lang="scss">
.reframe-card {
  background: #1c1c1e;
  border-left: 3px solid #4ade80;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 16px;
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
