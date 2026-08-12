<template>
  <div>
    <p class="wizard-question">Was hältst du für wahr?</p>
    <p class="wizard-body">
      Ein Satz über dich, die anderen oder die Welt, den du im Moment für wahr hältst.
    </p>
    <input-card
      v-model="belief"
      label="Deine Überzeugung"
      placeholder="Ich bin..."
      :rows="3"
      @focussed="$emit('focussed')"
      @blurred="$emit('blurred')"
    ></input-card>
  </div>
</template>

<script>
import InputCard from '@/components/InputCard.vue';

export default {
  name: 'belief-add-belief',
  components: { InputCard },
  props: {
    initialValue: { type: String, default: '' },
  },
  data() {
    return { belief: this.initialValue };
  },
  watch: {
    belief(val) { this.$emit('beliefChanged', val); },
  },
};
</script>
