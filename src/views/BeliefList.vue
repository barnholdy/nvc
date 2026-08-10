<template>
  <div class="dark-page">
    <v-content>
      <div class="screen-title-row">
        <h1 class="screen-title">Überzeugungen</h1>
        <button class="screen-add" @click="$router.push('/settings')" aria-label="Einstellungen">
          <v-icon color="#4ade80">settings</v-icon>
        </button>
      </div>

      <!-- Counts on the filter, so the shape of the whole is readable before
           anything is opened. -->
      <div class="pill-row">
        <button
          v-for="f in filters"
          :key="f.key"
          class="pill"
          :class="{ active: tab === f.key }"
          @click="tab = f.key"
        >{{ f.label }}<span class="pill-count"> · {{ f.count }}</span></button>
      </div>

      <div v-if="filteredBeliefs.length === 0" class="list-empty">
        <span class="list-empty-icon">💡</span>
        <p class="list-empty-title">Keine Einträge</p>
        <p class="list-empty-sub">{{ emptyText }}</p>
      </div>

      <div
        v-for="(entry, idx) in filteredBeliefs"
        :key="entry.time"
        class="swipe-outer"
        :data-row-id="entry.time"
        @touchstart="tsStart($event, idx)"
        @touchmove="tsMove($event, idx)"
        @touchend="tsEnd($event, idx)"
      >
        <div v-if="sw.openIdx === idx || sw.touchIdx === idx" class="swipe-right-panel">
          <button class="swipe-btn swipe-btn-edit" @click.stop="editEntry(entry)">
            <v-icon small color="#fff">edit</v-icon>
            <span>Ergründen</span>
          </button>
          <button class="swipe-btn swipe-btn-change" @click.stop="changeEntry(entry)">
            <v-icon small color="#fff">autorenew</v-icon>
            <span>Wandeln</span>
          </button>
          <button class="swipe-btn swipe-btn-act" @click.stop="actEntry(entry)">
            <v-icon small color="#fff">directions_run</v-icon>
            <span>Handeln</span>
          </button>
        </div>
        <div v-if="sw.openIdx === idx || sw.touchIdx === idx" class="swipe-left-panel">
          <button class="swipe-btn swipe-btn-delete" @click.stop="preDelete(entry)">
            <v-icon small color="#fff">delete</v-icon>
            <span>Löschen</span>
          </button>
        </div>

        <div class="card" :style="rowSt(idx, 195)">
          <div class="card-head">
            <p class="card-title">{{ entry.belief }}</p>
            <button
              v-if="rowActionLabel(entry)"
              class="card-btn"
              @click.stop="runRowAction(entry)"
            >{{ rowActionLabel(entry) }}</button>
          </div>
          <span class="card-pill">{{ statusLabel(entry) }}</span>

          <div v-if="credibility(entry) !== null" class="score-row">
            <span class="score-value">{{ round(credibility(entry)) }}</span>
            <span class="score-max">/10</span>
            <span class="score-label">Glaubwürdigkeit</span>
          </div>

          <div class="card-sep"></div>

          <!-- The order the work happens in: what the belief does, where it
               comes from, what it is for, then what has been put against it. -->
          <div
            v-if="entry.withBelief || feelingsOf(entry).length"
            class="detail-row"
            :class="{ open: isOpen(entry, 'reaction') }"
            @click.stop="toggleRow(entry, 'reaction')"
          >
            <span class="detail-label">Reaktion</span>
            <template v-if="isOpen(entry, 'reaction')">
              <p class="detail-value open">{{ entry.withBelief || '—' }}</p>
              <feeling-chips
                v-if="feelingsOf(entry).length"
                :items="feelingsOf(entry)"
                type="feelings"
                flat
                class="mt-2"
              ></feeling-chips>
            </template>
            <template v-else>
              <p class="detail-value">{{ entry.withBelief || feelingNames(entry) }}</p>
              <v-icon class="detail-chevron">chevron_right</v-icon>
            </template>
          </div>

          <div
            v-if="originOf(entry)"
            class="detail-row"
            :class="{ open: isOpen(entry, 'origin') }"
            @click.stop="toggleRow(entry, 'origin')"
          >
            <span class="detail-label">Ursprung</span>
            <p class="detail-value" :class="{ open: isOpen(entry, 'origin') }">{{ originOf(entry) }}</p>
            <v-icon v-if="!isOpen(entry, 'origin')" class="detail-chevron">chevron_right</v-icon>
          </div>

          <div
            v-if="needsOf(entry).length"
            class="detail-row"
            :class="{ open: isOpen(entry, 'needs') }"
            @click.stop="toggleRow(entry, 'needs')"
          >
            <span class="detail-label">Bedürfnisse</span>
            <feeling-chips
              v-if="isOpen(entry, 'needs')"
              :items="needsOf(entry)"
              type="needs"
              flat
            ></feeling-chips>
            <template v-else>
              <p class="detail-value">{{ needNames(entry) }}</p>
              <v-icon class="detail-chevron">chevron_right</v-icon>
            </template>
          </div>

          <div
            v-if="entry.empathy"
            class="detail-row"
            :class="{ open: isOpen(entry, 'empathy') }"
            @click.stop="toggleRow(entry, 'empathy')"
          >
            <span class="detail-label">Empathie</span>
            <p class="detail-value" :class="{ open: isOpen(entry, 'empathy') }">{{ entry.empathy }}</p>
            <v-icon v-if="!isOpen(entry, 'empathy')" class="detail-chevron">chevron_right</v-icon>
          </div>

          <div
            v-if="exceptionsOf(entry)"
            class="detail-row"
            :class="{ open: isOpen(entry, 'exceptions') }"
            @click.stop="toggleRow(entry, 'exceptions')"
          >
            <span class="detail-label">Ausnahmen</span>
            <p class="detail-value" :class="{ open: isOpen(entry, 'exceptions') }">{{ exceptionsOf(entry) }}</p>
            <v-icon v-if="!isOpen(entry, 'exceptions')" class="detail-chevron">chevron_right</v-icon>
          </div>

          <div
            v-if="withoutBeliefOf(entry) || newFeelingsOf(entry).length"
            class="detail-row"
            :class="{ open: isOpen(entry, 'newReaction') }"
            @click.stop="toggleRow(entry, 'newReaction')"
          >
            <span class="detail-label">Neue Reaktion</span>
            <template v-if="isOpen(entry, 'newReaction')">
              <p class="detail-value open">{{ withoutBeliefOf(entry) || '—' }}</p>
              <feeling-chips
                v-if="newFeelingsOf(entry).length"
                :items="newFeelingsOf(entry)"
                type="feelings"
                flat
                class="mt-2"
              ></feeling-chips>
            </template>
            <template v-else>
              <p class="detail-value">{{ withoutBeliefOf(entry) || newFeelingNames(entry) }}</p>
              <v-icon class="detail-chevron">chevron_right</v-icon>
            </template>
          </div>

          <div
            v-if="affirmationOf(entry)"
            class="aff-box"
            @click.stop="openAffirmation(affirmationOf(entry).text)"
          >
            <p class="aff-label">Affirmation</p>
            <p class="aff-text">„{{ affirmationOf(entry).text }}“</p>
            <div class="aff-foot">
              <span class="aff-score">
                <span class="aff-value">{{ round(truthOf(affirmationOf(entry))) }}</span>
                <span class="aff-max">/10</span>
                <span class="aff-word">Glaubwürdigkeit</span>
              </span>
            </div>
          </div>

          <div v-if="patternCount(entry.time)" class="card-link" @click.stop="openSituations(entry)">
            <span class="card-link-text">{{ situationsLabel(entry) }}</span>
            <v-icon class="detail-chevron">chevron_right</v-icon>
          </div>

          <div v-if="experimentCount(entry)" class="card-link" @click.stop="openExperiments(entry)">
            <span class="card-link-text">{{ experimentsLabel(entry) }}</span>
            <v-icon class="detail-chevron">chevron_right</v-icon>
          </div>
        </div>
      </div>

      <div class="list-bottom-space"></div>

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
        <v-icon>flare</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/actions">
        <v-icon>gps_fixed</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import FeelingChips from '@/components/FeelingChips.vue';
import {
  beliefStatus,
  beliefStatusLabel,
  isBeliefStatus,
  BELIEF_STATUSES,
  BELIEF_STATUS_LABELS,
} from '@/utils/beliefStatus';
import { experimentsOf, experimentDisplayState } from '@/utils/experiment';
import { normalizeTruth } from '@/utils/affirmationTruth';
import { beliefCredibility } from '@/utils/credibility';
import { openQuery, requestedId, scrollRowIntoView } from '@/utils/reveal';

export default {
  name: 'belief-list',
  components: { FeelingChips },
  data() {
    return {
      // Which written answer is unfolded, keyed by belief and row: every card
      // is open at once now, so one shared flag would open them all.
      openRows: {},
      entryToDelete: null,
      isDeleteDialogShowing: false,
      // Saving a belief returns here with the tab it now belongs to.
      tab: isBeliefStatus(this.$route.query.tab) ? this.$route.query.tab : 'all',
      sw: { openIdx: null, openDir: null, touchIdx: null, startX: 0, startY: 0, dx: 0, isH: null, drag: false },
    };
  },
  mounted() {
    this.revealRequested();
  },
  watch: {
    '$route.query.open': function() { this.revealRequested(); },
    tab() { this.sw.openIdx = null; this.sw.openDir = null; },
  },
  computed: {
    beliefs() {
      const map = this.patternCountMap;
      return this.$store.getters.beliefs
        .concat()
        .sort((a, b) => ((map[b.time] || 0) - (map[a.time] || 0)) || (b.time - a.time));
    },
    filteredBeliefs() {
      if (this.tab === 'all') return this.beliefs;
      return this.beliefs.filter(e => beliefStatus(e) === this.tab);
    },
    filters() {
      const all = { key: 'all', label: 'Alle', count: this.beliefs.length };
      return [all].concat(BELIEF_STATUSES.map(key => ({
        key,
        label: BELIEF_STATUS_LABELS[key],
        count: this.beliefs.filter(e => beliefStatus(e) === key).length,
      })));
    },
    emptyText() {
      if (this.tab === 'open') return 'Überzeugungen entstehen beim Anlegen einer Situation.';
      if (this.tab === 'working') return 'Noch keine ergründeten Überzeugungen.';
      if (this.tab === 'done') return 'Noch keine gewandelten Überzeugungen.';
      return 'Überzeugungen entstehen beim Anlegen einer Situation.';
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
    // Open the belief this route asks for. It may well sit under a different
    // tab than the one showing, so the tab follows the belief rather than the
    // other way round.
    revealRequested() {
      const id = requestedId(this.$route);
      if (!id) return;
      const entry = this.$store.getters.beliefs.find(b => String(b.time) === id);
      if (!entry) return;
      this.tab = 'all';
      this.$nextTick(() => scrollRowIntoView(this.$el, entry.time));
    },
    // One decimal, and a German comma: the headline number is the only
    // place this value is shown, so rounding it whole would hide half a
    // point that was actually recorded.
    round(v) {
      if (v === null || v === undefined) return '';
      return String(Math.round(v * 10) / 10).replace('.', ',');
    },
    statusLabel(entry) { return beliefStatusLabel(entry); },
    credibility(entry) {
      return beliefCredibility(this.$store.getters.patterns, entry);
    },
    isOpen(entry, key) { return !!this.openRows[`${entry.time}:${key}`]; },
    toggleRow(entry, key) {
      const k = `${entry.time}:${key}`;
      this.openRows = Object.assign({}, this.openRows, { [k]: !this.openRows[k] });
    },
    // Everything the card reads, each guarded so a half-filled belief simply
    // shows fewer rows rather than empty ones.
    feelingsOf(entry) { return Array.isArray(entry.feelings) ? entry.feelings : []; },
    needsOf(entry) { return Array.isArray(entry.needs) ? entry.needs : []; },
    originOf(entry) { return (entry.reflection && entry.reflection.origin) || ''; },
    exceptionsOf(entry) { return (entry.reflection && entry.reflection.exceptions) || ''; },
    withoutBeliefOf(entry) { return (entry.reflection && entry.reflection.withoutBelief) || ''; },
    newFeelingsOf(entry) {
      const r = entry.reflection || {};
      return Array.isArray(r.withoutBeliefFeelings) ? r.withoutBeliefFeelings : [];
    },
    affirmationOf(entry) {
      const list = Array.isArray(entry.affirmations) ? entry.affirmations : [];
      return list.find(a => a && a.text) || null;
    },
    truthOf(a) { return normalizeTruth(a.resonance); },
    names(list) { return list.map(x => x && x.name).filter(Boolean).join(' · '); },
    feelingNames(entry) { return this.names(this.feelingsOf(entry)); },
    newFeelingNames(entry) { return this.names(this.newFeelingsOf(entry)); },
    needNames(entry) { return this.names(this.needsOf(entry)); },
    patternCount(beliefTime) { return this.patternCountMap[beliefTime] || 0; },
    experimentCount(entry) { return experimentsOf(entry).length; },
    situationsLabel(entry) {
      const n = this.patternCount(entry.time);
      if (!n) return 'Keine Situationen';
      return n === 1 ? '1 Situation ansehen' : `${n} Situationen ansehen`;
    },
    // How many runs there are and how many still wait — the two numbers that
    // say whether there is anything to do here.
    experimentsLabel(entry) {
      const list = experimentsOf(entry);
      if (!list.length) return 'Keine Handlungen';
      const openCount = list.filter(x => experimentDisplayState(x) !== 'done').length;
      const head = list.length === 1 ? '1 Handlung' : `${list.length} Handlungen`;
      return openCount ? `${head} · ${openCount} offen` : head;
    },
    openSituations(entry) {
      const first = this.$store.getters.patterns
        .find(p => (p.beliefs || []).indexOf(entry.time) !== -1);
      if (!first) return;
      this.$router.push({ path: '/patterns', query: openQuery(first.time) });
    },
    openExperiments(entry) {
      const first = experimentsOf(entry)[0];
      if (!first) return;
      this.$router.push({ path: '/actions', query: openQuery(first.id) });
    },
    openAffirmation(text) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.$router.push({ path: '/affirmations', query: openQuery(text) });
    },
    // The one step that moves this belief forward from where it stands.
    rowActionLabel(entry) {
      const s = beliefStatus(entry);
      if (s === 'open') return 'Ergründen';
      if (s === 'working') return 'Wandeln';
      if (s === 'done') return 'Handeln';
      return '';
    },
    runRowAction(entry) {
      const s = beliefStatus(entry);
      if (s === 'open') this.editEntry(entry);
      else if (s === 'working') this.changeEntry(entry);
      else if (s === 'done') this.actEntry(entry);
    },
    editEntry(entry) { this.sw.openIdx = null; this.sw.openDir = null; this.$router.push(`/edit-belief/${entry.time}`); },
    changeEntry(entry) { this.sw.openIdx = null; this.sw.openDir = null; this.$router.push(`/change-belief/${entry.time}`); },
    actEntry(entry) { this.sw.openIdx = null; this.sw.openDir = null; this.$router.push(`/act-belief/${entry.time}`); },
    preDelete(entry) { this.sw.openIdx = null; this.sw.openDir = null; this.entryToDelete = entry; this.isDeleteDialogShowing = true; },
    confirmDelete() {
      this.isDeleteDialogShowing = false;
      this.$store.dispatch('deleteBelief', this.entryToDelete);
      this.entryToDelete = null;
    },
    cancelDelete() { this.isDeleteDialogShowing = false; this.entryToDelete = null; },
    // The card is tall, so a swipe has to be clearly horizontal before it
    // counts — otherwise scrolling past a card would drag it sideways.
    tsStart(e, i) {
      if (e.target && e.target.closest
        && (e.target.closest('.swipe-btn') || e.target.closest('.card-btn'))) return;
      const t = e.touches[0];
      this.sw.touchIdx = i; this.sw.startX = t.clientX; this.sw.startY = t.clientY;
      this.sw.dx = 0; this.sw.isH = null; this.sw.drag = false;
    },
    tsMove(e, i) {
      if (this.sw.touchIdx !== i) return;
      const t = e.touches[0];
      const dx = t.clientX - this.sw.startX, dy = t.clientY - this.sw.startY;
      if (this.sw.isH === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8))
        this.sw.isH = Math.abs(dx) > Math.abs(dy) * 1.5;
      if (!this.sw.isH) return;
      e.preventDefault();
      this.sw.dx = Math.max(-80, Math.min(dx, 195));
      this.sw.drag = true;
    },
    tsEnd(e, i) {
      if (this.sw.touchIdx !== i) return;
      if (this.sw.drag) {
        if (this.sw.dx < -40) { this.sw.openIdx = i; this.sw.openDir = 'left'; }
        else if (this.sw.dx > 40) { this.sw.openIdx = i; this.sw.openDir = 'right'; }
        else { this.sw.openIdx = null; this.sw.openDir = null; }
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
.swipe-right-panel {
  position: absolute;
  left: 16px; top: 0; bottom: 0;
  display: flex;
  align-items: center;
}
.swipe-left-panel {
  position: absolute;
  right: 16px; top: 0; bottom: 0;
  display: flex;
  align-items: center;
}
.swipe-btn {
  width: 65px;
  align-self: stretch;
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
  span { line-height: 1.1; }
}
.swipe-btn-edit { background: #636366; border-radius: 18px 0 0 18px; }
.swipe-btn-change { background: #fd9927; }
.swipe-btn-act { background: #2f7a52; border-radius: 0 18px 18px 0; }
.swipe-btn-delete { background: #ff453a; width: 80px; border-radius: 18px; }

.mt-2 { margin-top: 8px !important; }

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
