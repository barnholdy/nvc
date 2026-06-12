<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn v-if="step === 1" icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-btn v-else icon @click="prevStep">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-toolbar-title>Neuer Groll</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="grey--text body-1">{{ step }} / {{ totalSteps }}</span>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <resentment-add-resentment
          v-show="step === 1"
          :initialValue="resentment"
          @changed="resentment = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </resentment-add-resentment>

        <resentment-add-parents
          v-show="step === 2"
          :resentment="resentment"
          :initialValue="parents"
          @changed="parents = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </resentment-add-parents>

        <resentment-add-name
          v-show="step === 3"
          :resentment="resentment"
          :parents="parents"
          :initialValue="name"
          @changed="name = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </resentment-add-name>
      </v-container>

      <v-footer :fixed="isFooterFixed" color="white elevation-3" height="44">
        <v-btn
          v-if="step < totalSteps"
          :disabled="!isStepComplete"
          @click="nextStep"
          block large color="primary">
          weiter
        </v-btn>
        <v-btn
          v-else
          :disabled="!isStepComplete"
          @click="save"
          block large color="primary">
          speichern
        </v-btn>
      </v-footer>
    </v-content>
  </div>
</template>

<script>
import ResentmentAddResentment from '@/views/ResentmentAddResentment.vue';
import ResentmentAddParents from '@/views/ResentmentAddParents.vue';
import ResentmentAddName from '@/views/ResentmentAddName.vue';

export default {
  name: 'resentment-add',
  components: {
    ResentmentAddResentment,
    ResentmentAddParents,
    ResentmentAddName,
  },
  data() {
    return {
      step: 1,
      totalSteps: 3,
      resentment: '',
      parents: '',
      name: '',
      isFooterFixed: true,
    };
  },
  computed: {
    isStepComplete() {
      if (this.step === 1) return this.resentment.trim() !== '';
      if (this.step === 2) return this.parents.trim() !== '';
      if (this.step === 3) return this.name.trim() !== '';
      return false;
    },
  },
  methods: {
    nextStep() {
      this.step += 1;
      this.$vuetify.goTo(0, { duration: 0 });
    },
    prevStep() {
      this.step -= 1;
      this.$vuetify.goTo(0, { duration: 0 });
    },
    save() {
      this.$store.dispatch('saveResentment', {
        resentment: this.resentment,
        parents: this.parents,
        name: this.name,
      });
      this.$router.push('/resentments');
    },
    close() {
      this.$router.push('/resentments');
    },
  },
};
</script>

<style scoped lang="scss">
</style>
