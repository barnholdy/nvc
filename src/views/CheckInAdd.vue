<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn v-if="isFirstStep" icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-btn v-else icon @click="prevStep">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-toolbar-title>Check-In</v-toolbar-title>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <check-in-add-situation
          v-show="isStepSituation"
          :isComplete="isSituationComplete"
          @reset="resetSituation"
          @situationChanged="situationChanged"
          @situationFocussed="situationFocussed"
          @situationBlurred="situationBlurred">
        </check-in-add-situation>
        <check-in-add-feeling
          v-show="isStepFeeling"
          :isComplete="isFeelingComplete"
          :availableFeelings="availableFeelings"
          @reset="resetFeeling">
        </check-in-add-feeling>
        <check-in-add-need
          v-show="isStepNeed"
          :isComplete="isNeedComplete"
          :availableNeeds="availableNeeds"
          @reset="resetNeed">
        </check-in-add-need>
      </v-container>
      <v-footer :fixed="isFooterFixed" color="white elevation-3" height="44">
        <v-btn
          v-if="!isLastStep"
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
import CheckInAddSituation from '@/views/CheckInAddSituation.vue';
import CheckInAddFeeling from '@/views/CheckInAddFeeling.vue';
import CheckInAddNeed from '@/views/CheckInAddNeed.vue';
import availableFeelings from '../assets/feelings.json';
import availableNeeds from '../assets/needs.json';

const STEPS = {
  situation: 1,
  feeling: 2,
  need: 3,
};

export default {
  name: 'check-in-add',
  components: {
    CheckInAddSituation,
    CheckInAddFeeling,
    CheckInAddNeed,
  },
  data() {
    return {
      step: STEPS.situation,
      situation: '',
      availableFeelings: availableFeelings.feelings.filter(feeling => feeling.rank >= -80),
      availableNeeds: availableNeeds.needs.filter(feeling => feeling.rank >= -80),
      isFooterFixed: true,
    };
  },
  computed: {
    isFirstStep() {
      return this.step === Math.min(...Object.values(STEPS));
    },
    isLastStep() {
      return this.step === Math.max(...Object.values(STEPS));
    },
    isStepSituation() {
      return this.step === STEPS.situation;
    },
    isStepFeeling() {
      return this.step === STEPS.feeling;
    },
    isStepNeed() {
      return this.step === STEPS.need;
    },
    isStepComplete() {
      if (this.isStepSituation) return this.isSituationComplete;
      if (this.isStepFeeling) return this.isFeelingComplete;
      if (this.isStepNeed) return this.isNeedComplete;
      return false;
    },
    isSituationComplete() {
      return this.situation !== '';
    },
    isFeelingComplete() {
      return this.availableFeelings.some(feeling => feeling.isSelected);
    },
    isNeedComplete() {
      return this.availableNeeds.some(need => need.isSelected);
    },
    isCheckInComplete() {
      return this.isSituationComplete && this.isFeelingComplete && this.isNeedComplete;
    },
    selectedFeelings() {
      return this.availableFeelings.filter(feeling => feeling.isSelected);
    },
    selectedNeeds() {
      return this.availableNeeds.filter(need => need.isSelected);
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
    close() {
      this.$router.push('check-ins');
      this.reset();
    },
    reset() {
      this.resetSituation();
      this.resetFeeling();
      this.resetNeed();
    },
    resetSituation() {
      this.situation = '';
    },
    resetFeeling() {
      this.availableFeelings.forEach((feeling, index) => {
        if (feeling.isSelected) {
          feeling.isSelected = false; // eslint-disable-line no-param-reassign
          this.$set(this.availableFeelings, index, feeling);
        }
      });
    },
    resetNeed() {
      this.availableNeeds.forEach((need, index) => {
        if (need.isSelected) {
          need.isSelected = false; // eslint-disable-line no-param-reassign
          this.$set(this.availableNeeds, index, need);
        }
      });
    },
    situationChanged(situation) {
      this.situation = situation;
    },
    situationFocussed() {
      this.isFooterFixed = false;
    },
    situationBlurred() {
      this.isFooterFixed = true;
    },
  },
};
</script>

<style scoped lang="scss">
</style>
