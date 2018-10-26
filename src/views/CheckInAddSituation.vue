<template>
  <v-layout column transition="slide-x-reverse-transition">
    <v-flex class="mt-2 mb-5">
      <h1 class="headline font-weight-regular">Beschreibe die Situation!</h1>
    </v-flex>
    <v-flex>
      <v-text-field
        label="Solo"
        placeholder="..."
        class="situation"
        v-model="situation"
        single-line
        @focus="onSituationFocus"
        @blur="onSituationBlur"
      ></v-text-field>
    </v-flex>
    <!--
    <v-flex>
      <v-btn
        :disabled="!isComplete"
        @click="reset"
        block large color="secondary">
        zurücksetzen
      </v-btn>
    </v-flex>
    -->
  </v-layout>
</template>

<script>
export default {
  name: 'check-in-add-situation',
  components: {
  },
  data() {
    return {
      situationInitial: 'Wenn ...',
      situation: 'Wenn ...',
    };
  },
  props: {
    isComplete: Boolean,
  },
  watch: {
    situation: 'onSituatonChange',
  },
  methods: {
    onSituatonChange() {
      this.$emit('situationChanged', this.situation);
    },
    reset() {
      this.$emit('reset');
      this.situation = this.situationInitial;
    },
    onSituationFocus() {
      this.$emit('situationFocussed', this.situation);
    },
    onSituationBlur() {
      this.$emit('situationBlurred', this.situation);
    },
  },
};
</script>

<style scoped lang="scss">
</style>
