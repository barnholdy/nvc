<template>
  <div class="check-in-list">
    <v-toolbar color="white" app>
      <v-toolbar-title>Meine Check-Ins</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon to="/add-check-in">
        <v-icon>add</v-icon>
      </v-btn>
    </v-toolbar>
    <v-content>
      <v-card class="check-in" v-for="checkIn in checkIns" v-bind:key="checkIn.time">
        <v-card-title primary-title>
          <h2 class="subheading">{{ formatTime(checkIn.time) }}</h2>
        </v-card-title>
        <v-card-text>
          <p>
            <span class="situation">{{ checkIn.situation }}</span>, fühle ich mich
            <tag-list :items="checkIn.feelings"></tag-list>, weil ich
            <tag-list :items="checkIn.needs"></tag-list> brauche.
          </p>
        </v-card-text>
      </v-card>
    </v-content>
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
  height: 2.8rem;
  line-height: 2.8rem;
  padding: 0 .6rem 0 .6rem;
}
.tag-list {
  display: inline-block;
}
.check-in {
  margin: 1rem;
}
</style>
