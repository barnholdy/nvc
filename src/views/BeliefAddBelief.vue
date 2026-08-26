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

    <!-- Beliefs rarely stand alone: naming the ones that come with this one
         is what later makes a pattern visible. Optional, so it never holds
         the wizard up. -->
    <p class="wizard-question">Welche verknüpften Überzeugungen hast du?</p>
    <p class="wizard-body">
      Sätze, die mit diesem zusammen auftauchen oder aus ihm folgen. Wenn dir
      keine einfallen, lass es offen.
    </p>
    <input-card
      v-model="linked"
      label="Verknüpfte Überzeugungen"
      placeholder="Wenn das stimmt, dann..."
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
    initialLinked: { type: String, default: '' },
  },
  data() {
    return { belief: this.initialValue, linked: this.initialLinked };
  },
  watch: {
    belief(val) { this.$emit('beliefChanged', val); },
    linked(val) { this.$emit('linkedChanged', val); },
  },
};
</script>
