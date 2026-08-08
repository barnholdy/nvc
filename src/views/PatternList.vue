<template>
  <div class="dark-page">
    <v-toolbar color="#000" dark flat app>
      <v-toolbar-title>Situationen</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$router.push('/add-pattern')">
        <v-icon color="#4ade80">add</v-icon>
      </v-btn>
      <v-btn icon @click="$router.push('/settings')">
        <v-icon color="#4ade80">settings</v-icon>
      </v-btn>
    </v-toolbar>

    <v-content>
      <div class="intro-card">
        <span class="intro-icon">⚡</span>
        <p class="intro-title">Zwischen Reiz und Reaktion</p>
        <p class="intro-text">In diesem Raum liegt unsere Macht, unsere Reaktion zu wählen. In unserer Reaktion liegen unser Wachstum und unsere Freiheit.</p>
      </div>

      <div v-if="patterns.length === 0" class="empty-state">
        <span class="empty-icon">⚡</span>
        <p class="empty-title">Noch keine Situationen</p>
        <p class="empty-sub">Tippe auf + um eine neue Situation hinzuzufügen.</p>
      </div>

      <div v-else class="ios-list">
        <template v-for="(entry, idx) in patterns">
          <div
            :key="entry.time + '-row'"
            class="swipe-outer"
            :data-row-id="entry.time"
            @touchstart="tsStart($event, idx)"
            @touchmove="tsMove($event, idx)"
            @touchend="tsEnd($event, idx)"
          >
            <div class="swipe-right-panel">
              <button class="swipe-btn swipe-btn-edit" @click.stop="editEntry(entry)">
                <v-icon small color="#fff">edit</v-icon>
                <span>Bearb.</span>
              </button>
            </div>
            <div class="swipe-left-panel">
              <button class="swipe-btn swipe-btn-delete" @click.stop="preDelete(entry)">
                <v-icon small color="#fff">delete</v-icon>
                <span>Löschen</span>
              </button>
            </div>
            <div class="ios-row" :style="rowSt(idx, 65)" @click="deskClick(idx)">
              <div class="row-body">
                <p class="row-title">{{ entry.trigger }}</p>
                <p class="row-meta">{{ formatTime(entry.time) }}</p>
              </div>
              <v-icon class="row-chevron" :class="{ rotated: openEntry === entry.time }">chevron_right</v-icon>
            </div>
          </div>
          <div
            v-if="openEntry === entry.time"
            :key="entry.time + '-expand'"
            class="row-expand"
          >
            <!-- The row itself is the situation text now, so repeating it here
                 would only say the same thing twice. -->
            <template v-if="getBeliefs(entry).length">
              <p class="expand-label">Überzeugungen</p>
              <div
                v-for="b in getBeliefs(entry)"
                :key="b.time"
                class="belief-row"
                @click="openBelief(b)"
              >
                <div class="belief-row-body">
                  <p class="expand-text">{{ b.belief }}</p>
                  <span class="status-pill" :style="{ color: statusColor(b) }">{{ statusLabel(b) }}</span>
                  <!-- What was recorded here, on the same scale it was given
                       on — a percentage hid which end of it that was. -->
                  <template v-if="truthOf(entry, b) !== null">
                    <p class="expand-label mt-2">Glaubwürdigkeit</p>
                    <div class="slider-row">
                      <span class="slider-end-label">0</span>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        :value="truthOf(entry, b)"
                        class="readonly-slider"
                        disabled
                      />
                      <span class="slider-end-label">10</span>
                    </div>
                  </template>
                </div>
                <v-icon small class="belief-chevron">chevron_right</v-icon>
              </div>
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
        <v-icon>flare</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/actions">
        <v-icon>gps_fixed</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import moment from 'moment';
import { beliefStatusLabel, beliefStatusColor } from '@/utils/beliefStatus';
import { beliefTruthIn } from '@/utils/credibility';
import { openQuery, requestedId, scrollRowIntoView } from '@/utils/reveal';

export default {
  name: 'pattern-list',
  data() {
    return {
      openEntry: null,
      entryToDelete: null,
      isDeleteDialogShowing: false,
      sw: { openIdx: null, openDir: null, touchIdx: null, startX: 0, startY: 0, dx: 0, isH: null, drag: false },
    };
  },
  computed: {
    patterns() {
      return this.$store.getters.patterns.concat().sort((a, b) => b.time - a.time);
    },
  },
  mounted() {
    this.revealRequested();
  },
  watch: {
    '$route.query.open': function() { this.revealRequested(); },
  },
  methods: {
    revealRequested() {
      const id = requestedId(this.$route);
      if (!id) return;
      const entry = this.patterns.find(p => String(p.time) === id);
      if (!entry) return;
      this.openEntry = entry.time;
      this.$nextTick(() => scrollRowIntoView(this.$el, entry.time));
    },
    getBeliefs(entry) {
      const beliefs = this.$store.getters.beliefs;
      return (entry.beliefs || []).map(id => beliefs.find(b => b.time === id)).filter(Boolean);
    },
    // Recorded on the situation when the belief was added to it.
    truthOf(entry, belief) { return beliefTruthIn(entry, belief); },
    statusLabel(belief) { return beliefStatusLabel(belief); },
    statusColor(belief) { return beliefStatusColor(belief); },
    openBelief(belief) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.$router.push({ path: '/beliefs', query: openQuery(belief.time) });
    },
    toggle(time) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.openEntry = this.openEntry === time ? null : time;
    },
    editEntry(entry) { this.sw.openIdx = null; this.sw.openDir = null; this.$router.push(`/edit-pattern/${entry.time}`); },
    preDelete(entry) { this.sw.openIdx = null; this.sw.openDir = null; this.entryToDelete = entry; this.isDeleteDialogShowing = true; },
    confirmDelete() {
      this.isDeleteDialogShowing = false;
      this.$store.dispatch('deletePattern', this.entryToDelete);
      this.entryToDelete = null;
    },
    cancelDelete() { this.isDeleteDialogShowing = false; this.entryToDelete = null; },
    // The date itself, not "vor 3 Monaten": these entries are looked back on,
    // and the same format the Handlungen list already uses.
    formatTime(time) { moment.locale('de'); return moment(time).format('D. MMMM YYYY'); },
    tsStart(e, i) {
      if (e.target && e.target.closest && e.target.closest('.swipe-btn')) return;
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
      this.sw.dx = Math.max(-80, Math.min(dx, 65));
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
      const entry = this.patterns[i];
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

.ios-list {
  background: #1c1c1e;
  border-radius: 12px;
  margin: 0 16px 24px;
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

.ios-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 13px 16px 13px 20px;
  background: #1c1c1e;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
  &:active { background: #2c2c2e; }
}
.row-body { flex: 1; min-width: 0; }
.row-title {
  font-size: 1rem;
  color: #fff;
  margin: 0;
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
}
.row-meta { font-size: 0.78rem; color: #8e8e93; margin: 2px 0 0; }
.row-chevron {
  color: #636366 !important;
  font-size: 1.2rem !important;
  transition: transform 0.2s ease;
  margin-left: 4px;
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

.belief-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
  border-top: 1px solid #2c2c2e;
  -webkit-tap-highlight-color: transparent;
  &:first-of-type { border-top: none; }
  &:active { opacity: 0.6; }
}
.belief-row-body { flex: 1; min-width: 0; }
/* Shows a recorded value — deliberately not interactive. */
.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 4px 0;
}
.slider-end-label {
  font-size: 0.72rem;
  color: #636366;
  flex-shrink: 0;
}
.readonly-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #3a3a3c;
  outline: none;
  opacity: 1;
  pointer-events: none;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4ade80;
  }
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: #4ade80;
  }
}
.status-pill {
  display: inline-block;
  margin-top: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  background: #2c2c2e;
  border-radius: 20px;
  padding: 1px 8px;
}
.belief-chevron {
  color: #636366 !important;
  font-size: 1.1rem !important;
  flex-shrink: 0;
  margin-left: 6px;
}
.mt-3 { margin-top: 12px !important; }
.mb-1 { margin-bottom: 4px !important; }

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
