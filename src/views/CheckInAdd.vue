<template>
  <div class="check-in-add">
    <h1>Beschreibe die Situation!</h1>
    Wenn <input v-model="situation" type="text" class="situation" />
    <h1>Wie fühst du dich in der Situation?</h1>
    <tag-list :items="availableFeelings" :isInteractive="true"></tag-list>
    <h1>Was brauchst du in der Situation?</h1>
    <tag-list :items="availableNeeds" :isInteractive="true"></tag-list>
    <div class="button-container">
      <button class="button button--success" @click="saveFeelings" :disabled="!isCheckInComplete">speichern</button>
      <button class="button button--error" @click="reset" :disabled="!isCheckInStarted">reset</button>
    </div>
  </div>
</template>

<script>
import TagList from '@/components/TagList.vue';
import availableFeelings from '../assets/feelings.json';
import availableNeeds from '../assets/needs.json';

export default {
  name: 'check-in-add',
  components: {
    TagList,
  },
  data() {
    return {
      situation: '',
      availableFeelings: availableFeelings.feelings.filter(feeling => feeling.rank >= 0),
      availableNeeds: availableNeeds.needs.filter(feeling => feeling.rank >= 0),
    };
  },
  computed: {
    isCheckInComplete() {
      return this.situation
        && this.availableFeelings.some(feeling => feeling.isSelected)
        && this.availableNeeds.some(need => need.isSelected);
    },
    isCheckInStarted() {
      return this.situation
        || this.availableFeelings.some(feeling => feeling.isSelected)
        || this.availableNeeds.some(need => need.isSelected);
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
$green: #4ed58b;
$red: #fc5e53;

.check-in-add {
  margin-bottom: 5rem;
}
.situation {
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
.button-container {
  position: fixed;
  bottom: 0;
  text-align: center;
  width: 100%;
  background-color: white;
}
.button {
  margin: .5rem .25rem 1rem .25rem;
  height: 2rem;
  background-color: white;
  border-color: #2c3e50;
  color: #2c3e50;
  border: solid .05rem;
  font-size: 1rem;
  &--success {
    border-color: $green;
    color: $green;
    width: 70%;
  }
  &--error {
    border-color: $red;
    color: $red;
    width: 20%;
  }
}
.button[disabled] {
  border-color: #ccc;
  color: #ccc;
}
</style>
