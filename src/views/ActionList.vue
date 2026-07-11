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
        <p class="intro-text">Handeln überbrückt die Lücke zwischen Absicht und Wirklichkeit. Es erzeugt echtes Feedback und stärkt das Vertrauen in dich selbst.</p>
      </div>

      <div v-if="actions.length === 0" class="empty-state">
        <span class="empty-icon">🏃</span>
        <p class="empty-title">Noch keine Handlungen</p>
        <p class="empty-sub">Füge Handlungen im Änderungsprozess einer Überzeugung hinzu.</p>
      </div>

      <div v-else class="ios-list">
        <template v-for="(item, i) in actions">
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
                  <span class="check-meta">{{ checkLabel(item.text) }}</span>
                </div>
              </div>
              <button class="check-btn" @click.stop="doCheck(item.text)">Check</button>
            </div>
          </div>
          <div :key="item.text + '-expand'" v-if="openIndex === i" class="row-expand">
            <p class="expand-label">Überzeugungen</p>
            <p v-for="(s, j) in item.sources" :key="j" class="expand-text mb-1">„{{ s.beliefText }}"</p>
          </div>
          <div :key="item.text + '-sep'" class="ios-sep" v-if="i < actions.length - 1"></div>
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
      <v-btn flat color="grey" to="/empathy">
        <v-icon>favorite_border</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import moment from 'moment';

const CHECK_KEY = 'nvc.check';
function loadCheckMap() {
  try { return JSON.parse(localStorage.getItem(CHECK_KEY)) || {}; } catch (e) { return {}; }
}

export default {
  name: 'action-list',
  data() {
    return {
      openIndex: null,
      itemToDelete: null,
      isDeleteDialogShowing: false,
      isEditDialogShowing: false,
      editOriginalText: '',
      editText: '',
      checkMap: loadCheckMap(),
      sw: { openIdx: null, openDir: null, touchIdx: null, startX: 0, startY: 0, dx: 0, isH: null, drag: false },
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
      this.sw.openIdx = null; this.sw.openDir = null;
      this.openIndex = this.openIndex === i ? null : i;
    },
    doCheck(text) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.checkMap = Object.assign({}, this.checkMap, { [text]: Date.now() });
      localStorage.setItem(CHECK_KEY, JSON.stringify(this.checkMap));
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
      this.sw.dx = Math.max(-80, Math.min(dx, 65));
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
      else if (s.openIdx === i) x = s.openDir === 'left' ? -80 : 65;
      return { transform: `translateX(${x}px)`, transition: live ? 'none' : 'transform 0.2s ease' };
    },
    deskClick(i) {
      if (this.sw.openIdx !== null) { this.sw.openIdx = null; this.sw.openDir = null; return; }
      this.toggle(i);
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
