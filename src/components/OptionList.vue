<template>
  <div class="option-list">
    <h2>{{ heading }}</h2>
    <select v-model="optionSelected">
      <option value=""></option>
      <option
        v-for="option in optionsSorted"
        :value="option"
        v-bind:key="option">
        {{ option }}
      </option>
    </select>
  </div>
</template>

<script>
import { uniq } from 'lodash';

export default {
  name: 'OptionList',
  props: {
    heading: String,
    options: Array,
  },
  data() {
    return {
      optionSelected: '',
    };
  },
  computed: {
    optionsSorted() {
      return uniq(this.options).sort();
    },
  },
  watch: {
    optionSelected: 'addOption',
  },
  methods: {
    addOption() {
      if (this.optionSelected) {
        this.$emit('optionSelected', this.optionSelected);
        this.optionSelected = '';
      }
    },
  },
};
</script>

<style scoped lang="scss">
.option-list {
}
</style>
