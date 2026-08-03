<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Überzeugung</h1>
      <p class="body-1 grey--text mt-2">
        Welche Überzeugung willst du mit dieser Handlung an der Realität testen?
      </p>
    </v-flex>

    <v-flex>
      <p v-if="!beliefs.length" class="empty-text">
        Noch keine gewandelte Überzeugung. Wandle zuerst eine Überzeugung — die neue
        Perspektive ist das, was eine Handlung überprüft.
      </p>
      <button
        v-for="b in beliefs"
        :key="b.time"
        type="button"
        class="belief-btn"
        :class="{ selected: b.time === selected }"
        @click="pick(b.time)"
      >{{ b.belief }}</button>
    </v-flex>
  </v-layout>
</template>

<script>
// Only shown when the wizard is opened from the Handlungen list, where no
// belief has been chosen yet.
export default {
  name: 'belief-act-pick-belief',
  props: {
    beliefs: { type: Array, default: () => [] },
    initialValue: { type: Number, default: null },
  },
  data() {
    return { selected: this.initialValue };
  },
  methods: {
    pick(time) {
      this.selected = time;
      this.$emit('changed', time);
    },
  },
};
</script>

<style scoped lang="scss">
.belief-btn {
  display: block;
  width: 100%;
  text-align: left;
  font-size: 0.95rem;
  line-height: 1.4;
  color: #ebebf5;
  background: #1c1c1e;
  border: 1.5px solid transparent;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 10px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:focus-visible {
    outline: 2px solid #4ade80;
    outline-offset: 2px;
  }
  &.selected {
    border-color: #4ade80;
    color: #4ade80;
    font-weight: 600;
  }
}
.empty-text {
  font-size: 0.875rem;
  color: #8e8e93;
  margin: 0;
}
</style>
