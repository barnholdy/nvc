<template>
  <div>
    <p class="wizard-question">Bereit, auf den Ursprung zu schauen?</p>
    <p class="wizard-body">
      Dieser Schritt schaut auf den Ursprung — das kann Altes berühren.
    </p>
    <p class="wizard-note">
      Geh nur so weit, wie sich stimmig anfühlt. Du schaust drauf, du gehst nicht wieder hinein.
    </p>
  </div>
</template>

<script>
// A decision point, not a form: no input, no validation, and never skipped
// automatically. The two ways out live in the wizard footer.
export default {
  name: 'belief-add-readiness',
};
</script>

<style scoped lang="scss">
</style>
