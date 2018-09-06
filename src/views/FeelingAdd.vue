<template>
  <div class="feelings-add">
    <h1>Wie geht es dir gerade?</h1>
    <div class="feelings">
      <div class="feelings--fullfilled">
        <option-list
          class="feelings__option"
          heading="Erfüllt"
          :options="fullfilledFeelings"
          @optionSelected="addFullfilledFeeling">
        </option-list>
        <selection-list
          :selectionList="selectedFeelingsFullfilled"
          @selectionRemoved="removeFullfilledFeeling">
        </selection-list>
      </div>
      <div class="feelings--unfullfilled">
        <option-list
          class="feelings__option"
          heading="Unerfüllt"
          :options="unfullfilledFeelings"
          @optionSelected="addUnfullfilledFeeling">
        </option-list>
        <selection-list
          :selectionList="selectedFeelingsUnfullfilled"
          @selectionRemoved="removeUnfullfilledFeeling">
        </selection-list>
      </div>
    </div>
    <button @click="saveFeelings" :disabled="!isFeelingSelected">speichern</button>
  </div>
</template>

<script>
import OptionList from '@/components/OptionList.vue';
import SelectionList from '@/components/SelectionList.vue';
import availableFeelings from '../assets/feelings_de.json';

export default {
  name: 'feelings-add',
  components: {
    OptionList,
    SelectionList,
  },
  data() {
    return {
      selectedFeelingsFullfilled: [],
      selectedFeelingsUnfullfilled: [],
    };
  },
  computed: {
    fullfilledFeelings() {
      return availableFeelings.fullfilled;
    },
    unfullfilledFeelings() {
      return availableFeelings.unfullfilled;
    },
    isFeelingSelected() {
      return this.selectedFeelingsFullfilled.length > 0
        || this.selectedFeelingsUnfullfilled.length > 0;
    },
  },
  methods: {
    addFullfilledFeeling(feeling) {
      this.addFeeling(this.selectedFeelingsFullfilled, feeling);
    },
    removeFullfilledFeeling(feeling) {
      this.removeFeeling(this.selectedFeelingsFullfilled, feeling);
    },
    addUnfullfilledFeeling(feeling) {
      this.addFeeling(this.selectedFeelingsUnfullfilled, feeling);
    },
    removeUnfullfilledFeeling(feeling) {
      this.removeFeeling(this.selectedFeelingsUnfullfilled, feeling);
    },
    addFeeling(feelings, feeling) {
      const index = feelings.indexOf(feeling);
      if (index === -1) {
        feelings.push(feeling);
      }
    },
    removeFeeling(feelings, feeling) {
      const index = feelings.indexOf(feeling);
      if (index !== -1) {
        feelings.splice(index, 1);
      }
    },
    saveFeelings() {
      if (this.isFeelingSelected) {
        this.$store.dispatch('saveFeelings', {
          fullfilled: this.selectedFeelingsFullfilled,
          unfullfilled: this.selectedFeelingsUnfullfilled,
        });
        this.resetFeelings();
      }
    },
    resetFeelings() {
      this.selectedFeelingsFullfilled = [];
      this.selectedFeelingsUnfullfilled = [];
    },
  },
};
</script>

<style scoped lang="scss">
.feelings {
  display: flex;
  flex-flow: row;
  &--fullfilled,
  &--unfullfilled {
    flex-grow: 1;
  }
}
</style>
