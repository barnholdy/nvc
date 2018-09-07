<template>
  <div class="check-in-add">
    <h1>Wie geht es dir gerade?</h1>
    <feelings :feelings="availableFeelings" :isInteractive="true"></feelings>
    <button @click="saveFeelings" :disabled="!isFeelingSelected">speichern</button>
    <button @click="resetFeelings" :disabled="!isFeelingSelected">zurücksetzen</button>
  </div>
</template>

<script>
import Feelings from '@/components/Feelings.vue';
import availableFeelings from '../assets/feelings.json';

export default {
  name: 'check-in-add',
  components: {
    Feelings,
  },
  data() {
    return {
      availableFeelings: availableFeelings.feelings,
    };
  },
  computed: {
    isFeelingSelected() {
      return this.availableFeelings.some(feeling => feeling.isSelected);
    },
    selectedFeelings() {
      return this.availableFeelings.filter(feeling => feeling.isSelected);
    },
  },
  methods: {
    saveFeelings() {
      if (this.isFeelingSelected) {
        this.$store.dispatch('saveCheckIn', {
          feelings: this.selectedFeelings,
        });
        this.resetFeelings();
        this.$router.push('check-ins');
      }
    },
    resetFeelings() {
      this.availableFeelings.forEach((feeling, index) => {
        if (feeling.isSelected) {
          feeling.isSelected = false; // eslint-disable-line no-param-reassign
          this.$set(this.availableFeelings, index, feeling);
        }
      });
    },
  },
};
</script>

<style scoped lang="scss">
</style>
