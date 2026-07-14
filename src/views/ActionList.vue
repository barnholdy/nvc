<template>
  <div class="dark-page">
    <v-toolbar color="#000" dark flat app>
      <v-toolbar-title>Handlungen</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$router.push('/settings')">
        <v-icon color="#4ade80">settings</v-icon>
      </v-btn>
    </v-toolbar>

    <v-content>
      <div class="intro-card">
        <span class="intro-icon">🎯</span>
        <p class="intro-title">Vom Denken zum Handeln</p>
        <p class="intro-text">Wenn du nicht änderst, ändert sich nichts. Handeln überbrückt die Lücke zwischen Absicht und Wirklichkeit. Es erzeugt echtes Feedback und stärkt das Vertrauen in dich selbst.</p>
      </div>

      <div class="segment-row">
        <button class="seg-tab" :class="{ active: tab === 'dabei' }" @click="tab = 'dabei'">Dabei</button>
        <button class="seg-tab" :class="{ active: tab === 'open' }" @click="tab = 'open'">Offen</button>
        <button class="seg-tab" :class="{ active: tab === 'verinnerlicht' }" @click="tab = 'verinnerlicht'">Verinnerlicht</button>
      </div>

      <div v-if="filteredActions.length === 0" class="empty-state">
        <span class="empty-icon">🏃</span>
        <p class="empty-title">Keine Einträge</p>
        <p class="empty-sub">
          <template v-if="tab === 'open'">Füge Handlungen im Änderungsprozess einer Überzeugung hinzu.</template>
          <template v-else-if="tab === 'dabei'">Noch keine Handlungen als „Dabei" markiert.</template>
          <template v-else>Noch keine Handlungen als „Verinnerlicht" markiert.</template>
        </p>
      </div>

      <div v-else class="ios-list">
        <template v-for="(item, i) in filteredActions">
          <div
            :key="item.text + '-row'"
            class="swipe-outer"
            @touchstart="tsStart($event, i)"
            @touchmove="tsMove($event, i)"
            @touchend="tsEnd($event, i)"
          >
            <div class="swipe-right-panel">
              <button
                v-for="s in otherStatuses(item.text)"
                :key="s.key"
                class="swipe-btn status-btn"
                :style="{ background: s.color }"
                @click.stop="setStatus(item.text, s.key)"
              ><span>{{ s.label }}</span></button>
              <button class="swipe-btn swipe-btn-edit" @click.stop="startEdit(item)">
                <v-icon small color="#fff">edit</v-icon>
              </button>
            </div>
            <div class="swipe-left-panel">
              <button class="swipe-btn swipe-btn-delete" @click.stop="preDelete(item)">
                <v-icon small color="#fff">delete</v-icon>
                <span>Löschen</span>
              </button>
            </div>
            <div class="ios-row" :style="rowSt(i)" @click="deskClick(i)">
              <div class="row-body">
                <p class="row-title">{{ item.text }}</p>
                <div class="row-badges">
                  <span class="badge-pill">{{ item.beliefCount }} {{ item.beliefCount === 1 ? 'Überzeugung' : 'Überzeugungen' }}</span>
                  <span v-if="item.progress != null" class="progress-pill">
                    <span class="progress-fill" :style="{ width: item.progress + '%', background: progressColor(item.progress) }"></span>
                    <span class="progress-label">{{ item.progress }} %</span>
                  </span>
                  <span class="check-meta">{{ checkLabel(item.text) }}</span>
                </div>
              </div>
              <button class="check-btn" @click.stop="doCheck(item.text)">Check</button>
            </div>
          </div>
          <div :key="item.text + '-expand'" v-if="openIndex === i" class="row-expand">
            <div class="expand-header">
              <p class="expand-label">Überzeugungen</p>
              <button class="expand-edit-btn" @click.stop="startEdit(item)">
                <v-icon small color="#8e8e93">edit</v-icon>
              </button>
            </div>
            <p v-for="(s, j) in item.sources" :key="j" class="expand-text mb-1">„{{ s.beliefText }}"</p>
          </div>
          <div :key="item.text + '-sep'" class="ios-sep" v-if="i < filteredActions.length - 1"></div>
        </template>
      </div>

      <!-- Edit wizard -->
      <v-dialog v-model="isEditDialogShowing" fullscreen>
        <div class="wizard-page">
          <v-toolbar color="#000" dark flat app>
            <v-btn icon @click="cancelEdit">
              <v-icon>close</v-icon>
            </v-btn>
            <v-toolbar-title>Handlung bearbeiten</v-toolbar-title>
          </v-toolbar>
          <v-content>
            <v-container class="mb-5">
              <v-layout column>
                <v-flex class="mt-2 mb-3">
                  <h1 class="headline font-weight-regular">Handlung</h1>
                  <p class="body-1 grey--text mt-2">Beschreibe die konkrete Handlung, die du umsetzen möchtest.</p>
                </v-flex>
                <v-flex>
                  <v-textarea v-model="editText" placeholder="..." auto-grow rows="4" hide-details></v-textarea>
                </v-flex>
              </v-layout>
            </v-container>
            <v-footer :fixed="true" color="white elevation-3" height="44">
              <v-btn :disabled="!editText.trim()" @click="saveEdit" block large color="primary">speichern</v-btn>
            </v-footer>
          </v-content>
        </div>
      </v-dialog>

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
        <v-icon>flare</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/actions">
        <v-icon>gps_fixed</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import moment from 'moment';

const CHECK_KEY = 'nvc.check';
const PROGRESS_KEY = 'nvc.progress';
const ACTION_STATUS_KEY = 'nvc.actionStatus';
const ALL_STATUSES = [
  { key: 'open', label: 'Offen', color: '#636366' },
  { key: 'dabei', label: 'Dabei', color: '#fd9927' },
  { key: 'verinnerlicht', label: 'Verinn.', color: '#4ade80' },
];

function triggerConfetti() {
  var canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  if (!ctx) { document.body.removeChild(canvas); return; }
  var COLORS = ['#4ade80', '#f9e02e', '#ff6b6b', '#60c5f9', '#c084fc', '#fb923c'];
  var cx = canvas.width / 2, cy = canvas.height * 0.55;
  var particles = [];
  for (var i = 0; i < 72; i++) {
    var angle = Math.PI * 2 * i / 72 + (Math.random() - 0.5) * 0.4;
    var speed = 4 + Math.random() * 8;
    particles.push({ x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 3,
      w: 4 + Math.random() * 7, h: 2 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.3 });
  }
  var start = null, dur = 1500;
  function frame(ts) {
    if (!start) start = ts;
    var t = ts - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(function(p) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.vx *= 0.99; p.rot += p.vr;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t / dur);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    });
    if (t < dur) { requestAnimationFrame(frame); }
    else { if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  }
  requestAnimationFrame(frame);
}
function loadCheckMap() {
  try { return JSON.parse(localStorage.getItem(CHECK_KEY)) || {}; } catch (e) { return {}; }
}
function loadProgressMap() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; } catch (e) { return {}; }
}
function loadActionStatusMap() {
  try { return JSON.parse(localStorage.getItem(ACTION_STATUS_KEY)) || {}; } catch (e) { return {}; }
}

export default {
  name: 'action-list',
  data() {
    return {
      tab: 'dabei',
      openIndex: null,
      itemToDelete: null,
      isDeleteDialogShowing: false,
      isEditDialogShowing: false,
      editOriginalText: '',
      editText: '',
      checkMap: loadCheckMap(),
      progressMap: loadProgressMap(),
      statusMap: loadActionStatusMap(),
      sw: { openIdx: null, openDir: null, touchIdx: null, startX: 0, startY: 0, dx: 0, isH: null, drag: false },
    };
  },
  watch: {
    tab() { this.sw.openIdx = null; this.sw.openDir = null; this.openIndex = null; },
  },
  computed: {
    filteredActions() {
      var sm = this.statusMap;
      return this.actions.filter(function(item) {
        var s = sm[item.text] || 'open';
        if (this.tab === 'open') return s === 'open';
        if (this.tab === 'dabei') return s === 'dabei';
        if (this.tab === 'verinnerlicht') return s === 'verinnerlicht';
        return true;
      }, this);
    },
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
      const pm = this.progressMap;
      return Object.values(map).map(item => Object.assign({}, item, {
        progress: pm[item.text] != null ? pm[item.text] : null,
      })).sort((a, b) => b.beliefCount - a.beliefCount);
    },
  },
  methods: {
    toggle(i) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.openIndex = this.openIndex === i ? null : i;
    },
    doCheck(text) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.checkMap = Object.assign({}, this.checkMap, { [text]: Date.now() });
      localStorage.setItem(CHECK_KEY, JSON.stringify(this.checkMap));
      var current = this.progressMap[text] != null ? this.progressMap[text] : 0;
      this.progressMap = Object.assign({}, this.progressMap, { [text]: Math.min(100, current + 1) });
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(this.progressMap));
      triggerConfetti();
    },
    progressColor(v) {
      if (v >= 75) return '#4ade80';
      if (v >= 50) return '#fbbf24';
      return '#f87171';
    },
    checkLabel(text) {
      const ts = this.checkMap[text];
      if (!ts) return 'Noch nicht ausgeführt';
      moment.locale('de');
      return moment(ts).fromNow();
    },
    startEdit(item) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.editOriginalText = item.text;
      this.editText = item.text;
      this.isEditDialogShowing = true;
    },
    cancelEdit() {
      this.isEditDialogShowing = false;
      this.editOriginalText = '';
      this.editText = '';
    },
    saveEdit() {
      const oldText = this.editOriginalText;
      const newText = this.editText.trim();
      this.isEditDialogShowing = false;
      this.editOriginalText = '';
      this.editText = '';
      if (!newText || newText === oldText) return;
      this.$store.getters.beliefs.forEach((belief) => {
        const acts = belief.reflection && belief.reflection.changeActs ? belief.reflection.changeActs : [];
        if (acts.indexOf(oldText) !== -1) {
          const updated = Object.assign({}, belief, {
            reflection: Object.assign({}, belief.reflection, {
              changeActs: acts.map(a => (a === oldText ? newText : a)),
            }),
          });
          this.$store.dispatch('updateBelief', updated);
        }
      });
    },
    preDelete(item) { this.sw.openIdx = null; this.sw.openDir = null; this.itemToDelete = item; this.isDeleteDialogShowing = true; },
    cancelDelete() { this.isDeleteDialogShowing = false; this.itemToDelete = null; },
    confirmDelete() {
      this.isDeleteDialogShowing = false;
      const text = this.itemToDelete ? this.itemToDelete.text : null;
      this.itemToDelete = null;
      if (!text) return;
      this.$store.getters.beliefs.forEach((belief) => {
        const acts = belief.reflection && belief.reflection.changeActs ? belief.reflection.changeActs : [];
        if (acts.indexOf(text) !== -1) {
          const updated = Object.assign({}, belief, {
            reflection: Object.assign({}, belief.reflection, { changeActs: acts.filter(a => a !== text) }),
          });
          this.$store.dispatch('updateBelief', updated);
        }
      });
      this.openIndex = null;
    },
    tsStart(e, i) {
      if (e.target && e.target.closest && (e.target.closest('.swipe-btn') || e.target.closest('.check-btn'))) return;
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
        else { this.toggle(i); }
      } else if (this.sw.drag) {
        if (this.sw.dx < -40) { this.sw.openIdx = i; this.sw.openDir = 'left'; }
        else if (this.sw.dx > 40) { this.sw.openIdx = i; this.sw.openDir = 'right'; }
        else { this.sw.openIdx = null; this.sw.openDir = null; }
        this.openIndex = null;
      }
      this.sw.touchIdx = null; this.sw.dx = 0; this.sw.drag = false; this.sw.isH = null;
    },
    rowSt(i) {
      const s = this.sw;
      const live = s.touchIdx === i && s.drag && s.isH;
      let x = 0;
      if (live) x = s.dx;
      else if (s.openIdx === i) x = s.openDir === 'left' ? -80 : 195;
      return { transform: `translateX(${x}px)`, transition: live ? 'none' : 'transform 0.2s ease' };
    },
    deskClick(i) {
      if (this.sw.openIdx !== null) { this.sw.openIdx = null; this.sw.openDir = null; return; }
      this.toggle(i);
    },
    otherStatuses(text) {
      var current = this.statusMap[text] || 'open';
      return ALL_STATUSES.filter(function(s) { return s.key !== current; });
    },
    setStatus(text, status) {
      this.statusMap = Object.assign({}, this.statusMap, { [text]: status });
      localStorage.setItem(ACTION_STATUS_KEY, JSON.stringify(this.statusMap));
      this.sw.openIdx = null;
      this.sw.openDir = null;
    },
  },
};
</script>

<style scoped lang="scss">
.dark-page { background: #000; min-height: 100vh; }

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
.status-btn { color: #000; font-size: 0.72rem; }

.ios-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 13px 12px 13px 20px;
  background: #1c1c1e;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
  &:active { background: #2c2c2e; }
}
.row-body { flex: 1; min-width: 0; margin-right: 12px; }
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
.check-meta { font-size: 0.75rem; color: #8e8e93; }
.progress-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 18px;
  border-radius: 20px;
  overflow: hidden;
  background: #2c2c2e;
  min-width: 48px;
}
.progress-fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  border-radius: 20px;
  opacity: 0.35;
}
.progress-label {
  position: relative;
  font-size: 0.68rem;
  font-weight: 600;
  color: #fff;
  padding: 0 7px;
  z-index: 1;
  white-space: nowrap;
}

.check-btn {
  background: #4ade80;
  color: #000;
  border: none;
  border-radius: 20px;
  padding: 7px 16px;
  font-size: 0.875rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  &:active { background: #3dcc70; transform: scale(0.97); }
}

.row-chevron {
  color: #636366 !important;
  font-size: 1.2rem !important;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  &.rotated { transform: rotate(90deg); }
}
.ios-sep { height: 1px; background: #2c2c2e; margin-left: 20px; }
.row-expand {
  background: #141416;
  padding: 14px 20px 16px;
  border-top: 1px solid #2c2c2e;
}
.expand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 6px;
  .expand-label { margin: 0; }
}
.expand-edit-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.expand-label {
  font-size: 0.68rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 6px;
  font-weight: 600;
}
.expand-text { font-size: 0.93rem; color: #ebebf5; margin: 0; line-height: 1.5; font-style: italic; }
.mb-1 { margin-bottom: 4px !important; }

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 5rem 2rem; text-align: center;
}
.empty-icon { font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 16px; }
.empty-title { font-size: 1.1rem; color: #fff; font-weight: 600; margin: 0 0 6px; }
.empty-sub { font-size: 0.875rem; color: #8e8e93; margin: 0; }

.wizard-page {
  background: #000;
  min-height: 100vh;
  position: fixed;
  inset: 0;
  z-index: 200;
}

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
