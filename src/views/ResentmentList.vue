<template>
  <div class="resentment-list">
    <v-toolbar color="white" app>
      <v-toolbar-title>Mein Groll</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon to="/add-resentment">
        <v-icon>add</v-icon>
      </v-btn>
    </v-toolbar>
    <v-content>
      <template v-if="resentments.length">
        <v-card
          class="resentment-card"
          v-for="entry in resentments"
          :key="entry.time">
          <v-card-title class="resentment-header" @click="toggle(entry.time)">
            <div class="resentment-title-row">
              <p class="subheading resentment-title mb-0">{{ entry.name }}</p>
              <v-btn icon small @click.stop="preDelete(entry)" class="delete-btn">
                <v-icon color="grey darken-2">delete</v-icon>
              </v-btn>
            </div>
            <p class="caption grey--text mt-1 mb-0">{{ formatTime(entry.time) }}</p>
          </v-card-title>
          <template v-if="openEntry === entry.time">
            <v-divider></v-divider>
            <v-card-text>
              <p class="section-label caption grey--text">Groll</p>
              <p class="body-1">{{ entry.resentment }}</p>
              <p class="section-label caption grey--text mt-2">Ursprung im Elternhaus</p>
              <p class="body-1">{{ entry.parents }}</p>
            </v-card-text>
          </template>
        </v-card>
      </template>

      <div v-else class="empty-state">
        <v-icon large color="grey lighten-2">whatshot</v-icon>
        <p class="body-1 grey--text mt-2">Noch kein Groll eingetragen.</p>
        <p class="caption grey--text">Starte einen neuen Eintrag über das + Symbol.</p>
      </div>

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

    <v-bottom-nav :value="true" fixed app color="white" class="elevation-3">
      <v-btn flat color="grey" to="/patterns">
        <span>Muster</span>
        <v-icon>repeat</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/beliefs">
        <span>Beliefs</span>
        <v-icon>lightbulb_outline</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/affirmations">
        <span>Affirmationen</span>
        <v-icon>stars</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/reflections">
        <span>Reflektion</span>
        <v-icon>spa</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/resentments">
        <span>Groll</span>
        <v-icon>whatshot</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  name: 'resentment-list',
  data() {
    return {
      openEntry: null,
      entryToDelete: null,
      isDeleteDialogShowing: false,
    };
  },
  computed: {
    resentments() {
      return this.$store.getters.resentments
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
      this.$store.dispatch('deleteResentment', this.entryToDelete);
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
.resentment-card {
  margin: 1rem;
}
.resentment-header {
  cursor: pointer;
  user-select: none;
  flex-direction: column;
  align-items: stretch;
  padding-bottom: 8px;
}
.resentment-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
}
.resentment-title {
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
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  text-align: center;
}
</style>
