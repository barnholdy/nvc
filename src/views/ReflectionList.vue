<template>
  <div class="reflection-list">
    <v-toolbar color="white" app>
      <v-toolbar-title>Reflektion</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon to="/add-reflection">
        <v-icon>add</v-icon>
      </v-btn>
    </v-toolbar>
    <v-content>
      <template v-if="reflections.length">
        <v-card
          class="reflection-card"
          v-for="entry in reflections"
          :key="entry.time">
          <v-card-title class="reflection-header" @click="toggle(entry.time)">
            <div class="reflection-title-row">
              <p class="subheading fear-title mb-0">{{ entry.fear }}</p>
              <v-btn icon small @click.stop="preDelete(entry)" class="delete-btn">
                <v-icon color="grey darken-2">delete</v-icon>
              </v-btn>
            </div>
            <p class="caption grey--text mt-1 mb-0">{{ formatTime(entry.time) }}</p>
          </v-card-title>
          <template v-if="openEntry === entry.time">
            <v-divider></v-divider>
            <v-card-text>
              <p class="section-label caption grey--text">Zugrundeliegender Glaubenssatz</p>
              <p class="body-1">{{ entry.belief }}</p>
              <p class="section-label caption grey--text mt-2">Reflexion</p>
              <p class="body-1 reflection-text">{{ entry.reflection }}</p>
            </v-card-text>
          </template>
        </v-card>
      </template>

      <div v-else class="empty-state">
        <v-icon large color="grey lighten-2">spa</v-icon>
        <p class="body-1 grey--text mt-2">Noch keine Reflektionen vorhanden.</p>
        <p class="caption grey--text">Starte eine neue Reflektion über das + Symbol.</p>
      </div>

      <v-dialog v-model="isDeleteDialogShowing" width="500">
        <v-card>
          <v-card-title class="subheading" primary-title>
            Reflektion wirklich löschen?
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

    <v-bottom-nav :value="true" fixed app color="white" class="elevation-3">
      <v-btn flat color="grey" to="/check-ins">
        <span>Check-Ins</span>
        <v-icon>favorite_border</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/patterns">
        <span>Muster</span>
        <v-icon>repeat</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/affirmations">
        <span>Affirmationen</span>
        <v-icon>stars</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/reflections">
        <span>Reflektion</span>
        <v-icon>spa</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  name: 'reflection-list',
  data() {
    return {
      openEntry: null,
      entryToDelete: null,
      isDeleteDialogShowing: false,
    };
  },
  computed: {
    reflections() {
      return this.$store.getters.reflections
        .concat()
        .sort(function(a, b) { return b.time - a.time; });
    },
  },
  methods: {
    toggle(time) {
      this.openEntry = this.openEntry === time ? null : time;
    },
    preDelete(entry) {
      this.entryToDelete = entry;
      this.isDeleteDialogShowing = true;
    },
    confirmDelete() {
      this.isDeleteDialogShowing = false;
      this.$store.dispatch('deleteReflection', this.entryToDelete);
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
.reflection-card {
  margin: 1rem;
}
.reflection-header {
  cursor: pointer;
  user-select: none;
  flex-direction: column;
  align-items: stretch;
  padding-bottom: 8px;
}
.reflection-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
}
.fear-title {
  white-space: normal;
  word-break: break-word;
  flex: 1;
  line-height: 1.4;
}
.delete-btn {
  flex-shrink: 0;
  margin-top: -4px;
}
.section-label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.reflection-text {
  white-space: pre-wrap;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  text-align: center;
}
</style>
