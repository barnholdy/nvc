<template>
  <div class="dark-page">
    <v-toolbar color="#000" dark flat app>
      <v-spacer></v-spacer>
      <v-btn icon @click="$router.push('/add-pattern')">
        <v-icon color="#34c759">add</v-icon>
      </v-btn>
      <v-btn icon @click="$router.push('/settings')">
        <v-icon color="#34c759">settings</v-icon>
      </v-btn>
    </v-toolbar>

    <v-content>
      <div class="page-title-area">
        <h1 class="page-title">Situationen</h1>
      </div>

      <div v-if="patterns.length === 0" class="empty-state">
        <span class="empty-icon">⚡</span>
        <p class="empty-title">Noch keine Trigger</p>
        <p class="empty-sub">Tippe auf + um einen neuen Trigger hinzuzufügen.</p>
      </div>

      <div v-else class="ios-list">
        <template v-for="(entry, idx) in patterns">
          <div
            :key="entry.time + '-row'"
            class="ios-row"
            @click="toggle(entry.time)"
          >
            <div class="row-body">
              <p class="row-title">{{ entry.name }}</p>
              <p class="row-meta">{{ formatTime(entry.time) }}</p>
            </div>
            <div class="row-actions">
              <v-btn icon small @click.stop="editEntry(entry)" class="row-action-btn">
                <v-icon small color="#636366">edit</v-icon>
              </v-btn>
              <v-btn icon small @click.stop="preDelete(entry)" class="row-action-btn">
                <v-icon small color="#636366">delete</v-icon>
              </v-btn>
              <v-icon class="row-chevron" :class="{ rotated: openEntry === entry.time }">chevron_right</v-icon>
            </div>
          </div>
          <div
            v-if="openEntry === entry.time"
            :key="entry.time + '-expand'"
            class="row-expand"
          >
            <template v-if="entry.trigger">
              <p class="expand-label">Situation</p>
              <p class="expand-text">{{ entry.trigger }}</p>
            </template>
            <template v-if="getBeliefs(entry).length">
              <p class="expand-label" :class="entry.trigger ? 'mt-3' : ''">Überzeugungen</p>
              <p v-for="(b, i) in getBeliefs(entry)" :key="i" class="expand-text mb-1">{{ b.belief }}</p>
            </template>
          </div>
          <div :key="entry.time + '-sep'" class="ios-sep" v-if="idx < patterns.length - 1"></div>
        </template>
      </div>

      <v-dialog v-model="isDeleteDialogShowing" width="300">
        <v-card class="confirm-dialog">
          <v-card-title class="confirm-title">Eintrag löschen?</v-card-title>
          <v-divider></v-divider>
          <v-card-actions class="confirm-actions">
            <v-btn flat @click="cancelDelete" class="confirm-cancel">Abbrechen</v-btn>
            <v-btn flat @click="confirmDelete" class="confirm-delete">Löschen</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-content>

    <v-bottom-nav :value="true" fixed app color="#1c1c1e" class="dark-nav">
      <v-btn flat color="primary" to="/patterns">
        <v-icon>bolt</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/beliefs">
        <v-icon>lightbulb_outline</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/affirmations">
        <v-icon>stars</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/actions">
        <v-icon>directions_run</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/empathy">
        <v-icon>favorite_border</v-icon>
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
        .sort((a, b) => b.time - a.time);
    },
  },
  methods: {
    getBeliefs(entry) {
      const beliefs = this.$store.getters.beliefs;
      const ids = entry.beliefs || [];
      return ids.map(id => beliefs.find(b => b.time === id)).filter(Boolean);
    },
    toggle(time) {
      this.openEntry = this.openEntry === time ? null : time;
    },
    editEntry(entry) {
      this.$router.push(`/edit-pattern/${entry.time}`);
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
      return moment(time).fromNow();
    },
  },
};
</script>

<style scoped lang="scss">
.dark-page {
  background: #000;
  min-height: 100vh;
}

.page-title-area {
  padding: 8px 20px 16px;
}
.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
  margin: 0;
}

.ios-list {
  background: #1c1c1e;
  border-radius: 12px;
  margin: 0 16px 24px;
  overflow: hidden;
}

.ios-row {
  display: flex;
  align-items: center;
  padding: 13px 16px 13px 20px;
  background: #1c1c1e;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: #2c2c2e;
  }
}
.row-body {
  flex: 1;
  min-width: 0;
}
.row-title {
  font-size: 1rem;
  color: #fff;
  margin: 0;
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
}
.row-meta {
  font-size: 0.78rem;
  color: #8e8e93;
  margin: 2px 0 0;
}
.row-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 0px;
}
.row-action-btn {
  margin: 0 !important;
  padding: 0 !important;
}
.row-chevron {
  color: #636366 !important;
  font-size: 1.2rem !important;
  transition: transform 0.2s ease;
  margin-left: 4px;
  &.rotated { transform: rotate(90deg); }
}

.ios-sep {
  height: 1px;
  background: #2c2c2e;
  margin-left: 20px;
}

.row-expand {
  background: #141416;
  padding: 14px 20px 16px;
  border-top: 1px solid #2c2c2e;
}
.expand-label {
  font-size: 0.7rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 4px;
  font-weight: 600;
}
.expand-text {
  font-size: 0.95rem;
  color: #ebebf5;
  margin: 0;
  line-height: 1.5;
  white-space: pre-wrap;
}
.mt-3 { margin-top: 12px !important; }
.mb-1 { margin-bottom: 4px !important; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5rem 2rem;
  text-align: center;
}
.empty-icon {
  font-size: 3rem;
  opacity: 0.3;
  display: block;
  margin-bottom: 16px;
}
.empty-title {
  font-size: 1.1rem;
  color: #fff;
  font-weight: 600;
  margin: 0 0 6px;
}
.empty-sub {
  font-size: 0.875rem;
  color: #8e8e93;
  margin: 0;
}

.confirm-dialog {
  border-radius: 14px !important;
  overflow: hidden;
}
.confirm-title {
  font-size: 1rem !important;
  font-weight: 600 !important;
  color: #fff !important;
  justify-content: center !important;
  padding: 16px !important;
}
.confirm-actions {
  padding: 0 !important;
  display: flex;
}
.confirm-cancel {
  flex: 1;
  color: #34c759 !important;
  border-right: 1px solid #3a3a3c;
}
.confirm-delete {
  flex: 1;
  color: #ff453a !important;
  font-weight: 600 !important;
}

.dark-nav {
  border-top: 1px solid #2c2c2e !important;
}
</style>
