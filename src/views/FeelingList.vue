<template>
  <div class="feelings-list">
    <h1>Mein Gefühlsverlauf</h1>
    <div class="felt-feelings" v-for="feltFeeling in feltFeelings" v-bind:key="feltFeeling.time">
      <h2>Am {{ formatTime(feltFeeling.time) }}</h2>
      <div class="feelings">
        <ul class="feelings--fullfilled">
          <li v-for="feeling in feltFeeling.fullfilled" v-bind:key="feeling">
            {{ feeling }}
          </li>
        </ul>
        <ul class="feelings--unfullfilled">
          <li v-for="feeling in feltFeeling.unfullfilled" v-bind:key="feeling">
            {{ feeling }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  name: 'feelings-list',
  components: {
  },
  data() {
    return {};
  },
  computed: {
    feltFeelings() {
      return this.$store.getters.feltFeelings;
    },
  },
  methods: {
    formatTime(time) {
      moment.locale('de');
      return moment(time).format('LLLL');
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
