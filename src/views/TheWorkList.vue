<template>
  <div class="the-work-list">
    <v-toolbar color="white" app>
      <v-toolbar-title>The Work</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon to="/add-the-work">
        <v-icon>add</v-icon>
      </v-btn>
    </v-toolbar>
    <v-content>
      <v-card class="entry" v-for="entry in theWork" v-bind:key="entry.time">
        <v-card-title>
          <h2 class="subheading">{{ formatTime(entry.time) }}</h2>
          <v-spacer></v-spacer>
          <v-btn icon small @click="preDelete(entry)">
            <v-icon color="grey darken-2">delete</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <p class="belief mb-2">„{{ entry.belief }}"</p>
          <v-layout row wrap class="mb-1">
            <v-chip small :color="entry.isTrue ? 'primary' : 'grey'" text-color="white">
              Wahr: {{ entry.isTrue ? 'Ja' : 'Nein' }}
            </v-chip>
            <v-chip small :color="entry.isReallyTrue ? 'primary' : 'grey'" text-color="white" class="ml-1">
              Wirklich wahr: {{ entry.isReallyTrue ? 'Ja' : 'Nein' }}
            </v-chip>
          </v-layout>
          <p class="section-label caption grey--text mt-2">Mit dem Glauben</p>
          <p class="body-1">{{ entry.withBelief }}</p>
          <p class="section-label caption grey--text mt-2">Ohne den Glauben</p>
          <p class="body-1">{{ entry.withoutBelief }}</p>
          <p class="section-label caption grey--text mt-2">Umkehrung</p>
          <p class="body-1">{{ entry.turnaround }}</p>
        </v-card-text>
      </v-card>

      <v-dialog v-model="isDeleteDialogShowing" width="500">
        <v-card>
          <v-card-title class="subheading" primary-title>
            Eintrag wirklich löschen?
          </v-card-title>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="secondary" flat @click="cancelDelete">abbrechen</v-btn>
            <v-btn color="red" flat @click="confirmDelete">löschen</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-content>

    <v-bottom-nav :value="true" fixed color="white" class="elevation-3">
      <v-btn flat color="grey" to="/check-ins">
        <span>Check-Ins</span>
        <v-icon>favorite_border</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/the-work">
        <span>The Work</span>
        <v-icon>lightbulb_outline</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  name: 'the-work-list',
  data() {
    return {
      entryToDelete: null,
      isDeleteDialogShowing: false,
    };
  },
  computed: {
    theWork() {
      return this.$store.getters.theWork.concat().sort((a, b) => b.time - a.time);
    },
  },
  methods: {
    preDelete(entry) {
      this.entryToDelete = entry;
      this.isDeleteDialogShowing = true;
    },
    confirmDelete() {
      this.isDeleteDialogShowing = false;
      this.$store.dispatch('deleteTheWork', this.entryToDelete);
      this.entryToDelete = null;
    },
    cancelDelete() {
      this.isDeleteDialogShowing = false;
      this.entryToDelete = null;
    },
    formatTime(time) {
      moment.locale('de');
      return moment(time).format('llll');
    },
  },
};
</script>

<style scoped lang="scss">
.entry {
  margin: 1rem;
}
.belief {
  font-style: italic;
  font-size: 1.05rem;
}
.section-label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
