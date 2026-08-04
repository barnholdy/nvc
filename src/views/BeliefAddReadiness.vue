<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Bereitschaft</h1>
      <p class="body-1 white--text mt-3 wizard-prompt">
        Dieser Schritt schaut auf den Ursprung — das kann Altes berühren.
      </p>
      <p class="body-1 grey--text mt-2">
        Geh nur so weit, wie sich stimmig anfühlt. Du schaust drauf, du gehst nicht wieder hinein.
      </p>
    </v-flex>
  </v-layout>
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
