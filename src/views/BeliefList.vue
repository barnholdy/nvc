<template>
  <div class="dark-page">
    <v-content>
      <div class="screen-header">
        <div class="screen-title-row">
          <h1 class="screen-title">Überzeugungen</h1>
          <div class="screen-actions">
            <button class="screen-add" @click="$router.push('/settings')" aria-label="Einstellungen">
              <v-icon color="#8e8e93">settings</v-icon>
            </button>
          </div>
        </div>

        <!-- Counts on the filter, so the shape of the whole is readable before
             anything is opened. -->
        <div class="pill-row">
          <!-- Compact strips the card back to what a belief is and where it
               stands; everything written about it stays one tap away. -->
          <button
            class="pill pill-icon"
            :class="{ active: compact }"
            :aria-label="compact ? 'Ausführliche Ansicht' : 'Kompakte Ansicht'"
            @click="compact = !compact"
          >
            <v-icon small>{{ compact ? 'unfold_more' : 'unfold_less' }}</v-icon>
          </button>
          <button
            ref="sortBtn"
            class="pill pill-icon"
            :class="{ active: sortMenuOpen }"
            aria-label="Sortieren"
            @click.stop="toggleSortMenu"
          >
            <v-icon small>sort</v-icon>
          </button>
          <button
            v-for="f in filters"
            :key="f.key"
            class="pill"
            :class="{ active: tab === f.key }"
            @click="tab = f.key"
          >{{ f.label }}<span class="pill-count"> · {{ f.count }}</span></button>
        </div>
      </div>

      <div v-if="filteredBeliefs.length === 0" class="list-empty">
        <p class="list-empty-title">Keine Einträge</p>
        <p class="list-empty-sub">{{ emptyText }}</p>
      </div>

      <div
        v-for="(entry, idx) in filteredBeliefs"
        :key="entry.time"
        class="card"
        :data-row-id="entry.time"
      >
        <div class="head-swipe">
          <!-- The step the card already offers is left out: it is on screen a
               few pixels away. -->
          <div v-if="isSwiping(idx)" class="swipe-panel left">
            <div class="swipe-group" :class="{ single: otherSteps(entry).length === 1 }">
              <button
                v-for="step in otherSteps(entry)"
                :key="step.key"
                class="swipe-btn"
                :style="{ color: step.color }"
                @click.stop="step.run(entry)"
              >{{ step.label }}</button>
            </div>
          </div>
          <div v-if="isSwiping(idx)" class="swipe-panel right">
            <div class="swipe-group single swipe-btn-delete">
              <button class="swipe-btn swipe-btn-delete" @click.stop="preDelete(entry)">Löschen</button>
            </div>
          </div>
          <div
            class="card-head swipe-handle"
            :style="rowSt(idx)"
            @touchstart="tsStart($event, idx)"
            @touchmove="tsMove($event, idx)"
            @touchend="tsEnd($event, idx)"
          >
            <p class="card-title">„{{ entry.belief }}“</p>
            <button
              v-if="rowActionLabel(entry)"
              class="card-btn"
              @click.stop="runRowAction(entry)"
            >{{ rowActionLabel(entry) }}</button>
          </div>
        </div>
          <span class="card-pill">{{ statusLabel(entry) }}</span>

          <!-- Number on the left, the movement of that number on the right:
               the line and the words under it say the same thing, so they
               belong in one column. -->
          <div v-if="credibility(entry) !== null" class="score-row">
            <div class="score-main">
              <span class="score-value">⌀ {{ round(credibility(entry)) }}</span>
              <span class="score-max">/10</span>
              <span class="score-label">Glaubwürdigkeit</span>
            </div>
            <div v-if="trendOf(entry)" class="score-side">
              <sparkline
                class="score-spark"
                :values="trendOf(entry).values"
                :color="trendOf(entry).color"
              ></sparkline>
              <span
                class="score-trend"
                :style="{ color: trendOf(entry).color }"
              >{{ trendOf(entry).text }}</span>
            </div>
          </div>

          <div v-if="!compact" class="card-sep"></div>

          <!-- The order the work happens in: what the belief does, where it
               comes from, what it is for, then what has been put against it. -->
          <div
            v-if="!compact && (entry.withBelief || feelingsOf(entry).length || copingOf(entry))"
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
              <!-- How the belief is dealt with belongs to the reaction it
                   shapes, so it unfolds with it. -->
              <span v-if="copingOf(entry)" class="coping-chip">{{ copingOf(entry) }}</span>
            </template>
            <template v-else>
              <p class="detail-value">{{ entry.withBelief || feelingNames(entry) }}</p>
              <v-icon class="detail-chevron">chevron_right</v-icon>
            </template>
          </div>

          <div
            v-if="!compact && originOf(entry)"
            class="detail-row"
            :class="{ open: isOpen(entry, 'origin') }"
            @click.stop="toggleRow(entry, 'origin')"
          >
            <span class="detail-label">Ursprung</span>
            <p class="detail-value" :class="{ open: isOpen(entry, 'origin') }">{{ originOf(entry) }}</p>
            <v-icon v-if="!isOpen(entry, 'origin')" class="detail-chevron">chevron_right</v-icon>
          </div>

          <div
            v-if="!compact && needsOf(entry).length"
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
            v-if="!compact && entry.empathy"
            class="detail-row"
            :class="{ open: isOpen(entry, 'empathy') }"
            @click.stop="toggleRow(entry, 'empathy')"
          >
            <span class="detail-label">Empathie</span>
            <p class="detail-value" :class="{ open: isOpen(entry, 'empathy') }">{{ entry.empathy }}</p>
            <!-- What was kept from the mirroring, not the mirroring itself —
                 set apart with its own label so the two voices stay distinct. -->
            <div v-if="isOpen(entry, 'empathy') && entry.empathyReflection" class="empathy-reflection">
              <p class="empathy-reflection-label">Was du annehmen willst</p>
              <p class="empathy-reflection-text">{{ entry.empathyReflection }}</p>
            </div>
            <v-icon v-if="!isOpen(entry, 'empathy')" class="detail-chevron">chevron_right</v-icon>
          </div>

          <div
            v-if="!compact && exceptionsOf(entry)"
            class="detail-row"
            :class="{ open: isOpen(entry, 'exceptions') }"
            @click.stop="toggleRow(entry, 'exceptions')"
          >
            <span class="detail-label">Ausnahmen</span>
            <p class="detail-value" :class="{ open: isOpen(entry, 'exceptions') }">{{ exceptionsOf(entry) }}</p>
            <v-icon v-if="!isOpen(entry, 'exceptions')" class="detail-chevron">chevron_right</v-icon>
          </div>

          <div
            v-if="!compact && (withoutBeliefOf(entry) || newFeelingsOf(entry).length)"
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
            :class="{ 'aff-box-loose': compact }"
          >
            <p class="aff-label">Affirmation</p>
            <p class="aff-text">„{{ affirmationOf(entry).text }}“</p>
            <div class="aff-foot">
              <button class="card-btn" @click.stop="startPractice(entry)">Üben</button>
            </div>
          </div>

          <div
            v-if="compact && (patternCount(entry.time) || experimentCount(entry) || journalCount(entry.time))"
            class="link-chips"
          >
            <span
              v-if="patternCount(entry.time)"
              class="link-chip"
              @click.stop="openSituations(entry)"
            >{{ situationsShort(entry) }}</span>
            <span
              v-if="experimentCount(entry)"
              class="link-chip"
              @click.stop="openExperiments(entry)"
            >{{ experimentsShort(entry) }}</span>
            <span
              v-if="journalCount(entry.time)"
              class="link-chip"
              @click.stop="openJournal(entry)"
            >{{ journalShort(entry) }}</span>
          </div>

          <div v-if="!compact && patternCount(entry.time)" class="card-link" @click.stop="openSituations(entry)">
            <span class="card-link-text">{{ situationsLabel(entry) }}</span>
            <v-icon class="detail-chevron">chevron_right</v-icon>
          </div>

          <div v-if="!compact && experimentCount(entry)" class="card-link" @click.stop="openExperiments(entry)">
            <span class="card-link-text">{{ experimentsLabel(entry) }}</span>
            <v-icon class="detail-chevron">chevron_right</v-icon>
          </div>

          <div v-if="!compact && journalCount(entry.time)" class="card-link" @click.stop="openJournal(entry)">
            <span class="card-link-text">{{ journalLabel(entry) }}</span>
            <v-icon class="detail-chevron">chevron_right</v-icon>
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

    <!-- Sits outside the scrolling header entirely, positioned in JS off the
         button's own rect: no ancestor overflow or stacking context can clip
         or bury it, whatever the header's scroll state. -->
    <div v-if="sortMenuOpen" class="sort-backdrop" @click="sortMenuOpen = false"></div>
    <div v-if="sortMenuOpen" class="sort-menu" :style="sortMenuPos">
      <button
        v-for="opt in sortOptions"
        :key="opt.key"
        class="sort-menu-item"
        @click="selectSort(opt.key)"
      >
        <span>{{ opt.label }}</span>
        <v-icon v-if="sortMode === opt.key" small color="#4ade80">check</v-icon>
      </button>
    </div>

    <affirmation-practice
      v-if="practising"
      :text="practising.text"
      :feelings="practising.feelings"
      :needs="practising.needs"
      @close="practising = null"
    ></affirmation-practice>

    <v-bottom-nav :value="true" fixed app color="#1c1c1e" class="dark-nav">
      <v-btn flat color="grey" to="/now">
        <nav-icon name="now"></nav-icon>
      </v-btn>
      <v-btn flat color="grey" to="/patterns">
        <nav-icon name="patterns"></nav-icon>
      </v-btn>
      <v-btn flat color="primary" to="/beliefs">
        <nav-icon name="beliefs"></nav-icon>
      </v-btn>
      <v-btn flat color="grey" to="/actions">
        <nav-icon name="actions"></nav-icon>
      </v-btn>
      <v-btn flat color="grey" to="/journal">
        <nav-icon name="journal"></nav-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import moment from 'moment';
import FeelingChips from '@/components/FeelingChips.vue';
import Sparkline from '@/components/Sparkline.vue';
import AffirmationPractice from '@/components/AffirmationPractice.vue';
import {
  beliefStatus,
  beliefStatusLabel,
  isBeliefStatus,
  BELIEF_STATUSES,
  BELIEF_STATUS_LABELS,
} from '@/utils/beliefStatus';
import { experimentsOf, experimentDisplayState } from '@/utils/experiment';
import { beliefCredibility, beliefPoints } from '@/utils/credibility';
import { deltaColor } from '@/utils/beliefTrend';
import { copingLabel } from '@/utils/coping';
import { requestedId, scrollRowIntoView, scrollRowToTop } from '@/utils/reveal';
import NavIcon from '@/components/NavIcon.vue';

const PRACTICE_KEY = 'nvc.amen';
const COMPACT_KEY = 'nvc.beliefsCompact';
const SORT_KEY = 'nvc.beliefsSort';
const SORT_OPTIONS = [
  { key: 'situations', label: 'Situationen' },
  { key: 'recent', label: 'Zuletzt genannt' },
  { key: 'credibility', label: 'Glaubwürdigkeit' },
];
const SORT_KEYS = SORT_OPTIONS.map(o => o.key);

export default {
  name: 'belief-list',
  components: { FeelingChips, Sparkline, AffirmationPractice, NavIcon },
  data() {
    return {
      // Which written answer is unfolded, keyed by belief and row: every card
      // is open at once now, so one shared flag would open them all.
      openRows: {},
      practising: null,
      // Remembered, so the choice survives leaving the list and coming back.
      compact: localStorage.getItem(COMPACT_KEY) === '1',
      sortMode: SORT_KEYS.indexOf(localStorage.getItem(SORT_KEY)) !== -1
        ? localStorage.getItem(SORT_KEY)
        : 'situations',
      sortMenuOpen: false,
      sortMenuPos: { top: '0px', left: '0px' },
      entryToDelete: null,
      isDeleteDialogShowing: false,
      // Saving a belief returns here with the tab it now belongs to.
      tab: isBeliefStatus(this.$route.query.tab) ? this.$route.query.tab : 'all',
      sw: { openIdx: null, handleHeight: 0, openDir: null, touchIdx: null, startX: 0, startY: 0, dx: 0, isH: null, drag: false },
    };
  },
  mounted() {
    this.revealRequested();
  },
  watch: {
    compact(v) { localStorage.setItem(COMPACT_KEY, v ? '1' : '0'); },
    sortMode(v) { localStorage.setItem(SORT_KEY, v); },
    '$route.query.open': function() { this.revealRequested(); },
    tab() { this.sw.openIdx = null; this.sw.openDir = null; },
  },
  computed: {
    // The panels reach only as far down as the part that answers the
    // swipe, so a tall card does not get a full-height slab behind it.
    panelStyle() {
      return this.sw.handleHeight ? { height: `${this.sw.handleHeight}px` } : null;
    },
    sortOptions() { return SORT_OPTIONS; },
    beliefs() {
      const list = this.$store.getters.beliefs.concat();
      if (this.sortMode === 'recent') {
        const recent = this.lastMentionMap;
        // Never mentioned in a situation sinks to the bottom — there is no
        // "most recent" to rank it by.
        return list.sort((a, b) => {
          const ra = recent[a.time]; const rb = recent[b.time];
          if (ra === undefined && rb === undefined) return b.time - a.time;
          if (ra === undefined) return 1;
          if (rb === undefined) return -1;
          return rb - ra;
        });
      }
      if (this.sortMode === 'credibility') {
        // Never rated sinks to the bottom, same reasoning as above.
        return list.sort((a, b) => {
          const ca = this.credibility(a); const cb = this.credibility(b);
          if (ca === null && cb === null) return b.time - a.time;
          if (ca === null) return 1;
          if (cb === null) return -1;
          return cb - ca;
        });
      }
      const map = this.patternCountMap;
      return list.sort((a, b) => ((map[b.time] || 0) - (map[a.time] || 0)) || (b.time - a.time));
    },
    // The most recent situation each belief was named in — undefined for one
    // that has never been.
    lastMentionMap() {
      const map = {};
      this.$store.getters.patterns.forEach((p) => {
        (p.beliefs || []).forEach((id) => {
          if (map[id] === undefined || p.time > map[id]) map[id] = p.time;
        });
      });
      return map;
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
    journalCountMap() {
      const map = {};
      this.$store.getters.journal.forEach((e) => {
        if (!e) return;
        map[e.beliefTime] = (map[e.beliefTime] || 0) + 1;
      });
      return map;
    },
  },
  methods: {
    // Fixed rather than absolute, and rendered outside the header entirely:
    // the pill row scrolls horizontally, and anything anchored inside it —
    // absolutely positioned or not — risks being clipped or buried by that
    // same overflow/stacking context. A failure to read the button's own
    // position must still open the menu somewhere rather than do nothing.
    toggleSortMenu() {
      if (this.sortMenuOpen) { this.sortMenuOpen = false; return; }
      const MENU_WIDTH = 220;
      let top = 96;
      let left = 14;
      const el = this.$refs.sortBtn;
      if (el && typeof el.getBoundingClientRect === 'function') {
        const r = el.getBoundingClientRect();
        top = r.bottom + 6;
        left = Math.max(14, Math.min(r.left, window.innerWidth - MENU_WIDTH - 14));
      }
      this.sortMenuPos = { top: `${top}px`, left: `${left}px` };
      this.sortMenuOpen = true;
    },
    selectSort(key) {
      this.sortMode = key;
      this.sortMenuOpen = false;
    },
    // Open the belief this route asks for. It may well sit under a different
    // tab than the one showing, so the tab follows the belief rather than the
    // other way round.
    revealRequested() {
      const id = requestedId(this.$route);
      if (!id) return;
      const entry = this.$store.getters.beliefs.find(b => String(b.time) === id);
      if (!entry) return;
      this.tab = 'all';
      // A chip that names exactly one belief lands it flush at the top;
      // arriving from a longer list keeps the centred landing.
      const top = this.$route.query.top === '1';
      this.$nextTick(() => (top
        ? scrollRowToTop(this.$el, entry.time)
        : scrollRowIntoView(this.$el, entry.time)));
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
      return beliefCredibility(this.$store.getters.patterns, entry, this.$store.getters.journal);
    },
    // Only from the second reading on: one number has no direction. The month
    // named is the one the run started in, so "seit Juni" means "since the
    // first time you rated this".
    copingOf(entry) { return copingLabel(entry && entry.coping); },
    trendOf(entry) {
      const points = beliefPoints(this.$store.getters.patterns, entry, this.$store.getters.journal);
      if (points.length < 2) return null;
      const first = points[0];
      const last = points[points.length - 1];
      const delta = Math.round((last.value - first.value) * 10) / 10;
      if (delta === 0) return null;
      moment.locale('de');
      const sign = delta > 0 ? '+' : '−';
      const shown = String(Math.abs(delta)).replace('.', ',');
      return {
        text: `${sign}${shown} seit ${moment(first.time).format('MMMM')}`,
        // A belief losing credibility is the direction the work aims at.
        color: deltaColor(delta),
        values: points.map(pt => pt.value),
      };
    },
    // The same screen the Affirmationen list opens, fed from this belief: the
    // new feelings it was written towards, and the needs it serves.
    startPractice(entry) {
      const a = this.affirmationOf(entry);
      if (!a) return;
      this.practising = {
        text: a.text,
        feelings: this.newFeelingsOf(entry),
        needs: this.needsOf(entry),
      };
      // Practising is recorded in one place, whichever list it was started from.
      try {
        const map = JSON.parse(localStorage.getItem(PRACTICE_KEY)) || {};
        map[a.text] = Date.now();
        localStorage.setItem(PRACTICE_KEY, JSON.stringify(map));
      } catch (e) { /* a full or blocked store must not stop the practice */ }
    },
    // Every step except the one the card's own button already offers.
    otherSteps(entry) {
      const here = this.rowActionLabel(entry);
      return [
        { key: 'edit', label: 'Ergründen', color: '#8e8e93', run: e => this.editEntry(e) },
        { key: 'change', label: 'Wandeln', color: '#fd9927', run: e => this.changeEntry(e) },
        { key: 'act', label: 'Handeln', color: '#4ade80', run: e => this.actEntry(e) },
      ].filter(s => s.label !== here);
    },
    isSwiping(idx) { return this.sw.openIdx === idx || this.sw.touchIdx === idx; },
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
    names(list) { return list.map(x => x && x.name).filter(Boolean).join(' · '); },
    feelingNames(entry) { return this.names(this.feelingsOf(entry)); },
    newFeelingNames(entry) { return this.names(this.newFeelingsOf(entry)); },
    needNames(entry) { return this.names(this.needsOf(entry)); },
    patternCount(beliefTime) { return this.patternCountMap[beliefTime] || 0; },
    experimentCount(entry) { return experimentsOf(entry).length; },
    journalCount(beliefTime) { return this.journalCountMap[beliefTime] || 0; },
    // The compact chip has room for the count and nothing else.
    situationsShort(entry) {
      const n = this.patternCount(entry.time);
      return n === 1 ? '1 Situation' : `${n} Situationen`;
    },
    experimentsShort(entry) {
      const n = experimentsOf(entry).length;
      return n === 1 ? '1 Handlung' : `${n} Handlungen`;
    },
    journalShort(entry) {
      const n = this.journalCount(entry.time);
      return n === 1 ? '1 Eintrag' : `${n} Einträge`;
    },
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
    journalLabel(entry) {
      const n = this.journalCount(entry.time);
      if (!n) return 'Keine Tagebucheinträge';
      return n === 1 ? '1 Tagebucheintrag ansehen' : `${n} Tagebucheinträge ansehen`;
    },
    // The target list opens filtered to this belief rather than at one of its
    // rows: the question being asked is "all of them", not "that one".
    openSituations(entry) {
      this.$router.push({ path: '/patterns', query: { belief: String(entry.time) } });
    },
    openExperiments(entry) {
      this.$router.push({ path: '/actions', query: { belief: String(entry.time) } });
    },
    openJournal(entry) {
      this.$router.push({ path: '/journal', query: { belief: String(entry.time) } });
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
      this.sw.handleHeight = e.currentTarget ? e.currentTarget.offsetHeight : 0;
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
      this.sw.dx = Math.max(-110, Math.min(dx, this.rightWidth(i)));
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
    // Keep in step with the buttons rendered above: a head that slides further
    // than the chip is wide leaves a gap and reads as slack.
    rightWidth(i) {
      const entry = this.filteredBeliefs[i];
      return entry && this.otherSteps(entry).length >= 2 ? 190 : 110;
    },
    rowSt(i) {
      const s = this.sw;
      const live = s.touchIdx === i && s.drag && s.isH;
      let x = 0;
      if (live) x = s.dx;
      else if (s.openIdx === i) x = s.openDir === 'left' ? -110 : this.rightWidth(i);
      return { transform: `translateX(${x}px)`, transition: live ? 'none' : 'transform 0.2s ease' };
    },
  },
};
</script>

<style scoped lang="scss">
.dark-page { background: #000; min-height: 100vh; }

/* Catches the tap that dismisses the menu, without dimming the screen the
   way a real dialog's backdrop would for what is just a small picker. */
.sort-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: transparent;
}
.sort-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 41;
  min-width: 220px;
  background: #2c2c2e;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  padding: 4px 0;
  overflow: hidden;
}
.sort-menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  color: #fff;
  font-family: inherit;
  font-size: 0.92rem;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { background: rgba(255, 255, 255, 0.06); }
}

.mt-2 { margin-top: 8px !important; }

/* Its own voice: quieter than the mirrored text above it, set apart by a
   rule rather than a box — a second box would compete with the empathy text
   itself for attention. */
.empathy-reflection {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #2c2c2e;
}
.empathy-reflection-label {
  font-size: 0.68rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  margin: 0 0 6px;
}
.empathy-reflection-text {
  font-size: 0.95rem;
  color: #ebebf5;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
}

/* Without the row list above it the box would butt straight against the
   trend line, which is a number, not a heading. */
.aff-box-loose { margin-top: 14px !important; }
/* Two columns of different heights now, so the shared baseline rule that
   suits a single line does not apply here. */
.score-row { align-items: center; }
.score-main {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
/* The line and its reading, stacked and pinned right. */
.score-side {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  margin-left: 12px;
}
.score-trend {
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}
/* Quieter than a feeling chip: it names a strategy, not something picked
   here, and must not outweigh the reaction it belongs to. */
.coping-chip {
  display: inline-flex;
  align-items: center;
  margin-top: 8px;
  border: 1px solid #3a3a3c;
  border-radius: 999px;
  padding: 4px 11px;
  font-size: 0.78rem;
  color: #8e8e93;
}
/* Compact mode drops the full-width links but keeps the counts reachable,
   shrunk down to a tap target that names just the number and the noun. */
.link-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}
.link-chip {
  display: inline-flex;
  align-items: center;
  border: 1px solid #3a3a3c;
  border-radius: 999px;
  padding: 4px 11px;
  font-size: 0.78rem;
  color: #d1d1d6;
}
.link-chip:active { opacity: 0.6; }
/* Only the head answers a swipe; the rest of the card scrolls freely. */

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
