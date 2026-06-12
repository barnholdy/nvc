<template>
  <div class="pattern-list">
    <v-toolbar color="white" app>
      <v-toolbar-title>Meine Muster</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon to="/add-pattern">
        <v-icon>add</v-icon>
      </v-btn>
    </v-toolbar>
    <v-content>
      <div class="intro-text body-1 grey--text">
        <p><em>Deine Überzeugungen sind das Betriebssystem hinter deinen Entscheidungen, Reaktionen und Urteilen. Sie formen deine Muster.</em></p>
        <p><em>Viele davon wurden durch Familie, Kultur oder frühe Erfahrungen installiert — nicht von dir gewählt, sondern einfach übernommen.</em></p>
        <p><em>Authentizität entsteht nicht dadurch, dass du entscheidest, wer du sein willst. Sie entsteht, wenn du klar siehst, was du bereits glaubst — und dann bewusst wählst, welche Überzeugungen bleiben dürfen.</em></p>
        <p><em>Deine Muster aufzuschreiben macht das Unsichtbare sichtbar. Es gibt dir die Möglichkeit zu wählen, statt einfach zu reagieren.</em></p>
      </div>
      <v-card class="entry" v-for="entry in patterns" v-bind:key="entry.time">
        <v-card-title class="header" @click="toggle(entry.time)">
          <p class="subheading belief-title mb-1">{{ entry.name }}</p>
          <div class="header-bottom">
            <div class="header-meta">
              <p class="caption grey--text mb-0">{{ formatTime(entry.time) }}</p>
            </div>
            <div class="header-actions">
              <v-btn icon small @click.stop="editEntry(entry)">
                <v-icon color="grey darken-2">edit</v-icon>
              </v-btn>
              <v-btn icon small @click.stop="preDelete(entry)">
                <v-icon color="grey darken-2">delete</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card-title>
        <template v-if="openEntry === entry.time">
          <v-divider></v-divider>
          <v-card-text>
            <template v-if="entry.trigger">
              <p class="section-label caption grey--text">Situation</p>
              <p class="body-1">{{ entry.trigger }}</p>
            </template>
            <template v-if="getBeliefs(entry).length">
              <p class="section-label caption grey--text mt-2">Glaubenssätze</p>
              <p v-for="(b, idx) in getBeliefs(entry)" :key="idx" class="body-1 mb-1">{{ b.belief }}</p>
            </template>
          </v-card-text>
        </template>
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

    <v-bottom-nav :value="true" fixed app color="white" class="elevation-3">
      <v-btn flat color="primary" to="/patterns">
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
      <v-btn flat color="grey" to="/resentments">
        <span>Groll</span>
        <v-icon>whatshot</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  name: 'pattern-list',
  data() {
    return {
      openEntry: null,
      entryToDelete: null,
      isDeleteDialogShowing: false,
    };
  },
  computed: {
    patterns() {
      return this.$store.getters.patterns
        .concat()
        .sort(function(a, b) { return b.time - a.time; });
    },
  },
  methods: {
    getBeliefs(entry) {
      var beliefs = this.$store.getters.beliefs;
      var ids = entry.beliefs || [];
      return ids.map(function(id) {
        return beliefs.find(function(b) { return b.time === id; });
      }).filter(Boolean);
    },
    toggle(time) {
      this.openEntry = this.openEntry === time ? null : time;
    },
    editEntry(entry) {
      this.$router.push('/edit-pattern/' + entry.time);
    },
    preDelete(entry) {
      this.entryToDelete = entry;
      this.isDeleteDialogShowing = true;
    },
    confirmDelete() {
      this.isDeleteDialogShowing = false;
      this.$store.dispatch('deletePattern', this.entryToDelete);
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
.intro-text {
  margin: 1rem;
  line-height: 1.6;
}
.entry {
  margin: 1rem;
}
.header {
  cursor: pointer;
  user-select: none;
  flex-direction: column;
  align-items: stretch;
  padding-bottom: 8px;
}
.belief-title {
  white-space: normal;
  word-break: break-word;
}
.header-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-meta {
  flex: 1;
  min-width: 0;
}
.header-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.section-label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
