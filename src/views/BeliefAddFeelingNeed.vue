<template>
  <div>
    <!-- What was written a step or two earlier. Picking feelings is easier
         with the reaction still in view than from memory. -->
    <wizard-context
      :label="label"
      :quote="belief"
      :exceptions="exceptions"
      :perspective="perspective"
      :reaction="reaction"
      :coping="coping"
      :origin="contextOrigin">
    </wizard-context>

    <p class="wizard-question">{{ headlineText }}</p>
    <p v-if="promptText" class="wizard-body">{{ promptText }}</p>

    <!-- Optional block between the prompt and the list -->
    <slot name="beforeList"></slot>

    <feeling-picker
      :taxonomy="taxonomy"
      :initialFeelings="initialFeelings"
      :maxSelections="maxSelections"
      @change="$emit('change', $event)"
    ></feeling-picker>
  </div>
</template>

<script>
import WizardContext from '@/components/WizardContext.vue';
import FeelingPicker from '@/components/FeelingPicker.vue';

export default {
  name: 'belief-add-feeling-need',
  components: { WizardContext, FeelingPicker },
  props: {
    label: { type: String, default: 'Überzeugung' },
    belief: { type: String, default: '' },
    // The reaction from the earlier step, shown read-only for context.
    reaction: { type: String, default: '' },
    coping: { type: String, default: '' },
    taxonomy: { type: Object, required: true },
    headline: { type: String, default: '' },
    prompt: { type: String, default: '' },
    // Written in the change wizard's first step, carried forward as context.
    exceptions: { type: String, default: '' },
    // Optional second quote under the belief — the change wizard shows the new
    // reaction the feelings are meant to refer to.
    perspective: { type: String, default: '' },
    initialFeelings: { type: Array, default: function() { return []; } },
    // How many may be picked at once. 0 means no limit.
    maxSelections: { type: Number, default: 0 },
    // Shown above the list when the step follows an origin question.
    contextOrigin: { type: String, default: '' },
  },
  computed: {
    // Ergründen has no separate heading and question — the question is the
    // heading. Wandeln passes both, since it already has its own body line.
    headlineText: function() {
      return this.headline || 'Was fühlst du, wenn die Überzeugung wahr ist?';
    },
    // Only Wandeln passes a prompt — Ergründen already asked its question as
    // the heading and has nothing left to add underneath it.
    promptText: function() {
      return this.prompt;
    },
  },
};
</script>
