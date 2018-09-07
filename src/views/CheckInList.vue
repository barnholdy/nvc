<template>
  <div class="check-in-list">
    <h1>Meine Check-Ins</h1>
    <div class="check-ins" v-for="checkIn in checkIns" v-bind:key="checkIn.time">
      <h2>{{ formatTime(checkIn.time) }}</h2>
      <p>
        Wenn
        <span class="situation">{{ checkIn.situation }}</span>, fühle ich mich
        <feelings :feelings="checkIn.feelings"></feelings>, weil ich
        <feelings :feelings="checkIn.needs"></feelings> brauche.
      </p>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import Feelings from '@/components/Feelings.vue';

export default {
  name: 'check-in-list',
  components: {
    Feelings,
  },
  computed: {
    checkIns() {
      return this.$store.getters.checkIns.concat().sort((a, b) => b.time - a.time);
    },
  },
  methods: {
    formatTime(time) {
      moment.locale('de');
      return moment(time).format('llll');
    },
  },
};
</script>

<style scoped lang="scss">
.situation{
  padding-bottom: 0.3rem;
  border-bottom: solid .05rem;
  border-color: #2c3e50;
  color: #2c3e50;
}
.feelings {
  display: inline-block;
}
</style>
