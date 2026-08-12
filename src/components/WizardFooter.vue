<template>
  <div class="wizard-footer">
    <button class="wizard-back" @click="$emit('back')">{{ backLabel }}</button>
    <button
      class="wizard-next"
      :disabled="disabled"
      @click="$emit('next')"
    >{{ nextLabel }}</button>
  </div>
</template>

<script>
// Both ways on, always in the same place. On the first step going back means
// leaving the wizard — there is nowhere else to go, and a separate close
// button would be a second exit for the same intent.
export default {
  name: 'wizard-footer',
  props: {
    nextLabel: { type: String, default: 'Weiter' },
    backLabel: { type: String, default: 'Zurück' },
    disabled: { type: Boolean, default: false },
  },
};
</script>
