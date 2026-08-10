<template>
  <div class="dark-page">
    <v-content>
      <div class="screen-title-row">
        <h1 class="screen-title">Affirmationen</h1>
        <button class="screen-add" @click="$router.push('/settings')" aria-label="Einstellungen">
          <v-icon color="#4ade80">settings</v-icon>
        </button>
      </div>

      <div v-if="affirmations.length === 0" class="list-empty">
        <span class="list-empty-icon">✨</span>
        <p class="list-empty-title">Keine Einträge</p>
        <p class="list-empty-sub">Füge Affirmationen zu deinen Überzeugungen hinzu.</p>
      </div>

      <div
        v-for="(item, i) in affirmations"
        :key="item.text"
        class="swipe-outer"
        :data-row-id="item.text"
      >
        <div v-if="sw.openIdx === i || sw.touchIdx === i" class="swipe-left-panel" :style="panelStyle">
          <button class="swipe-btn swipe-btn-delete" @click.stop="preDelete(item)">
            <v-icon small color="#fff">delete</v-icon>
            <span>Löschen</span>
          </button>
        </div>

        <div class="card" :style="rowSt(i)">
          <div
            class="card-head swipe-handle"
            @touchstart="tsStart($event, i)"
            @touchmove="tsMove($event, i)"
            @touchend="tsEnd($event, i)"
          >
            <p class="card-title">„{{ item.text }}“</p>
            <button class="card-btn" @click.stop="startPractice(item)">Üben</button>
          </div>

          <div v-if="item.credibility !== null" class="score-row">
            <span class="score-value">{{ round(item.credibility) }}</span>
            <span class="score-max">/10</span>
            <span class="score-label">Glaubwürdigkeit</span>
          </div>
          <p class="practice-meta">{{ amenLabel(item.text) }}</p>

          <div class="card-sep"></div>

          <!-- Where the sentence comes from, and what it is meant to bring —
               one block per belief that carries it. -->
          <div
            v-for="(s, j) in item.sources"
            :key="j"
            class="detail-row"
            :class="{ open: isOpen(item, j) }"
            @click.stop="toggleRow(item, j)"
          >
            <span class="detail-label">Überzeugung</span>
            <template v-if="isOpen(item, j)">
              <p class="detail-value open">„{{ s.beliefText }}“</p>
              <p v-if="beliefTruth(s.beliefTime) !== null" class="source-score">
                {{ round(beliefTruth(s.beliefTime)) }}/10 Glaubwürdigkeit
              </p>
              <template v-if="newFeelingsOf(s.beliefTime).length">
                <p class="source-label">Neue Gefühle</p>
                <feeling-chips :items="newFeelingsOf(s.beliefTime)" type="feelings" flat></feeling-chips>
              </template>
              <template v-if="needsOf(s.beliefTime).length">
                <p class="source-label">Bedürfnisse</p>
                <feeling-chips :items="needsOf(s.beliefTime)" type="needs" flat></feeling-chips>
              </template>
              <button class="source-link" @click.stop="openBelief(s.beliefTime)">
                Zur Überzeugung
                <v-icon class="detail-chevron">chevron_right</v-icon>
              </button>
            </template>
            <template v-else>
              <p class="detail-value">„{{ s.beliefText }}“</p>
              <v-icon class="detail-chevron">chevron_right</v-icon>
            </template>
          </div>
        </div>
      </div>

      <div class="list-bottom-space"></div>

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

    <affirmation-practice
      v-if="practising"
      :text="practising.text"
      :feelings="practiceFeelings"
      :needs="practiceNeeds"
      @close="practising = null"
    ></affirmation-practice>

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
import { affirmationCredibility, beliefCredibility } from '@/utils/credibility';
import { beliefStatusLabel, beliefStatusColor } from '@/utils/beliefStatus';
import { openQuery, requestedId, scrollRowIntoView } from '@/utils/reveal';
import FeelingChips from '@/components/FeelingChips.vue';
import AffirmationPractice from '@/components/AffirmationPractice.vue';

const AMEN_KEY = 'nvc.amen';

function loadAhoMap() {
  try { return JSON.parse(localStorage.getItem(AMEN_KEY)) || {}; } catch (e) { return {}; }
}

export default {
  name: 'affirmation-list',
  components: { FeelingChips, AffirmationPractice },
  data() {
    return {
      // Which source belief is unfolded, keyed by sentence and index.
      openRows: {},
      itemToDelete: null,
      isDeleteDialogShowing: false,
      amenMap: loadAhoMap(),
      practising: null,
      sw: { openIdx: null, handleHeight: 0, openDir: null, touchIdx: null, startX: 0, startY: 0, dx: 0, isH: null, drag: false },
    };
  },
  watch: {
    '$route.query.open': function() { this.revealRequested(); },
  },
  computed: {
    // The panels reach only as far down as the part that answers the
    // swipe, so a tall card does not get a full-height slab behind it.
    panelStyle() {
      return this.sw.handleHeight ? { height: `${this.sw.handleHeight}px` } : null;
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
      })).sort((a, b) => {
        // Least believed first: that is the sentence most worth practising.
        // Never rated sorts last — "lowest first" cannot rank a value nobody
        // gave, and an unrated sentence is not the least believed one, it is
        // simply unmeasured.
        const ca = a.credibility === null ? Infinity : a.credibility;
        const cb = b.credibility === null ? Infinity : b.credibility;
        if (ca !== cb) return ca - cb;
        if (a.beliefCount !== b.beliefCount) return b.beliefCount - a.beliefCount;
        return a.text.localeCompare(b.text);
      });
    },
    currentEditAffirmation() {
      const key = this.editOriginalText;
      if (!key) return null;
      return this.affirmations.find(a => a.text === key) || null;
    },
    // Pooled across every belief that carries the sentence: in the practice
    // view they circle the affirmation itself, not one belief at a time.
    practiceFeelings() {
      return this.practiceSourceBeliefs.reduce((all, b) => {
        const r = b.reflection || {};
        return all.concat(Array.isArray(r.withoutBeliefFeelings) ? r.withoutBeliefFeelings : []);
      }, []);
    },
    practiceNeeds() {
      return this.practiceSourceBeliefs.reduce(
        (all, b) => all.concat(Array.isArray(b.needs) ? b.needs : []), [],
      );
    },
    practiceSourceBeliefs() {
      if (!this.practising) return [];
      return (this.practising.sources || [])
        .map(s => this.beliefOf(s.beliefTime))
        .filter(Boolean);
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
    // carries and what the row is found by.
    revealRequested() {
      const text = requestedId(this.$route);
      if (!text) return;
      const i = this.affirmations.findIndex(a => a.text === text);
      if (i === -1) return;
      this.$nextTick(() => scrollRowIntoView(this.$el, text));
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
    // One decimal, and a German comma: the headline number is the only
    // place this value is shown, so rounding it whole would hide half a
    // point that was actually recorded.
    round(v) {
      if (v === null || v === undefined) return '';
      return String(Math.round(v * 10) / 10).replace('.', ',');
    },
    isOpen(item, j) { return !!this.openRows[`${item.text}:${j}`]; },
    toggleRow(item, j) {
      const k = `${item.text}:${j}`;
      this.openRows = Object.assign({}, this.openRows, { [k]: !this.openRows[k] });
    },
    // Practising is worth marking, not worth scoring — the only value this
    // sentence carries is the credibility it was actually rated with.
    startPractice(item) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.practising = item;
      this.amenMap = Object.assign({}, this.amenMap, { [item.text]: Date.now() });
      localStorage.setItem(AMEN_KEY, JSON.stringify(this.amenMap));
    },
    amenLabel(text) {
      const ts = this.amenMap[text];
      if (!ts) return 'Noch nicht geübt';
      moment.locale('de');
      return `Geübt ${moment(ts).fromNow()}`;
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
    },
    tsStart(e, i) {
      if (e.target && e.target.closest && (e.target.closest('.amen-btn') || e.target.closest('.swipe-btn'))) return;
      this.sw.handleHeight = e.currentTarget ? e.currentTarget.offsetHeight : 0;
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
      // Nothing to reveal on the right any more; the row only opens towards
      // the delete button.
      this.sw.dx = Math.max(-80, Math.min(dx, 0));
      this.sw.drag = true;
    },
    tsEnd(e, i) {
      if (this.sw.touchIdx !== i) return;
      const wasVert = this.sw.isH === false;
      if (!wasVert) e.preventDefault();
      if (!this.sw.drag && !wasVert) {
        if (this.sw.openIdx !== null) { this.sw.openIdx = null; this.sw.openDir = null; }
        else { this.sw.openIdx = null; this.sw.openDir = null; }
      } else if (this.sw.drag) {
        if (this.sw.dx < -40) { this.sw.openIdx = i; this.sw.openDir = 'left'; }
        else { this.sw.openIdx = null; this.sw.openDir = null; }
      }
      this.sw.touchIdx = null; this.sw.dx = 0; this.sw.drag = false; this.sw.isH = null;
    },
    rowSt(i) {
      const s = this.sw;
      const live = s.touchIdx === i && s.drag && s.isH;
      let x = 0;
      if (live) x = s.dx;
      else if (s.openIdx === i) x = -80;
      return { transform: `translateX(${x}px)`, transition: live ? 'none' : 'transform 0.2s ease' };
    },

  },
};
</script>

<style scoped lang="scss">
.dark-page { background: #000; min-height: 100vh; }

.swipe-outer {
  position: relative;
  overflow: hidden;
  margin-bottom: 14px;
}
.swipe-outer .card { margin-bottom: 0; }
.swipe-left-panel {
  position: absolute;
  right: 14px; top: 0;
  display: flex;
  align-items: stretch;
}
.swipe-btn {
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: none;
  color: #fff;
  font-size: 0.7rem;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.swipe-btn-delete { background: #ff453a; border-radius: 18px; }

.swipe-handle { touch-action: pan-y; }
.practice-meta { font-size: 0.85rem; color: #636366; margin: 8px 0 0; }

.source-score { font-size: 0.85rem; color: #8e8e93; margin: 6px 0 0; }
.source-label {
  font-size: 0.68rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  margin: 12px 0 6px;
}
.source-link {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 12px 0 0;
  font-size: 0.9rem;
  font-family: inherit;
  color: #4ade80;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}

.confirm-dialog { background: #1c1c1e !important; }
.confirm-title { color: #fff; font-size: 1rem; justify-content: center; padding: 16px; }
.confirm-actions { justify-content: space-around; padding: 4px; }
.confirm-cancel { color: #8e8e93 !important; }
.confirm-delete { color: #ff453a !important; }

.dark-nav {
  border-top: 1px solid #2c2c2e;
  .v-btn { min-width: 0; }
}
</style>
