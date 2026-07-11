<template>
  <div class="dark-page">
    <v-toolbar color="#000" dark flat app>
      <v-spacer></v-spacer>
      <v-btn icon @click="$router.push('/add-belief')">
        <v-icon color="#34c759">add</v-icon>
      </v-btn>
      <v-btn icon @click="$router.push('/settings')">
        <v-icon color="#34c759">settings</v-icon>
      </v-btn>
    </v-toolbar>

    <v-content>
      <div class="page-title-area">
        <h1 class="page-title">Überzeugungen</h1>
      </div>

      <!-- Segment tabs -->
      <div class="segment-row">
        <button
          class="seg-tab"
          :class="{ active: tab === 'open' }"
          @click="tab = 'open'"
        >Offen</button>
        <button
          class="seg-tab"
          :class="{ active: tab === 'working' }"
          @click="tab = 'working'"
        >In Arbeit</button>
        <button
          class="seg-tab"
          :class="{ active: tab === 'done' }"
          @click="tab = 'done'"
        >Verändert</button>
      </div>

      <div v-if="filteredBeliefs.length === 0" class="empty-state">
        <span class="empty-icon">💡</span>
        <p class="empty-title">Keine Einträge</p>
        <p class="empty-sub">
          <template v-if="tab === 'open'">Tippe auf + um eine Überzeugung hinzuzufügen.</template>
          <template v-else-if="tab === 'working'">Noch keine Überzeugungen in Bearbeitung.</template>
          <template v-else>Noch keine veränderten Überzeugungen.</template>
        </p>
      </div>

      <div v-else class="ios-list">
        <template v-for="(entry, idx) in filteredBeliefs">
          <div
            :key="entry.time + '-row'"
            class="ios-row"
            @click="toggle(entry.time)"
          >
            <div class="row-body">
              <p class="row-title">{{ entry.belief }}</p>
              <div class="row-badges">
                <span v-if="patternCount(entry.time) > 0" class="badge-pill">
                  {{ patternCount(entry.time) }} {{ patternCount(entry.time) === 1 ? 'Trigger' : 'Trigger' }}
                </span>
                <span v-if="isComplete(entry)" class="badge-dot green"></span>
                <span v-if="entry.empathy" class="badge-dot teal"></span>
                <span v-if="hasChangeData(entry)" class="badge-dot blue"></span>
              </div>
            </div>
            <div class="row-actions">
              <v-btn icon small @click.stop="editEntry(entry)" class="row-action-btn">
                <v-icon small :color="isComplete(entry) ? '#34c759' : '#636366'">edit</v-icon>
              </v-btn>
              <v-btn icon small @click.stop="empathyEntry(entry)" class="row-action-btn">
                <v-icon small :color="entry.empathy ? '#34c759' : '#636366'">favorite</v-icon>
              </v-btn>
              <v-btn icon small @click.stop="changeEntry(entry)" class="row-action-btn">
                <v-icon small :color="hasChangeData(entry) ? '#34c759' : '#636366'">autorenew</v-icon>
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
            <template v-if="associatedPatterns(entry.time).length">
              <p class="expand-label">Trigger</p>
              <p v-for="(p, i) in associatedPatterns(entry.time)" :key="i" class="expand-text mb-1">{{ p.trigger || p.name }}</p>
            </template>
            <template v-if="entry.feelings && entry.feelings.length">
              <p class="expand-label mt-3">Gefühle</p>
              <div class="chip-row mb-2">
                <span v-for="(f, i) in entry.feelings" :key="i" class="dark-chip">{{ f.name }}</span>
              </div>
            </template>
            <template v-if="entry.withBelief">
              <p class="expand-label mt-3">Reaktion</p>
              <p class="expand-text">{{ entry.withBelief }}</p>
            </template>
            <template v-if="entry.needs && entry.needs.length">
              <p class="expand-label mt-3">Bedürfnis</p>
              <div class="chip-row mb-2">
                <span v-for="(n, i) in entry.needs" :key="i" class="dark-chip">{{ n.name }}</span>
              </div>
            </template>
            <template v-if="entry.reflection && entry.reflection.origin">
              <p class="expand-label mt-3">Ursprung</p>
              <p class="expand-text">{{ entry.reflection.origin }}</p>
            </template>
            <template v-if="entry.empathy">
              <p class="expand-label mt-3">Empathie</p>
              <p class="expand-text empathy-text">{{ entry.empathy }}</p>
            </template>
            <template v-if="hasChangeData(entry) || (entry.affirmations && entry.affirmations.length)">
              <p class="expand-label mt-3">Veränderung</p>
              <template v-if="entry.reflection && entry.reflection.withoutBelief">
                <p class="expand-sub-label">Neue Perspektive</p>
                <p class="expand-text">{{ entry.reflection.withoutBelief }}</p>
              </template>
              <template v-if="entry.affirmations && entry.affirmations.length">
                <p class="expand-sub-label mt-2">Affirmationen</p>
                <p v-for="(a, i) in entry.affirmations" :key="i" class="expand-text mb-1">{{ a.text }}</p>
              </template>
              <template v-if="entry.reflection && entry.reflection.changeActs && entry.reflection.changeActs.length">
                <p class="expand-sub-label mt-2">Handlungen</p>
                <p v-for="(a, i) in entry.reflection.changeActs" :key="i" class="expand-text mb-1">{{ a }}</p>
              </template>
            </template>
          </div>

          <div :key="entry.time + '-sep'" class="ios-sep" v-if="idx < filteredBeliefs.length - 1"></div>
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
      <v-btn flat color="grey" to="/patterns">
        <span>Trigger</span>
        <v-icon>bolt</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/beliefs">
        <span>Überzeugungen</span>
        <v-icon>lightbulb_outline</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/affirmations">
        <span>Affirmationen</span>
        <v-icon>stars</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/actions">
        <span>Handlungen</span>
        <v-icon>directions_run</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/empathy">
        <span>Empathie</span>
        <v-icon>favorite_border</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import TagList from '@/components/TagList.vue';

export default {
  name: 'belief-list',
  components: { TagList },
  data() {
    return {
      openEntry: null,
      entryToDelete: null,
      isDeleteDialogShowing: false,
      tab: 'open',
    };
  },
  computed: {
    beliefs() {
      const map = this.patternCountMap;
      return this.$store.getters.beliefs
        .concat()
        .sort((a, b) => ((map[b.time] || 0) - (map[a.time] || 0)) || (b.time - a.time));
    },
    filteredBeliefs() {
      return this.beliefs.filter((e) => {
        if (this.tab === 'open') return !this.hasChangeData(e) && !(e.affirmations && e.affirmations.length);
        if (this.tab === 'working') return this.hasChangeData(e) && !(e.affirmations && e.affirmations.length);
        if (this.tab === 'done') return !!(e.affirmations && e.affirmations.length);
        return true;
      });
    },
    patternCountMap() {
      const map = {};
      this.$store.getters.patterns.forEach((p) => {
        (p.beliefs || []).forEach((id) => { map[id] = (map[id] || 0) + 1; });
      });
      return map;
    },
  },
  methods: {
    patternCount(beliefTime) { return this.patternCountMap[beliefTime] || 0; },
    associatedPatterns(beliefTime) {
      return this.$store.getters.patterns.filter(p => (p.beliefs || []).indexOf(beliefTime) !== -1);
    },
    toggle(time) {
      this.openEntry = this.openEntry === time ? null : time;
    },
    isComplete(entry) {
      return !!(
        entry.feelings && entry.feelings.length &&
        entry.withBelief &&
        entry.needs && entry.needs.length &&
        entry.reflection && entry.reflection.origin
      );
    },
    hasChangeData(entry) {
      const r = entry.reflection || {};
      return !!(r.withoutBelief || r.changeAct || (r.changeActs && r.changeActs.length));
    },
    empathyEntry(entry) { this.$router.push(`/empathy-belief/${entry.time}`); },
    changeEntry(entry) { this.$router.push(`/change-belief/${entry.time}`); },
    editEntry(entry) { this.$router.push(`/edit-belief/${entry.time}`); },
    preDelete(entry) {
      this.entryToDelete = entry;
      this.isDeleteDialogShowing = true;
    },
    confirmDelete() {
      this.isDeleteDialogShowing = false;
      this.$store.dispatch('deleteBelief', this.entryToDelete);
      this.entryToDelete = null;
    },
    cancelDelete() {
      this.isDeleteDialogShowing = false;
      this.entryToDelete = null;
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
  padding: 8px 20px 12px;
}
.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
  margin: 0;
}

/* ─── Segment tabs ─── */
.segment-row {
  display: flex;
  padding: 0 16px 16px;
  border-bottom: 1px solid #2c2c2e;
  margin-bottom: 4px;
}
.seg-tab {
  flex: 1;
  background: none;
  border: none;
  padding: 8px 0;
  font-size: 0.875rem;
  color: #8e8e93;
  cursor: pointer;
  position: relative;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;

  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: transparent;
    border-radius: 2px;
  }
  &.active {
    color: #fff;
    font-weight: 600;
    &::after { background: #34c759; }
  }
}

/* ─── List ─── */
.ios-list {
  background: #1c1c1e;
  border-radius: 12px;
  margin: 8px 16px 24px;
  overflow: hidden;
}
.ios-row {
  display: flex;
  align-items: center;
  padding: 12px 12px 12px 20px;
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
  margin: 0 0 3px;
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
}
.row-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.badge-pill {
  font-size: 0.7rem;
  color: #8e8e93;
  background: #2c2c2e;
  border-radius: 20px;
  padding: 1px 6px;
}
.badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  &.green { background: #34c759; }
  &.teal { background: #5ac8fa; }
  &.blue { background: #0a84ff; }
}
.row-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.row-action-btn {
  margin: 0 !important;
}
.row-chevron {
  color: #636366 !important;
  font-size: 1.2rem !important;
  transition: transform 0.2s ease;
  margin-left: 2px;
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
  margin: 0 0 4px;
  font-weight: 600;
}
.expand-sub-label {
  font-size: 0.75rem;
  color: #636366;
  margin: 0 0 3px;
  font-style: italic;
}
.expand-text {
  font-size: 0.93rem;
  color: #ebebf5;
  margin: 0;
  line-height: 1.5;
}
.empathy-text { white-space: pre-wrap; }
.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.dark-chip {
  background: #3a3a3c;
  color: #fff;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 0.8rem;
}
.mt-3 { margin-top: 12px !important; }
.mt-2 { margin-top: 8px !important; }
.mb-1 { margin-bottom: 4px !important; }
.mb-2 { margin-bottom: 8px !important; }

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
.confirm-cancel { flex: 1; color: #34c759 !important; border-right: 1px solid #3a3a3c; }
.confirm-delete { flex: 1; color: #ff453a !important; font-weight: 600 !important; }

.dark-nav { border-top: 1px solid #2c2c2e !important; }
</style>
