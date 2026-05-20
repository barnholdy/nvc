<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn v-if="step === 1" icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-btn v-else icon @click="prevStep">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-toolbar-title>Neue Reflektion</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="grey--text body-1">{{ step }} / {{ totalSteps }}</span>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <reflection-add-fear
          v-show="step === 1"
          :initialValue="fear"
          @changed="fear = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </reflection-add-fear>

        <reflection-add-belief
          v-show="step === 2"
          :fear="fear"
          :initialValue="belief"
          @changed="belief = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </reflection-add-belief>

        <reflection-add-reflection
          v-show="step === 3"
          :fear="fear"
          :belief="belief"
          :initialValue="reflection"
          @changed="reflection = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </reflection-add-reflection>
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
import ReflectionAddFear from '@/views/ReflectionAddFear.vue';
import ReflectionAddBelief from '@/views/ReflectionAddBelief.vue';
import ReflectionAddReflection from '@/views/ReflectionAddReflection.vue';

export default {
  name: 'reflection-add',
  components: {
    ReflectionAddFear,
    ReflectionAddBelief,
    ReflectionAddReflection,
  },
  data() {
    return {
      step: 1,
      totalSteps: 3,
      fear: '',
      belief: '',
      reflection: '',
      isFooterFixed: true,
    };
  },
  computed: {
    isStepComplete() {
      if (this.step === 1) return this.fear.trim() !== '';
      if (this.step === 2) return this.belief.trim() !== '';
      if (this.step === 3) return this.reflection.trim() !== '';
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
      this.$store.dispatch('saveReflection', {
        fear: this.fear,
        belief: this.belief,
        reflection: this.reflection,
      });
      this.$router.push('/reflections');
    },
    close() {
      this.$router.push('/reflections');
    },
  },
};
</script>

<style scoped lang="scss">
</style>
