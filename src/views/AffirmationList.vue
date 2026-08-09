<template>
  <div class="dark-page">
    <v-toolbar color="#000" dark flat app>
      <v-toolbar-title>Affirmationen</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$router.push('/settings')">
        <v-icon color="#4ade80">settings</v-icon>
      </v-btn>
    </v-toolbar>

    <v-content>
      <div class="intro-card">
        <span class="intro-icon">✨</span>
        <p class="intro-title">Zeit für Affirmationen</p>
        <p class="intro-text">Wiederholte positive Aussagen stärken neuronale Bahnen. Dein Gehirn kann sich durch bewusste Gedankenmuster neu vernetzen.</p>
      </div>

      <div class="segment-row">
        <button class="seg-tab" :class="{ active: tab === 'open' }" @click="tab = 'open'">Offen</button>
        <button class="seg-tab" :class="{ active: tab === 'dabei' }" @click="tab = 'dabei'">Dabei</button>
        <button class="seg-tab" :class="{ active: tab === 'verinnerlicht' }" @click="tab = 'verinnerlicht'">Verinnerlicht</button>
      </div>

      <div v-if="filteredAffirmations.length === 0" class="empty-state">
        <span class="empty-icon">✨</span>
        <p class="empty-title">Keine Einträge</p>
        <p class="empty-sub">
          <template v-if="tab === 'open'">Füge Affirmationen zu deinen Überzeugungen hinzu.</template>
          <template v-else-if="tab === 'dabei'">Noch keine Affirmationen als „Dabei“ markiert.</template>
          <template v-else>Noch keine Affirmationen als „Verinnerlicht“ markiert.</template>
        </p>
      </div>

      <div v-else class="reminder-list">
        <template v-for="(item, i) in filteredAffirmations">
          <div
            :key="item.text + '-row'"
            class="swipe-outer"
            :data-row-id="item.text"
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
            </div>
            <div class="swipe-left-panel">
              <button class="swipe-btn swipe-btn-delete" @click.stop="preDelete(item)">
                <v-icon small color="#fff">delete</v-icon>
                <span>Löschen</span>
              </button>
            </div>
            <div class="reminder-row" :style="rowSt(i, 195)" @click="deskClick(i)">
              <div class="reminder-row-body">
                <p class="reminder-text">{{ item.text }}</p>
                <!-- Every reading this sentence has collected: from wandeln
                     and from the experiments it was tested in. -->
                <template v-if="item.credibility !== null">
                  <p class="expand-label mt-2">Glaubwürdigkeit</p>
                  <div class="slider-row">
                    <span class="slider-end-label">0</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      :value="item.credibility"
                      class="readonly-slider"
                      disabled
                    />
                    <span class="slider-end-label">10</span>
                  </div>
                </template>
                <p class="reminder-meta">{{ amenLabel(item.text) }}</p>
              </div>
              <button class="amen-btn" @click.stop="primaryAction(item.text)">{{ primaryLabel(item.text) }}</button>
            </div>
          </div>
          <!-- Where the affirmation comes from — behind a tap, because the
               list is about the sentence, not about its origin. -->
          <div :key="item.text + '-expand'" v-if="openIndex === i" class="row-expand">
            <p class="expand-label">Überzeugungen</p>
            <div
              v-for="(s, j) in item.sources"
              :key="j"
              class="belief-row"
              @click="openBelief(s.beliefTime)"
            >
              <div class="belief-row-body">
                <p class="expand-text">{{ s.beliefText }}</p>
                <span
                  v-if="beliefOf(s.beliefTime)"
                  class="status-pill"
                  :style="{ color: beliefStatusColor(beliefOf(s.beliefTime)) }"
                >{{ beliefStatusLabel(beliefOf(s.beliefTime)) }}</span>
                <template v-if="beliefTruth(s.beliefTime) !== null">
                  <p class="expand-label mt-2">Glaubwürdigkeit</p>
                  <div class="slider-row">
                    <span class="slider-end-label">0</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      :value="beliefTruth(s.beliefTime)"
                      class="readonly-slider"
                      disabled
                    />
                    <span class="slider-end-label">10</span>
                  </div>
                </template>
                <!-- What this sentence is meant to bring about, and what it is
                     for. Per belief rather than pooled: a shared affirmation
                     carries different feelings and needs in each one. -->
                <template v-if="newFeelingsOf(s.beliefTime).length">
                  <p class="expand-label mt-2">Neue Gefühle</p>
                  <feeling-chips
                    :items="newFeelingsOf(s.beliefTime)"
                    type="feelings"
                    class="mb-1"
                  ></feeling-chips>
                </template>
                <template v-if="needsOf(s.beliefTime).length">
                  <p class="expand-label mt-2">Bedürfnisse</p>
                  <feeling-chips
                    :items="needsOf(s.beliefTime)"
                    type="needs"
                    class="mb-1"
                  ></feeling-chips>
                </template>
              </div>
              <v-icon small class="belief-chevron">chevron_right</v-icon>
            </div>
          </div>
          <div
            :key="item.text + '-sep'"
            class="ios-sep"
            v-if="i < filteredAffirmations.length - 1 && openIndex !== i"
          ></div>
        </template>
      </div>

      <v-dialog v-model="isDeleteDialogShowing" width="300">
        <v-card class="confirm-dialog">
          <v-card-title class="confirm-title">Affirmation löschen?</v-card-title>
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
      <v-btn flat color="primary" to="/affirmations">
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
import {
  AFF_STATUS_KEY,
  AFFIRMATION_STATUSES,
  loadAffStatusMap,
  affirmationStatus,
} from '@/utils/affirmationStatus';
import { affirmationCredibility, beliefCredibility } from '@/utils/credibility';
import { beliefStatusLabel, beliefStatusColor } from '@/utils/beliefStatus';
import { openQuery, requestedId, scrollRowIntoView } from '@/utils/reveal';
import FeelingChips from '@/components/FeelingChips.vue';

const AMEN_KEY = 'nvc.amen';

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
function loadAhoMap() {
  try { return JSON.parse(localStorage.getItem(AMEN_KEY)) || {}; } catch (e) { return {}; }
}

export default {
  name: 'affirmation-list',
  components: { FeelingChips },
  data() {
    return {
      tab: 'dabei',
      openIndex: null,
      itemToDelete: null,
      isDeleteDialogShowing: false,
      amenMap: loadAhoMap(),
      statusMap: loadAffStatusMap(),
      sw: { openIdx: null, openDir: null, touchIdx: null, startX: 0, startY: 0, dx: 0, isH: null, drag: false },
    };
  },
  watch: {
    tab() { this.sw.openIdx = null; this.sw.openDir = null; this.openIndex = null; },
    '$route.query.open': function() { this.revealRequested(); },
  },
  computed: {
    filteredAffirmations() {
      var sm = this.statusMap;
      return this.affirmations.filter(function(item) {
        var s = sm[item.text] || 'open';
        if (this.tab === 'open') return s === 'open';
        if (this.tab === 'dabei') return s === 'dabei';
        if (this.tab === 'verinnerlicht') return s === 'verinnerlicht';
        return true;
      }, this);
    },
    affirmations() {
      const map = {};
      const beliefs = this.$store.getters.beliefs;
      beliefs.forEach((belief) => {
        if (!belief.affirmations || !belief.affirmations.length) return;
        belief.affirmations.forEach((a) => {
          if (!a.text) return;
          if (!map[a.text]) map[a.text] = { text: a.text, beliefCount: 0, sources: [] };
          map[a.text].beliefCount += 1;
          map[a.text].sources.push({ beliefTime: belief.time, beliefText: belief.belief });
        });
      });
      return Object.values(map).map(item => Object.assign({}, item, {
        credibility: affirmationCredibility(beliefs, item.text),
      })).sort((a, b) => b.beliefCount - a.beliefCount);
    },
    currentEditAffirmation() {
      const key = this.editOriginalText;
      if (!key) return null;
      return this.affirmations.find(a => a.text === key) || null;
    },
    unlinkedBeliefsForEdit() {
      if (!this.currentEditAffirmation) return [];
      const linked = this.currentEditAffirmation.sources.map(s => s.beliefTime);
      return this.$store.getters.beliefs.filter(b => linked.indexOf(b.time) === -1);
    },
  },
  mounted() {
    this.revealRequested();
  },
  methods: {
    // Affirmations are keyed by their own text, so that is what the link
    // carries and what the tab has to be found from.
    revealRequested() {
      const text = requestedId(this.$route);
      if (!text) return;
      if (!this.affirmations.some(a => a.text === text)) return;
      this.tab = affirmationStatus(text, this.statusMap);
      this.$nextTick(() => {
        const i = this.filteredAffirmations.findIndex(a => a.text === text);
        if (i === -1) return;
        this.openIndex = i;
        this.$nextTick(() => scrollRowIntoView(this.$el, text));
      });
    },
    beliefOf(time) {
      return this.$store.getters.beliefs.find(b => b.time === time) || null;
    },
    // The belief's own standing, the same number its row shows in the belief
    // list — an affirmation records no separate reading of it.
    beliefTruth(time) {
      return beliefCredibility(this.$store.getters.patterns, this.beliefOf(time));
    },
    // From the wandeln step: how the new perspective felt.
    newFeelingsOf(time) {
      const r = (this.beliefOf(time) || {}).reflection || {};
      return Array.isArray(r.withoutBeliefFeelings) ? r.withoutBeliefFeelings : [];
    },
    needsOf(time) {
      const list = (this.beliefOf(time) || {}).needs;
      return Array.isArray(list) ? list : [];
    },
    beliefStatusLabel(belief) { return beliefStatusLabel(belief); },
    beliefStatusColor(belief) { return beliefStatusColor(belief); },
    openBelief(time) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.$router.push({ path: '/beliefs', query: openQuery(time) });
    },
    toggle(i) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.openIndex = this.openIndex === i ? null : i;
    },
    // Saying it out loud is worth marking, not worth scoring — the only value
    // this sentence carries is the credibility it was actually rated with.
    sayAho(text) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.amenMap = Object.assign({}, this.amenMap, { [text]: Date.now() });
      localStorage.setItem(AMEN_KEY, JSON.stringify(this.amenMap));
      triggerConfetti();
    },
    amenLabel(text) {
      const ts = this.amenMap[text];
      if (!ts) return 'Noch nicht gesagt';
      moment.locale('de');
      return moment(ts).fromNow();
    },
    addBeliefToAffirmation(text, belief) {
      // One affirmation per belief — linking replaces whatever was there.
      this.$store.dispatch('updateBelief', Object.assign({}, belief, { affirmations: [{ text }] }));
    },
    removeBeliefFromAffirmation(text, beliefTime) {
      const belief = this.$store.getters.beliefs.find(b => b.time === beliefTime);
      if (!belief) return;
      const updated = (belief.affirmations || []).filter(a => a.text !== text);
      this.$store.dispatch('updateBelief', Object.assign({}, belief, { affirmations: updated }));
    },
    preDelete(item) { this.sw.openIdx = null; this.sw.openDir = null; this.itemToDelete = item; this.isDeleteDialogShowing = true; },
    cancelDelete() { this.isDeleteDialogShowing = false; this.itemToDelete = null; },
    confirmDelete() {
      this.isDeleteDialogShowing = false;
      const text = this.itemToDelete ? this.itemToDelete.text : null;
      this.itemToDelete = null;
      if (!text) return;
      this.$store.getters.beliefs.forEach((belief) => {
        if (!belief.affirmations || !belief.affirmations.length) return;
        if (belief.affirmations.some(a => a.text === text)) {
          const updated = belief.affirmations.filter(a => a.text !== text);
          this.$store.dispatch('updateBelief', Object.assign({}, belief, { affirmations: updated }));
        }
      });
      this.openIndex = null;
    },
    tsStart(e, i) {
      if (e.target && e.target.closest && (e.target.closest('.amen-btn') || e.target.closest('.swipe-btn'))) return;
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
    rowSt(i, rw) {
      const s = this.sw;
      const live = s.touchIdx === i && s.drag && s.isH;
      let x = 0;
      if (live) x = s.dx;
      else if (s.openIdx === i) x = s.openDir === 'left' ? -80 : rw;
      return { transform: `translateX(${x}px)`, transition: live ? 'none' : 'transform 0.2s ease' };
    },
    deskClick(i) {
      if (this.sw.openIdx !== null) { this.sw.openIdx = null; this.sw.openDir = null; return; }
      this.toggle(i);
    },
    otherStatuses(text) {
      var current = affirmationStatus(text, this.statusMap);
      return AFFIRMATION_STATUSES.filter(function(s) { return s.key !== current; });
    },
    // An affirmation still on "Offen" has not been taken up yet, so its button
    // starts the practice instead of counting one.
    primaryLabel(text) {
      return affirmationStatus(text, this.statusMap) === 'open' ? 'Üben' : 'Aho';
    },
    primaryAction(text) {
      if (affirmationStatus(text, this.statusMap) === 'open') {
        this.setStatus(text, 'dabei');
        return;
      }
      this.sayAho(text);
    },
    setStatus(text, status) {
      this.statusMap = Object.assign({}, this.statusMap, { [text]: status });
      localStorage.setItem(AFF_STATUS_KEY, JSON.stringify(this.statusMap));
      this.sw.openIdx = null;
      this.sw.openDir = null;
      // The row leaves this tab, so the index it was open at means nothing now.
      this.openIndex = null;
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

.reminder-list {
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

.reminder-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 14px 16px 14px 20px;
  background: #1c1c1e;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
  &:active { background: #2c2c2e; }
}
.reminder-row-body {
  flex: 1;
  min-width: 0;
  margin-right: 12px;
}
.reminder-text {
  font-size: 0.95rem;
  color: #fff;
  margin: 0 0 4px;
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
}
.reminder-meta {
  font-size: 0.75rem;
  color: #8e8e93;
  margin: 4px 0 0;
}
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

.amen-btn {
  background: #4ade80;
  color: #000;
  border: none;
  border-radius: 20px;
  padding: 7px 18px;
  font-size: 0.875rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  &:active { background: #3dcc70; transform: scale(0.97); }
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
  margin: 0 0 6px;
  font-weight: 600;
}
/* A belief inside the expand, shown the way the Situationen list shows one. */
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
.belief-chevron {
  color: #636366 !important;
  font-size: 1.1rem !important;
  flex-shrink: 0;
  margin-left: 6px;
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
.expand-text {
  font-size: 0.93rem;
  color: #ebebf5;
  margin: 0 0 4px;
  line-height: 1.5;
  font-style: italic;
}

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
