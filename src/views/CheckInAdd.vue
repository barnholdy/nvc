<template>
  <div class="check-in-add">
    <h1>Beschreibe die Situation!</h1>
    Wenn <input v-model="situation" type="text" class="situation" />
    <h1>Wie fühst du dich in der Situation?</h1>
    <feelings :feelings="availableFeelings" :isInteractive="true"></feelings>
    <h1>Was brauchst du in der Situation?</h1>
    <feelings :feelings="availableNeeds" :isInteractive="true"></feelings>
    <button @click="saveFeelings" :disabled="!isCheckInComplete">speichern</button>
    <button @click="reset">zurücksetzen</button>
  </div>
</template>

<script>
import Feelings from '@/components/Feelings.vue';
import availableFeelings from '../assets/feelings.json';
import availableNeeds from '../assets/needs.json';

export default {
  name: 'check-in-add',
  components: {
    Feelings,
  },
  data() {
    return {
      situation: '',
      availableFeelings: availableFeelings.feelings.filter(feeling => feeling.rank >= 0),
      availableNeeds: availableNeeds.needs.filter(feeling => feeling.rank >= 0),
    }
  },
  computed: {
    isCheckInComplete() {
      return this.situation
        && this.availableFeelings.some(feeling => feeling.isSelected)
        && this.availableNeeds.some(need => need.isSelected);
    },
    selectedFeelings() {
      return this.availableFeelings.filter(feeling => feeling.isSelected);
    },
    selectedNeeds() {
      return this.availableNeeds.filter(need => need.isSelected);
    },
  },
  methods: {
    saveFeelings() {
      if (this.isCheckInComplete) {
        this.$store.dispatch('saveCheckIn', {
          situation: this.situation,
          feelings: this.selectedFeelings,
          needs: this.selectedNeeds,
        });
        this.$router.push('check-ins');
        this.reset();
      }
    },
    reset() {
      this.situation = '';
      this.availableFeelings.forEach((feeling, index) => {
        if (feeling.isSelected) {
          feeling.isSelected = false; // eslint-disable-line no-param-reassign
          this.$set(this.availableFeelings, index, feeling);
        }
      });
      this.availableNeeds.forEach((need, index) => {
        if (need.isSelected) {
          need.isSelected = false; // eslint-disable-line no-param-reassign
          this.$set(this.availableNeeds, index, need);
        }
      });
    },
  },
};
</script>

<style scoped lang="scss">
.situation{
  border-top: none;
  border-left: none;
  border-right: none;
}
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
