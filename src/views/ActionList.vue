<template>
  <div class="dark-page">
    <v-toolbar color="#000" dark flat app>
      <v-spacer></v-spacer>
      <v-btn icon @click="$router.push('/settings')">
        <v-icon color="#4ade80">settings</v-icon>
      </v-btn>
    </v-toolbar>

    <v-content>
      <div class="page-title-area">
        <h1 class="page-title">Handlungen</h1>
      </div>

      <div v-if="actions.length === 0" class="empty-state">
        <span class="empty-icon">🏃</span>
        <p class="empty-title">Noch keine Handlungen</p>
        <p class="empty-sub">Füge Handlungen im Änderungsprozess einer Überzeugung hinzu.</p>
      </div>

      <div v-else class="ios-list">
        <template v-for="(item, i) in actions">
          <div :key="item.text + '-row'" class="ios-row" @click="toggle(i)">
            <div class="row-body">
              <p class="row-title">{{ item.text }}</p>
              <p class="row-meta">{{ item.beliefCount }} {{ item.beliefCount === 1 ? 'Überzeugung' : 'Überzeugungen' }}</p>
            </div>
            <div class="row-actions">
              <span class="count-badge">{{ item.beliefCount }}</span>
              <v-btn icon small @click.stop="preDelete(item)" class="row-action-btn">
                <v-icon small color="#636366">delete</v-icon>
              </v-btn>
              <v-icon class="row-chevron" :class="{ rotated: openIndex === i }">chevron_right</v-icon>
            </div>
          </div>
          <div :key="item.text + '-expand'" v-if="openIndex === i" class="row-expand">
            <p class="expand-label">Überzeugungen</p>
            <p v-for="(s, j) in item.sources" :key="j" class="expand-text mb-1">„{{ s.beliefText }}"</p>
          </div>
          <div :key="item.text + '-sep'" class="ios-sep" v-if="i < actions.length - 1"></div>
        </template>
      </div>

      <v-dialog v-model="isDeleteDialogShowing" width="300">
        <v-card class="confirm-dialog">
          <v-card-title class="confirm-title">Handlung löschen?</v-card-title>
          <v-divider></v-divider>
          <v-card-actions class="confirm-actions">
            <v-btn flat @click="cancelDelete" class="confirm-cancel">Abbrechen</v-btn>
            <v-btn flat @click="confirmDelete" class="confirm-delete">Löschen</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-content>

    <v-bottom-nav :value="true" fixed app color="#1c1c1e" class="dark-nav">
      <v-btn flat color="grey" to="/patterns">
        <v-icon>bolt</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/beliefs">
        <v-icon>lightbulb_outline</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/affirmations">
        <v-icon>stars</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/actions">
        <v-icon>directions_run</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/empathy">
        <v-icon>favorite_border</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
export default {
  name: 'action-list',
  data() {
    return {
      openIndex: null,
      itemToDelete: null,
      isDeleteDialogShowing: false,
    };
  },
  computed: {
    actions() {
      const map = {};
      this.$store.getters.beliefs.forEach((belief) => {
        const acts = belief.reflection && belief.reflection.changeActs ? belief.reflection.changeActs : [];
        acts.forEach((text) => {
          if (!text) return;
          if (!map[text]) map[text] = { text, beliefCount: 0, sources: [] };
          map[text].beliefCount += 1;
          map[text].sources.push({ beliefText: belief.belief });
        });
      });
      return Object.values(map).sort((a, b) => b.beliefCount - a.beliefCount);
    },
  },
  methods: {
    toggle(i) {
      this.openIndex = this.openIndex === i ? null : i;
    },
    preDelete(item) {
      this.itemToDelete = item;
      this.isDeleteDialogShowing = true;
    },
    cancelDelete() {
      this.isDeleteDialogShowing = false;
      this.itemToDelete = null;
    },
    confirmDelete() {
      this.isDeleteDialogShowing = false;
      const text = this.itemToDelete ? this.itemToDelete.text : null;
      this.itemToDelete = null;
      if (!text) return;
      this.$store.getters.beliefs.forEach((belief) => {
        const acts = belief.reflection && belief.reflection.changeActs ? belief.reflection.changeActs : [];
        if (acts.indexOf(text) !== -1) {
          const updated = Object.assign({}, belief, {
            reflection: Object.assign({}, belief.reflection, {
              changeActs: acts.filter(a => a !== text),
            }),
          });
          this.$store.dispatch('updateBelief', updated);
        }
      });
      this.openIndex = null;
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
  padding: 13px 12px 13px 20px;
  background: #1c1c1e;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  &:active { background: #2c2c2e; }
}
.row-body {
  flex: 1;
  min-width: 0;
}
.row-title {
  font-size: 0.95rem;
  color: #fff;
  margin: 0 0 2px;
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
}
.row-meta {
  font-size: 0.78rem;
  color: #8e8e93;
  margin: 0;
}
.row-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 4px;
}
.row-action-btn { margin: 0 !important; }
.count-badge {
  color: #4ade80;
  font-size: 0.8rem;
  font-weight: 700;
  border: 1.5px solid #4ade80;
  border-radius: 20px;
  padding: 1px 7px;
  min-width: 22px;
  text-align: center;
}
.row-chevron {
  color: #636366 !important;
  font-size: 1.2rem !important;
  transition: transform 0.2s ease;
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
  font-size: 0.68rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 6px;
  font-weight: 600;
}
.expand-text {
  font-size: 0.93rem;
  color: #ebebf5;
  margin: 0;
  line-height: 1.5;
  font-style: italic;
}
.mb-1 { margin-bottom: 4px !important; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5rem 2rem;
  text-align: center;
}
.empty-icon { font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 16px; }
.empty-title { font-size: 1.1rem; color: #fff; font-weight: 600; margin: 0 0 6px; }
.empty-sub { font-size: 0.875rem; color: #8e8e93; margin: 0; }

.confirm-dialog { border-radius: 14px !important; overflow: hidden; }
.confirm-title {
  font-size: 1rem !important;
  font-weight: 600 !important;
  color: #fff !important;
  justify-content: center !important;
  padding: 16px !important;
}
.confirm-actions { padding: 0 !important; display: flex; }
.confirm-cancel { flex: 1; color: #4ade80 !important; border-right: 1px solid #3a3a3c; }
.confirm-delete { flex: 1; color: #ff453a !important; font-weight: 600 !important; }

.dark-nav { border-top: 1px solid #2c2c2e !important; }
</style>
