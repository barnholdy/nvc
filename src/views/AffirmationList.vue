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
          <template v-else-if="tab === 'dabei'">Noch keine Affirmationen als „Dabei" markiert.</template>
          <template v-else>Noch keine Affirmationen als „Verinnerlicht" markiert.</template>
        </p>
      </div>

      <div v-else class="reminder-list">
        <template v-for="(item, i) in filteredAffirmations">
          <div
            :key="item.text + '-row'"
            class="swipe-outer"
            @touchstart="tsStart($event, i)"
            @touchmove="tsMove($event, i)"
            @touchend="tsEnd($event, i)"
          >
            <div class="swipe-right-panel">
              <button class="swipe-btn swipe-btn-edit" @click.stop="startEdit(item)">
                <v-icon small color="#fff">edit</v-icon>
                <span>Bearb.</span>
              </button>
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
                <div class="row-badges">
                  <span class="badge-pill">{{ item.beliefCount }} {{ item.beliefCount === 1 ? 'Überzeugung' : 'Überzeugungen' }}</span>
                  <span v-if="item.resonance != null" class="resonance-pill">
                    <span class="resonance-fill" :style="{ width: item.resonance + '%', background: resonanceColor(item.resonance) }"></span>
                    <span class="resonance-label">{{ item.resonance }} %</span>
                  </span>
                  <span class="reminder-meta">{{ amenLabel(item.text) }}</span>
                </div>
              </div>
              <button class="amen-btn" @click.stop="sayAho(item.text)">Aho</button>
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
          <div :key="item.text + '-sep'" class="ios-sep" v-if="i < filteredAffirmations.length - 1 && openIndex !== i"></div>
        </template>
      </div>

      <!-- Edit dialog -->
      <v-dialog v-model="isEditDialogShowing" fullscreen>
        <div v-if="isEditDialogShowing" class="wizard-page">
          <div class="wizard-toolbar">
            <v-btn icon @click="editStep === 1 ? cancelEdit() : prevEditStep()">
              <v-icon>{{ editStep === 1 ? 'close' : 'chevron_left' }}</v-icon>
            </v-btn>
            <span class="wizard-title">Affirmation bearbeiten</span>
            <v-spacer></v-spacer>
            <span class="grey--text body-1">{{ editStep }} / 3</span>
          </div>
          <div class="wizard-scroll">
            <v-container class="mb-5">
              <v-layout v-show="editStep === 1" column>
                <v-flex class="mt-2 mb-3">
                  <h1 class="headline font-weight-regular">Affirmation</h1>
                  <p class="body-1 grey--text mt-2">Formuliere eine positive, kraftvolle Aussage im Präsens.</p>
                </v-flex>
                <v-flex>
                  <v-textarea v-model="editText" placeholder="..." auto-grow rows="4" hide-details></v-textarea>
                </v-flex>
              </v-layout>

              <v-layout v-show="editStep === 2" column>
                <v-flex class="mt-2 mb-3">
                  <h1 class="headline font-weight-regular">Wie fühlt sich das an?</h1>
                  <p class="subheading grey--text belief-quote mt-1">„{{ editText }}"</p>
                  <p class="body-1 grey--text mt-2">Wie wahr fühlt sich diese Affirmation gerade an?</p>
                </v-flex>
                <v-flex class="mt-1">
                  <div class="slider-row">
                    <span class="slider-end-label">0 %</span>
                    <input type="range" min="0" max="100" v-model.number="editSlider" class="resonance-slider" />
                    <span class="slider-end-label">100 %</span>
                  </div>
                  <p class="slider-value-label">{{ editSlider }} %</p>
                </v-flex>
                <v-flex v-if="editSlider < 50" class="mt-4">
                  <p class="body-1 grey--text">Klingt das noch weit weg? Probiere eine Brücken-Version.</p>
                  <v-btn small flat color="primary" :loading="isBridgeLoading" @click="generateBridgeVersions">
                    <v-icon small left>auto_awesome</v-icon>
                    Brücken-Version generieren
                  </v-btn>
                  <p v-if="bridgeError" class="caption red--text mt-1">{{ bridgeError }}</p>
                  <div v-if="bridgeVersions.length" class="mt-3">
                    <p class="caption grey--text mb-1">Wähle eine Version, um sie zu übernehmen:</p>
                    <div class="chip-list">
                      <v-chip
                        v-for="(b, i) in bridgeVersions"
                        :key="i"
                        class="available-chip bridge-chip"
                        @click="selectBridge(b)"
                      >{{ b }}</v-chip>
                    </div>
                  </div>
                </v-flex>
              </v-layout>

              <v-layout v-show="editStep === 3" column>
                <v-flex class="mt-2 mb-3">
                  <h1 class="headline font-weight-regular">Überzeugungen</h1>
                  <p class="subheading grey--text belief-quote mt-1">„{{ editText }}"</p>
                  <p class="body-1 grey--text mt-2">Verknüpfe diese Affirmation mit deinen Überzeugungen.</p>
                </v-flex>
                <v-flex v-if="currentEditAffirmation">
                  <div class="belief-chips mb-2">
                    <v-chip
                      v-for="(s, j) in currentEditAffirmation.sources"
                      :key="j"
                      close
                      class="mb-1 mr-1"
                      @input="removeBeliefFromAffirmation(editOriginalText, s.beliefTime)"
                    >{{ s.beliefText }}</v-chip>
                  </div>
                  <div v-if="unlinkedBeliefsForEdit.length" class="available-chips mt-2">
                    <p class="caption grey--text mb-1">Hinzufügen:</p>
                    <div class="chip-list">
                      <v-chip
                        v-for="b in unlinkedBeliefsForEdit"
                        :key="b.time"
                        class="available-chip"
                        @click="addBeliefToAffirmation(editOriginalText, b)"
                      >{{ b.belief }}</v-chip>
                    </div>
                  </div>
                </v-flex>
              </v-layout>
            </v-container>
          </div>
          <div class="wizard-footer-bar">
            <v-btn v-if="editStep < 3" :disabled="editStep === 1 && !editText.trim()" @click="nextEditStep" block large color="primary">weiter</v-btn>
            <v-btn v-else @click="saveEdit" block large color="primary">speichern</v-btn>
          </div>
        </div>
      </v-dialog>

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

const AMEN_KEY = 'nvc.amen';
const AFF_STATUS_KEY = 'nvc.affirmationStatus';
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
function loadAhoMap() {
  try { return JSON.parse(localStorage.getItem(AMEN_KEY)) || {}; } catch (e) { return {}; }
}
function loadAffStatusMap() {
  try { return JSON.parse(localStorage.getItem(AFF_STATUS_KEY)) || {}; } catch (e) { return {}; }
}

export default {
  name: 'affirmation-list',
  data() {
    return {
      tab: 'open',
      openIndex: null,
      isEditDialogShowing: false,
      editStep: 1,
      editOriginalText: '',
      editText: '',
      editSlider: 70,
      bridgeVersions: [],
      isBridgeLoading: false,
      bridgeError: '',
      itemToDelete: null,
      isDeleteDialogShowing: false,
      amenMap: loadAhoMap(),
      statusMap: loadAffStatusMap(),
      sw: { openIdx: null, openDir: null, touchIdx: null, startX: 0, startY: 0, dx: 0, isH: null, drag: false },
    };
  },
  watch: {
    tab() { this.sw.openIdx = null; this.sw.openDir = null; this.openIndex = null; },
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
      this.$store.getters.beliefs.forEach((belief) => {
        if (!belief.affirmations || !belief.affirmations.length) return;
        belief.affirmations.forEach((a) => {
          if (!a.text) return;
          if (!map[a.text]) map[a.text] = { text: a.text, beliefCount: 0, sources: [], resonance: null };
          map[a.text].beliefCount += 1;
          map[a.text].sources.push({ beliefTime: belief.time, beliefText: belief.belief });
          if (map[a.text].resonance === null && a.resonance != null) map[a.text].resonance = a.resonance;
        });
      });
      return Object.values(map).sort((a, b) => b.beliefCount - a.beliefCount);
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
  methods: {
    toggle(i) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.openIndex = this.openIndex === i ? null : i;
    },
    sayAho(text) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.amenMap = Object.assign({}, this.amenMap, { [text]: Date.now() });
      localStorage.setItem(AMEN_KEY, JSON.stringify(this.amenMap));
      this.$store.getters.beliefs.forEach((belief) => {
        if (!belief.affirmations || !belief.affirmations.length) return;
        if (belief.affirmations.some(function(a) { return a.text === text; })) {
          var updated = belief.affirmations.map(function(a) {
            if (a.text !== text) return a;
            var current = a.resonance != null ? a.resonance : 0;
            return Object.assign({}, a, { resonance: Math.min(100, current + 1) });
          });
          this.$store.dispatch('updateBelief', Object.assign({}, belief, { affirmations: updated }));
        }
      });
      triggerConfetti();
    },
    resonanceColor(v) {
      if (v >= 75) return '#4ade80';
      if (v >= 50) return '#fbbf24';
      return '#f87171';
    },
    amenLabel(text) {
      const ts = this.amenMap[text];
      if (!ts) return 'Noch nicht gesagt';
      moment.locale('de');
      return moment(ts).fromNow();
    },
    startEdit(item) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.editOriginalText = item.text;
      this.editText = item.text;
      this.editStep = 1;
      var savedResonance = null;
      this.$store.getters.beliefs.forEach(function(belief) {
        if (savedResonance !== null) return;
        var aff = (belief.affirmations || []).find(function(a) { return a.text === item.text && a.resonance != null; });
        if (aff) savedResonance = aff.resonance;
      });
      this.editSlider = savedResonance !== null ? savedResonance : 70;
      this.bridgeVersions = [];
      this.bridgeError = '';
      this.isEditDialogShowing = true;
    },
    nextEditStep() { this.editStep = Math.min(this.editStep + 1, 3); },
    prevEditStep() { this.editStep = Math.max(this.editStep - 1, 1); },
    cancelEdit() {
      this.isEditDialogShowing = false;
      this.editOriginalText = ''; this.editText = ''; this.editStep = 1;
      this.editSlider = 70; this.bridgeVersions = []; this.bridgeError = '';
    },
    generateBridgeVersions() {
      var apiKey = localStorage.getItem('nvc.apiKey') || '';
      if (!apiKey) {
        this.bridgeError = 'Kein API Key gefunden. Bitte in den Einstellungen hinterlegen.';
        return;
      }
      this.isBridgeLoading = true;
      this.bridgeError = '';
      this.bridgeVersions = [];
      var self = this;
      var prompt = 'Du hilfst dabei, Affirmationen in glaubwürdigere "Brücken-Versionen" umzuformulieren.\n\nEine Brücken-Version vermeidet den behauptenden Endzustand („Ich bin…", „Ich werde…") und beschreibt stattdessen den Weg dorthin – sie klingt dadurch schon jetzt wahr.\n\nBeispiele:\n„Ich bin sicher und geborgen." → „Ich übe, mich sicherer zu fühlen."\n„Ich werde geliebt, auch wenn ich nichts leiste." → „Ich bin offen für die Möglichkeit, auch ohne Leistung zu genügen."\n„Ich stehe selbstsicher zu mir." → „Ich lerne, für mich einzustehen."\n\nAffirmation: „' + this.editText.trim() + '"\n\nGeneriere genau 3 Brücken-Versionen. Nur die 3 Sätze, einer pro Zeile, ohne Nummerierung.';
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }],
        }),
      }).then(function(res) {
        if (!res.ok) return res.json().catch(function() { return {}; }).then(function(err) { throw new Error((err.error && err.error.message) || 'Fehler ' + res.status); });
        return res.json();
      }).then(function(data) {
        self.bridgeVersions = data.content[0].text.split('\n').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; }).slice(0, 3);
      }).catch(function(e) {
        self.bridgeError = e.message || 'Brücken-Versionen konnten nicht geladen werden.';
      }).then(function() {
        self.isBridgeLoading = false;
      });
    },
    selectBridge(text) {
      this.editText = text;
      this.bridgeVersions = [];
      this.editSlider = 70;
    },
    saveEdit() {
      const oldText = this.editOriginalText;
      const newText = this.editText.trim();
      const resonance = this.editSlider;
      this.isEditDialogShowing = false;
      this.editOriginalText = ''; this.editText = ''; this.editStep = 1;
      this.editSlider = 70; this.bridgeVersions = []; this.bridgeError = '';
      if (!newText) return;
      this.$store.getters.beliefs.forEach((belief) => {
        if (!belief.affirmations || !belief.affirmations.length) return;
        if (belief.affirmations.some(a => a.text === oldText)) {
          const updated = belief.affirmations.map(a => (a.text === oldText ? Object.assign({}, a, { text: newText, resonance }) : a));
          this.$store.dispatch('updateBelief', Object.assign({}, belief, { affirmations: updated }));
        }
      });
    },
    addBeliefToAffirmation(text, belief) {
      const updated = (belief.affirmations || []).concat([{ text }]);
      this.$store.dispatch('updateBelief', Object.assign({}, belief, { affirmations: updated }));
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
      var current = this.statusMap[text] || 'open';
      return ALL_STATUSES.filter(function(s) { return s.key !== current; });
    },
    setStatus(text, status) {
      this.statusMap = Object.assign({}, this.statusMap, { [text]: status });
      localStorage.setItem(AFF_STATUS_KEY, JSON.stringify(this.statusMap));
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
.row-badges { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.badge-pill {
  font-size: 0.7rem;
  color: #8e8e93;
  background: #2c2c2e;
  border-radius: 20px;
  padding: 1px 6px;
}
.reminder-meta { font-size: 0.75rem; color: #8e8e93; }
.resonance-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 18px;
  border-radius: 20px;
  overflow: hidden;
  background: #2c2c2e;
  min-width: 48px;
}
.resonance-fill {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  border-radius: 20px;
  opacity: 0.35;
}
.resonance-label {
  position: relative;
  font-size: 0.68rem;
  font-weight: 600;
  color: #fff;
  padding: 0 7px;
  z-index: 1;
  white-space: nowrap;
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
.belief-chips { display: flex; flex-wrap: wrap; }

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 5rem 2rem; text-align: center;
}
.empty-icon { font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 16px; }
.empty-title { font-size: 1.1rem; color: #fff; font-weight: 600; margin: 0 0 6px; }
.empty-sub { font-size: 0.875rem; color: #8e8e93; margin: 0; }

.wizard-page {
  background: #000;
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
}
.wizard-toolbar {
  display: flex;
  align-items: center;
  padding: 0 8px;
  height: 56px;
  flex-shrink: 0;
  background: #000;
}
.wizard-title {
  font-size: 1.45rem;
  font-weight: 700;
  color: #fff;
  margin-left: 4px;
}
.wizard-scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.wizard-footer-bar {
  padding: 12px 16px;
  background: #000;
  flex-shrink: 0;
}
.available-chips { margin-top: 8px; }
.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.available-chip {
  white-space: normal;
  height: auto !important;
  padding: 4px 10px !important;
  cursor: pointer;
}
.bridge-chip { white-space: normal; height: auto !important; padding: 6px 12px !important; line-height: 1.5; }
.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px;
}
.slider-end-label {
  font-size: 0.78rem;
  color: #8e8e93;
  flex-shrink: 0;
}
.resonance-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #3a3a3c;
  outline: none;
  cursor: pointer;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #4ade80;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  }
  &::-moz-range-thumb {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #4ade80;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  }
}
.slider-value-label {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin: 12px 0 0;
}
.belief-quote { font-style: italic; }

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
