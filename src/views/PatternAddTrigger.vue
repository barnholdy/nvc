<template>
  <div>
    <p class="wizard-question">Was ist äußerlich passiert?</p>
    <p class="wizard-body">
      Erfasse eine Situation, in der du deiner Ansicht nach unverhältnismäßig stark
      reagiert hast.
    </p>
    <input-card
      v-model="text"
      label="Die Situation"
      :rows="3"
      @focussed="$emit('focussed')"
      @blurred="$emit('blurred')"
    ></input-card>
  </div>
</template>

<script>
import InputCard from '@/components/InputCard.vue';

export default {
  name: 'pattern-add-trigger',
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

