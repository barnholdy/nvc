<template>
  <div>
    <p class="wizard-question">Was ist passiert?</p>
    <p class="wizard-body">Nur die Fakten — was du gesehen, gehört oder erlebt hast, ohne Deutung.</p>

    <input-card
      v-model="text"
      label="Was ist passiert"
      :rows="4"
      @focussed="$emit('focussed')"
      @blurred="$emit('blurred')"
    ></input-card>
  </div>
</template>

<script>
// The entry starts from what happened, not from a belief: which beliefs it
// speaks against is answered later, once there is something to hold them
// against.
import InputCard from '@/components/InputCard.vue';

export default {
  name: 'journal-add-fact',
  components: { InputCard },
  props: {
    initialValue: { type: String, default: '' },
  },
  data() {
    return { text: this.initialValue };
  },
  watch: {
    text(val) { this.$emit('changed', val); },
  },
};
</script>
