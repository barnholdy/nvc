<template>
  <div>
    <wizard-context :quote="belief" :reaction="reaction"></wizard-context>
    <p class="wizard-question">Komm in deinem Körper an.</p>
    <p class="wizard-body">
      Atme ruhig mit dem Kreis mit. Lass es auf dich wirken.
    </p>
    <p class="wizard-note">Gehe weiter, wenn du dich danach fühlst.</p>

    <breath-circle></breath-circle>
  </div>
</template>

<script>
import WizardContext from '@/components/WizardContext.vue';
import BreathCircle from '@/components/BreathCircle.vue';

// A pause before the feelings step. Naming what you feel works better from the
// body than from the head, and the belief was just written down.
export default {
  name: 'belief-add-arrive',
  components: { WizardContext, BreathCircle },
  props: {
    belief: { type: String, default: '' },
    reaction: { type: String, default: '' },
  },
};
</script>
