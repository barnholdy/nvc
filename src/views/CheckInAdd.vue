<template>
  <div class="check-in-add">
    <h1>Beschreibe die Situation!</h1>
    <input type="text" placeholder="Wenn..." />
    <h1>Wie fühst du dich in der Situation?</h1>
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
      availableFeelings: availableFeelings.feelings.concat().filter(feeling => feeling.rank >= 0),
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
        this.$router.push('check-ins');
        this.resetFeelings();
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
input {
  padding: 0.6rem;
  height: .5rem;
  font-size: 1rem;
  border: solid .05rem;
  border-color: #2c3e50;
  color: #2c3e50;
  width: 80%;
}
button {
  margin-top: 2rem;
  width: 80%;
  height: 2rem;
  background-color: white;
  border-color: #2c3e50;
  color: #2c3e50;
  border: solid .05rem;
  font-size: 1rem;
}
</style>
