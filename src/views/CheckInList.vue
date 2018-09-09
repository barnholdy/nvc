<template>
  <div class="check-in-list">
    <h1>Meine Check-Ins</h1>
    <div class="check-ins" v-for="checkIn in checkIns" v-bind:key="checkIn.time">
      <h2>{{ formatTime(checkIn.time) }}</h2>
      <p>
        Wenn
        <span class="situation">{{ checkIn.situation }}</span>, fühle ich mich
        <tag-list :items="checkIn.feelings"></tag-list>, weil ich
        <tag-list :items="checkIn.needs"></tag-list> brauche.
      </p>
    </div>
  </div>
</template>

<script>
import moment from 'moment';
import TagList from '@/components/TagList.vue';

export default {
  name: 'check-in-list',
  components: {
    TagList,
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
$blue: #67CFC6;

.situation {
  color: $blue;
  display: inline-block;
  border: solid .05rem;
  border-color: $blue;
  border-radius: 0;
  appearance: none;
  height: 2rem;
  line-height: 2rem;
  padding: 0 .6rem 0 .6rem;
}
.tag-list {
  display: inline-block;
}
</style>
