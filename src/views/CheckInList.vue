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
        <v-card-title>
          <h2 class="subheading">{{ formatTime(checkIn.time) }}</h2>
          <v-spacer></v-spacer>
          <v-btn icon small @click="preDeleteCheckIn(checkIn)">
            <v-icon color="grey darken-2">delete</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <p>
            <span class="situation">{{ checkIn.situation }}</span>, fühle ich mich
            <tag-list :items="checkIn.feelings"></tag-list>, weil ich
            <tag-list :items="checkIn.needs"></tag-list> brauche.
          </p>
        </v-card-text>
      </v-card>

      <v-dialog v-model="isCheckInDeleteDialogShowing" width="500">
          <v-card>
            <v-card-title class="subheading" primary-title>
              Check-In wirklich löschen?
            </v-card-title>
            <v-divider></v-divider>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="secondary" flat @click="cancelDeleteCheckIn">
                abbrechen
              </v-btn>
              <v-btn color="red" flat @click="deleteCheckIn">
                löschen
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
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

  data() {
    return {
      checkInToDelete: null,
      isCheckInDeleteDialogShowing: false,
    };
  },
  computed: {
    checkIns() {
      return this.$store.getters.checkIns.concat().sort((a, b) => b.time - a.time);
    },
  },
  methods: {
    preDeleteCheckIn(checkIn) {
      this.checkInToDelete = checkIn;
      this.isCheckInDeleteDialogShowing = true;
    },
    deleteCheckIn() {
      this.isCheckInDeleteDialogShowing = false;
      this.$store.dispatch('deleteCheckIn', this.checkInToDelete);
      this.checkInToDelete = null;
    },
    cancelDeleteCheckIn () {
      this.isCheckInDeleteDialogShowing = false;
      this.checkInToDelete = null;
    },
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
