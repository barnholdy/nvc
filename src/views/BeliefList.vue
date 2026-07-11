<template>
  <div class="dark-page">
    <v-toolbar color="#000" dark flat app>
      <v-toolbar-title>Überzeugungen</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$router.push('/add-belief')">
        <v-icon color="#4ade80">add</v-icon>
      </v-btn>
      <v-btn icon @click="$router.push('/settings')">
        <v-icon color="#4ade80">settings</v-icon>
      </v-btn>
    </v-toolbar>

    <v-content>
      <div class="intro-card">
        <span class="intro-icon">💡</span>
        <p class="intro-title">Dein inneres Betriebssystem</p>
        <p class="intro-text">Deine Überzeugungen formen dein Denken, Fühlen und Handeln. Authentizität entsteht, wenn du klar siehst, was du glaubst — und dann bewusst wählst, was bleiben darf.</p>
      </div>

      <div class="segment-row">
        <button class="seg-tab" :class="{ active: tab === 'open' }" @click="tab = 'open'">Offen</button>
        <button class="seg-tab" :class="{ active: tab === 'working' }" @click="tab = 'working'">In Arbeit</button>
        <button class="seg-tab" :class="{ active: tab === 'done' }" @click="tab = 'done'">Verändert</button>
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
            class="swipe-outer"
            @touchstart="tsStart($event, idx)"
            @touchmove="tsMove($event, idx)"
            @touchend="tsEnd($event, idx)"
          >
            <div class="swipe-right-panel">
              <button class="swipe-btn swipe-btn-edit" @click.stop="editEntry(entry)">
                <v-icon small color="#fff">edit</v-icon>
                <span>Bearb.</span>
              </button>
              <button class="swipe-btn swipe-btn-empathy" @click.stop="empathyEntry(entry)">
                <v-icon small color="#fff">favorite</v-icon>
                <span>Empathie</span>
              </button>
              <button class="swipe-btn swipe-btn-change" @click.stop="changeEntry(entry)">
                <v-icon small color="#fff">autorenew</v-icon>
                <span>Ändern</span>
              </button>
            </div>
            <div class="swipe-left-panel">
              <button class="swipe-btn swipe-btn-delete" @click.stop="preDelete(entry)">
                <v-icon small color="#fff">delete</v-icon>
                <span>Löschen</span>
              </button>
            </div>
            <div class="ios-row" :style="rowSt(idx, 195)" @click="deskClick(idx)">
              <div class="row-body">
                <p class="row-title">{{ entry.belief }}</p>
                <div class="row-badges">
                  <span v-if="patternCount(entry.time) > 0" class="badge-pill">
                    {{ patternCount(entry.time) }} {{ patternCount(entry.time) === 1 ? 'Situation' : 'Situationen' }}
                  </span>
                </div>
              </div>
              <v-icon class="row-chevron" :class="{ rotated: openEntry === entry.time }">chevron_right</v-icon>
            </div>
          </div>

          <div
            v-if="openEntry === entry.time"
            :key="entry.time + '-expand'"
            class="row-expand"
          >
            <template v-if="associatedPatterns(entry.time).length">
              <p class="expand-label">Situationen</p>
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
        <v-icon>bolt</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/beliefs">
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
export default {
  name: 'belief-list',
  data() {
    return {
      openEntry: null,
      entryToDelete: null,
      isDeleteDialogShowing: false,
      tab: 'open',
      sw: { openIdx: null, openDir: null, touchIdx: null, startX: 0, startY: 0, dx: 0, isH: null, drag: false },
    };
  },
  watch: {
    tab() { this.sw.openIdx = null; this.sw.openDir = null; this.openEntry = null; },
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
        const complete = this.isComplete(e);
        const changed = complete && this.hasChangeData(e) && e.affirmations && e.affirmations.length;
        if (this.tab === 'open') return !complete;
        if (this.tab === 'working') return complete && !changed;
        if (this.tab === 'done') return !!changed;
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
      this.sw.openIdx = null; this.sw.openDir = null;
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
    preDelete(entry) { this.entryToDelete = entry; this.isDeleteDialogShowing = true; },
    confirmDelete() {
      this.isDeleteDialogShowing = false;
      this.$store.dispatch('deleteBelief', this.entryToDelete);
      this.entryToDelete = null;
    },
    cancelDelete() { this.isDeleteDialogShowing = false; this.entryToDelete = null; },
    tsStart(e, i) {
      const t = e.touches[0];
      this.sw.touchIdx = i; this.sw.startX = t.clientX; this.sw.startY = t.clientY;
      this.sw.dx = 0; this.sw.isH = null; this.sw.drag = false;
    },
    tsMove(e, i) {
      if (this.sw.touchIdx !== i) return;
      const t = e.touches[0];
      const dx = t.clientX - this.sw.startX, dy = t.clientY - this.sw.startY;
      if (this.sw.isH === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4))
        this.sw.isH = Math.abs(dx) >= Math.abs(dy);
      if (!this.sw.isH) return;
      e.preventDefault();
      this.sw.dx = Math.max(-80, Math.min(dx, 195));
      this.sw.drag = true;
    },
    tsEnd(e, i) {
      if (this.sw.touchIdx !== i) return;
      const wasVert = this.sw.isH === false;
      if (!wasVert) e.preventDefault();
      if (!this.sw.drag && !wasVert) {
        if (this.sw.openIdx !== null) { this.sw.openIdx = null; this.sw.openDir = null; }
        else { this.onRowTap(i); }
      } else if (this.sw.drag) {
        if (this.sw.dx < -40) { this.sw.openIdx = i; this.sw.openDir = 'left'; }
        else if (this.sw.dx > 40) { this.sw.openIdx = i; this.sw.openDir = 'right'; }
        else { this.sw.openIdx = null; this.sw.openDir = null; }
        this.openEntry = null;
      }
      this.sw.touchIdx = null; this.sw.dx = 0; this.sw.drag = false; this.sw.isH = null;
    },
    rowSt(i, rw) {
      const s = this.sw;
      const live = s.touchIdx === i && s.drag && s.isH;
      let x = 0;
      if (live) x = s.dx;
      else if (s.openIdx === i) x = s.openDir === 'left' ? -80 : rw;
      return { transform: `translateX(${x}px)`, transition: live ? 'none' : 'transform 0.2s ease' };
    },
    onRowTap(i) {
      const entry = this.filteredBeliefs[i];
      if (entry) this.toggle(entry.time);
    },
    deskClick(i) {
      if (this.sw.openIdx !== null) { this.sw.openIdx = null; this.sw.openDir = null; return; }
      this.onRowTap(i);
    },
  },
};
</script>

<style scoped lang="scss">
.dark-page { background: #000; min-height: 100vh; }

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
    bottom: -1px; left: 0; right: 0;
    height: 2px;
    background: transparent;
    border-radius: 2px;
  }
  &.active { color: #fff; font-weight: 600; &::after { background: #4ade80; } }
}

.ios-list {
  background: #1c1c1e;
  border-radius: 12px;
  margin: 8px 16px 24px;
  overflow: hidden;
}

/* ─── Swipe rows ─── */
.swipe-outer {
  position: relative;
  overflow: hidden;
  background: #1c1c1e;
}
.swipe-right-panel {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  display: flex;
  align-items: stretch;
}
.swipe-left-panel {
  position: absolute;
  right: 0; top: 0; bottom: 0;
  display: flex;
  align-items: stretch;
}
.swipe-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-size: 0.62rem;
  font-weight: 600;
  font-family: inherit;
  color: #fff;
  width: 65px;
  padding: 0;
  gap: 3px;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.85; }
}
.swipe-btn-delete { background: #ff453a; width: 80px; }
.swipe-btn-edit { background: #636366; }
.swipe-btn-empathy { background: #2f7a52; }
.swipe-btn-change { background: #1a5fa8; }

.ios-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 12px 12px 12px 20px;
  background: #1c1c1e;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
  &:active { background: #2c2c2e; }
}
.row-body { flex: 1; min-width: 0; }
.row-title {
  font-size: 0.95rem;
  color: #fff;
  margin: 0 0 3px;
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
}
.row-badges { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.badge-pill {
  font-size: 0.7rem;
  color: #8e8e93;
  background: #2c2c2e;
  border-radius: 20px;
  padding: 1px 6px;
}
.row-chevron {
  color: #636366 !important;
  font-size: 1.2rem !important;
  transition: transform 0.2s ease;
  margin-left: 2px;
  flex-shrink: 0;
  &.rotated { transform: rotate(90deg); }
}

.ios-sep { height: 1px; background: #2c2c2e; margin-left: 20px; }

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
.expand-sub-label { font-size: 0.75rem; color: #636366; margin: 0 0 3px; font-style: italic; }
.expand-text { font-size: 0.93rem; color: #ebebf5; margin: 0; line-height: 1.5; }
.empathy-text { white-space: pre-wrap; }
.chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
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
  display: flex; flex-direction: column; align-items: center;
  padding: 5rem 2rem; text-align: center;
}
.empty-icon { font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 16px; }
.empty-title { font-size: 1.1rem; color: #fff; font-weight: 600; margin: 0 0 6px; }
.empty-sub { font-size: 0.875rem; color: #8e8e93; margin: 0; }

.confirm-dialog { border-radius: 14px !important; overflow: hidden; }
.confirm-title {
  font-size: 1rem !important; font-weight: 600 !important; color: #fff !important;
  justify-content: center !important; padding: 16px !important;
}
.confirm-actions { padding: 0 !important; display: flex; }
.confirm-cancel { flex: 1; color: #4ade80 !important; border-right: 1px solid #3a3a3c; }
.confirm-delete { flex: 1; color: #ff453a !important; font-weight: 600 !important; }

.dark-nav { border-top: 1px solid #2c2c2e !important; }
</style>
