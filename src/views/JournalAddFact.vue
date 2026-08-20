<template>
  <div>
    <p class="wizard-question">Was ist passiert?</p>
    <p class="wizard-body">{{ body }}</p>

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
    isTrigger: { type: Boolean, default: false },
    initialValue: { type: String, default: '' },
  },
  data() {
    return { text: this.initialValue };
  },
  computed: {
    // Same question either way, but a Trigger is looking for the moment it
    // struck, while a Reflexion is looking for the counter-example.
    body() {
      return this.isTrigger
        ? 'Der Moment, in dem es dich erwischt hat — nur die Fakten, ohne Deutung.'
        : 'Nur die Fakten — was du gesehen, gehört oder erlebt hast, ohne Deutung.';
    },
  },
  watch: {
    text(val) { this.$emit('changed', val); },
  },
};
</script>
