<template>
  <div class="dark-page">
    <v-content>
      <div class="screen-header">
        <div class="screen-title-row">
          <h1 class="screen-title">Tagebuch</h1>
          <div class="screen-actions">
            <button class="screen-add" @click="$router.push(addTarget)" aria-label="Neuer Eintrag">+</button>
            <button class="screen-add" @click="$router.push('/settings')" aria-label="Einstellungen">
              <v-icon color="#8e8e93">settings</v-icon>
            </button>
          </div>
        </div>

        <!-- How much of an entry to show, and which belief to narrow to —
             one row, since both say what the list below is showing. -->
        <div class="pill-row" data-pill-row="belief">
          <!-- Collapsed strips an entry back to what it is about: the moment,
               the sentence it speaks for, and the belief it speaks to. The
               feelings, the meaning and the „Ja, aber“ stay one tap away. -->
          <button
            class="pill pill-icon"
            :class="{ active: collapsed }"
            :aria-label="collapsed ? 'Ausführliche Ansicht' : 'Kompakte Ansicht'"
            @click="collapsed = !collapsed"
          >
            <v-icon small>{{ collapsed ? 'unfold_more' : 'unfold_less' }}</v-icon>
          </button>
          <!-- Only worth offering once more than one belief has an entry. -->
          <template v-if="filterBeliefs.length > 1">
            <button
              class="pill"
              :class="{ active: beliefFilter === null }"
              @click="pick($event, 'beliefFilter', null)"
            >Alle</button>
            <button
              v-for="b in filterBeliefs"
              :key="b.time"
              class="pill"
              :class="{ active: beliefFilter === b.time }"
              @click="pick($event, 'beliefFilter', b.time)"
            >„{{ b.belief }}“<span class="pill-count"> · {{ b.count }}</span></button>
          </template>
        </div>

        <!-- Which kind of entry: what set a belief off, or what spoke
             against it. Only worth offering once both kinds exist. -->
        <div v-if="hasTypeFilter" class="pill-row" data-pill-row="type">
          <button
            class="pill"
            :class="{ active: typeFilter === null }"
            @click="pick($event, 'typeFilter', null)"
          >Alle</button>
          <button
            v-for="t in typeFilters"
            :key="t.key"
            class="pill"
            :class="{ active: typeFilter === t.key }"
            @click="pick($event, 'typeFilter', t.key)"
          >{{ t.label }}<span class="pill-count"> · {{ t.count }}</span></button>
        </div>

        <!-- Once it is runs being read, which of them: the same two states
             their own list is split by. -->
        <div v-if="typeFilter === ACTION" class="pill-row" data-pill-row="state">
          <button
            class="pill"
            :class="{ active: actionState === null }"
            @click="pick($event, 'actionState', null)"
          >Alle</button>
          <button
            v-for="f in actionStateFilters"
            :key="f.key"
            class="pill"
            :class="{ active: actionState === f.key }"
            @click="pick($event, 'actionState', f.key)"
          >{{ f.label }}<span class="pill-count"> · {{ f.count }}</span></button>
        </div>
      </div>

      <div v-if="!groups.length" class="list-empty">
        <p class="list-empty-title">Noch keine Einträge</p>
        <p class="list-empty-sub">Halte fest, was dich getroffen hat — und was dagegen sprach.</p>
      </div>

      <template v-for="group in groups">
        <p :key="group.key" class="month-head">{{ group.label }}</p>

        <div
          v-for="entry in group.entries"
          :key="entry.key"
          :data-row-id="rowId(entry)"
        >
          <div
            class="timeline-row"
            :class="{ 'timeline-first': entry.key === group.entries[0].key }"
          >
            <span class="timeline-dot"></span>
            <div class="timeline-body">
              <p class="timeline-meta">{{ dayLabel(entry.time) }}</p>
              <div class="card journal-card">
                <!-- Only the head answers the swipe; the rest of the card
                     stays put, the way the belief and action cards work. -->
                <div class="head-swipe">
                  <!-- A run can be planned again or evaluated from here, just
                       as in its own list; whichever the card already offers is
                       left out. -->
                  <div v-if="isSwiping(entry.time)" class="swipe-panel left">
                    <div
                      class="swipe-group"
                      :class="{ single: swipeSteps(entry).length === 1 }"
                      :style="groupStyle(swipeSteps(entry))"
                    >
                      <button
                        v-for="step in swipeSteps(entry)"
                        :key="step.key"
                        class="swipe-btn"
                        :style="{ color: step.color }"
                        @click.stop="step.run(entry)"
                      >{{ step.label }}</button>
                    </div>
                  </div>
                  <div v-if="isSwiping(entry.time)" class="swipe-panel right">
                    <div class="swipe-group single swipe-btn-delete">
                      <button class="swipe-btn swipe-btn-delete" @click.stop="preDelete(entry)">Löschen</button>
                    </div>
                  </div>
                  <div
                    class="card-head swipe-handle"
                    :style="rowSt(entry.time)"
                    @touchstart="tsStart($event, entry.time)"
                    @touchmove="tsMove($event, entry.time)"
                    @touchend="tsEnd($event, entry.time)"
                  >
                    <!-- Which kind an entry is, said by its mark rather than
                         by a word: a bolt for the moment a belief struck, a
                         page for the moment it did not hold, a flask for the
                         run that put it to the test. -->
                    <svg
                      class="entry-icon"
                      :class="`entry-icon-${typeOf(entry)}`"
                      viewBox="0 0 24 24"
                      width="17"
                      height="17"
                    ><path :d="typeIcon(entry)" fill="currentColor"></path></svg>
                    <p class="card-title">{{ entry.fact }}</p>
                  </div>
                </div>

                <!-- Where the run stands, the same badge its own list shows. -->
                <span v-if="isAction(entry)" class="card-pill">{{ entry.stateLabel }}</span>

                <feeling-chips
                  v-if="!collapsed && feelingsOf(entry).length"
                  :items="feelingsOf(entry)"
                  type="feelings"
                  flat
                  class="journal-feelings"
                ></feeling-chips>

                <template v-if="!collapsed && isAction(entry) && entry.fearExpected !== null">
                  <gap-bar :expected="entry.fearExpected" :actual="entry.fearActual"></gap-bar>
                  <div class="gap-legend">
                    <span class="gap-key"><i class="gap-dot gap-dot-expected"></i>erwartet</span>
                    <span v-if="entry.fearActual !== null" class="gap-key"><i class="gap-dot gap-dot-real"></i>real</span>
                  </div>
                </template>

                <template v-if="isAction(entry)">
                  <div v-if="!collapsed && (entry.fear || entry.outcome || entry.meaning)" class="card-sep"></div>

                  <div
                    v-for="d in actionDetails(entry)"
                    :key="d.key"
                    class="detail-row"
                    :class="{ open: isOpen(entry, d.key) }"
                    @click.stop="toggleRow(entry, d.key)"
                  >
                    <span class="detail-label">{{ d.label }}</span>
                    <p class="detail-value" :class="{ open: isOpen(entry, d.key) }">{{ d.value }}</p>
                    <v-icon v-if="!isOpen(entry, d.key)" class="detail-chevron">chevron_right</v-icon>
                  </div>
                </template>

                <template v-else>
                  <p v-if="!collapsed && entry.meaning" class="journal-meaning">{{ entry.meaning }}</p>

                  <!-- The objection first, then the sentence it is aimed at:
                       the affirmation gets the last word. -->
                  <p v-if="!collapsed && entry.note" class="journal-note">„{{ entry.note }}“</p>
                </template>

                <!-- Every belief this entry was written against, each with
                     the sentence meant to replace it. The blocks show what
                     this one entry rated it at; the mark is the trend it sits
                     in — the median of the last three readings. -->
                <belief-chip
                  trend-mark
                  v-for="b in shownBeliefsOf(entry)"
                  :key="b.time"
                  :text="b.text"
                  :affirmation="b.affirmation"
                  :current="b.current"
                  :standing="b.standing"
                  :baseline="b.baseline"
                  :tappable="b.exists"
                  @open="openBelief(b.time)"
                ></belief-chip>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Evaluating is the same four questions as in the Handlungen list. -->
      <action-result-dialog
        :row="resultRow"
        @close="resultRow = null"
      ></action-result-dialog>

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
      <v-btn flat color="grey" to="/now">
        <nav-icon name="now"></nav-icon>
      </v-btn>
      <v-btn flat color="primary" to="/journal">
        <nav-icon name="journal"></nav-icon>
      </v-btn>
      <v-btn flat color="grey" to="/beliefs">
        <nav-icon name="beliefs"></nav-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import moment from 'moment';
import { openQuery, requestedId, scrollRowIntoView } from '@/utils/reveal';
import { alignPill } from '@/utils/pillScroll';
import { beliefCredibility, beliefStanding } from '@/utils/credibility';
import {
  journalBeliefTimes, journalNames, journalTruthFor, entryType,
  TRIGGER, REFLECTION, ACTION,
} from '@/utils/journalBeliefs';
import {
  experimentsOf, experimentDisplayState, experimentDate,
  EXPERIMENT_DISPLAY_LABELS, EXPERIMENT_DISPLAY_STATES,
} from '@/utils/experiment';
import { deleteExperiment } from '@/utils/experimentWrite';
import ActionResultDialog from '@/components/ActionResultDialog.vue';
import { mdiLightningBolt, mdiBookOpenPageVariant, mdiFlaskOutline } from '@mdi/js';
import NavIcon from '@/components/NavIcon.vue';
import BeliefChip from '@/components/BeliefChip.vue';
import FeelingChips from '@/components/FeelingChips.vue';
import GapBar from '@/components/GapBar.vue';

const COLLAPSED_KEY = 'nvc.journalCollapsed';

// A belief can carry more than one sentence to grow into; they read as one.
function affirmationTextOf(belief) {
  return (belief.affirmations || []).map(a => a && a.text).filter(Boolean).join(' · ');
}

export default {
  name: 'journal-list',
  components: { NavIcon, BeliefChip, FeelingChips, GapBar, ActionResultDialog },
  data() {
    return {
      collapsed: localStorage.getItem(COLLAPSED_KEY) === '1',
      beliefFilter: null,
      typeFilter: null,
      actionState: null,
      resultRow: null,
      openRows: {},
      entryToDelete: null,
      isDeleteDialogShowing: false,
      sw: { openKey: null, handleHeight: 0, openDir: null, touchKey: null, startX: 0, startY: 0, dx: 0, isH: null, drag: false },
    };
  },
  computed: {
    // An evaluated run belongs to its belief, not to this book — but it is a
    // moment that was lived through and rated, like the other two, so the
    // Tagebuch reads it alongside them. Read-only: it is written and changed
    // in the Handlungen list, which owns it.
    actionEntries() {
      const out = [];
      this.$store.getters.beliefs.forEach((belief) => {
        experimentsOf(belief).forEach((x) => {
          const truths = {};
          if (typeof x.beliefTruth === 'number') truths[belief.time] = x.beliefTruth;
          out.push({
            key: `a${x.id}`,
            actionId: x.id,
            beliefTime: belief.time,
            time: experimentDate(x),
            type: ACTION,
            fact: x.situation || 'Ohne Situation',
            // What it told you — the same place a Reflexion's own reading of
            // the moment goes.
            meaning: x.learning || '',
            feelings: [],
            note: '',
            beliefTimes: [belief.time],
            beliefTruths: truths,
            fearExpected: typeof x.fearExpected === 'number' ? x.fearExpected : null,
            fearActual: typeof x.fearActual === 'number' ? x.fearActual : null,
            // What the Handlungen list shows on it, and what it can do next.
            state: experimentDisplayState(x),
            stateLabel: EXPERIMENT_DISPLAY_LABELS[experimentDisplayState(x)],
            outcome: x.outcome || '',
            fear: x.fear || '',
            // The row shape the shared evaluation dialog and the writer expect.
            row: { experiment: x, beliefTime: belief.time, beliefText: belief.belief },
          });
        });
      });
      return out;
    },
    entries() {
      return this.$store.getters.journal
        .map(e => Object.assign({ key: e.time }, e))
        .concat(this.actionEntries)
        .sort((a, b) => b.time - a.time);
    },
    // Each filter counts against what the other one left standing, so the
    // numbers on the chips describe the list you would actually get.
    byType() {
      if (this.typeFilter === null) return this.entries;
      const ofType = this.entries.filter(e => entryType(e) === this.typeFilter);
      if (this.typeFilter !== ACTION || this.actionState === null) return ofType;
      return ofType.filter(e => e.state === this.actionState);
    },
    byBelief() {
      if (this.beliefFilter === null) return this.entries;
      return this.entries.filter(e => journalNames(e, this.beliefFilter));
    },
    filtered() {
      if (this.beliefFilter === null) return this.byType;
      return this.byType.filter(e => journalNames(e, this.beliefFilter));
    },
    typeFilters() {
      const list = this.byBelief;
      const count = t => list.filter(e => entryType(e) === t).length;
      return [
        { key: TRIGGER, label: 'Trigger', count: count(TRIGGER) },
        { key: REFLECTION, label: 'Reflexionen', count: count(REFLECTION) },
        { key: ACTION, label: 'Handlungen', count: count(ACTION) },
      ].filter(t => t.count > 0);
    },
    // Nothing to narrow down to while only one kind has been written.
    hasTypeFilter() {
      return this.typeFilters.length > 1;
    },
    // Counted against the beliefs left standing, the same way the kinds are.
    actionStateFilters() {
      const runs = this.byBelief.filter(e => entryType(e) === ACTION);
      return EXPERIMENT_DISPLAY_STATES.map(key => ({
        key,
        label: EXPERIMENT_DISPLAY_LABELS[key],
        count: runs.filter(e => e.state === key).length,
      }));
    },
    // Exposed so the row can ask whether runs are what is being read.
    ACTION() { return ACTION; },
    // Only beliefs an entry was actually written against can filter one. An
    // entry naming several counts once for each of them.
    filterBeliefs() {
      const counts = {};
      this.byType.forEach((e) => {
        journalBeliefTimes(e).forEach((t) => { counts[t] = (counts[t] || 0) + 1; });
      });
      return this.$store.getters.beliefs
        .filter(b => counts[b.time])
        .map(b => ({ time: b.time, belief: b.belief, count: counts[b.time] }))
        .sort((a, b) => b.count - a.count);
    },
    // What the „+“ opens: whatever the chips have already answered is
    // answered in the wizard too. A run with its belief already named is the
    // same thing as pressing „Handeln“ on that belief, so it goes straight
    // there rather than through a fork it would only pass through.
    addTarget() {
      if (this.typeFilter === ACTION) {
        // Always the wizard that knows about the belief step, so what the
        // chips answered can be walked back to rather than being locked in.
        const query = { from: 'journal' };
        if (this.beliefFilter !== null) query.belief = String(this.beliefFilter);
        return { path: '/add-action', query };
      }
      const query = {};
      if (this.typeFilter !== null) query.type = this.typeFilter;
      if (this.beliefFilter !== null) query.belief = String(this.beliefFilter);
      return { path: '/add-journal', query };
    },
    groups() {
      const out = [];
      const index = {};
      moment.locale('de');
      this.filtered.forEach((entry) => {
        const key = moment(entry.time).format('YYYY-MM');
        if (index[key] === undefined) {
          index[key] = out.length;
          out.push({ key, label: moment(entry.time).format('MMMM YYYY').toUpperCase(), entries: [] });
        }
        out[index[key]].entries.push(entry);
      });
      return out;
    },
  },
  mounted() {
    this.applyTypeQuery();
    this.applyStateQuery();
    this.applyBeliefQuery();
    this.revealRequested();
  },
  watch: {
    collapsed(v) { localStorage.setItem(COLLAPSED_KEY, v ? '1' : '0'); },
    typeFilter(v) { if (v !== ACTION) this.actionState = null; },
    '$route.query.open': function() { this.revealRequested(); },
    '$route.query.belief': function() { this.applyBeliefQuery(); },
    '$route.query.type': function() { this.applyTypeQuery(); },
    '$route.query.state': function() { this.applyStateQuery(); },
  },
  methods: {
    // Coming from a belief card's "Trigger" or "Reflexionen" row: it asks for
    // one kind, and the chip row shows which one is being read.
    applyTypeQuery() {
      const raw = this.$route.query.type;
      if (raw !== TRIGGER && raw !== REFLECTION && raw !== ACTION) return;
      this.typeFilter = raw;
      this.$nextTick(() => {
        this.alignActive('type');
      });
    },
    // Narrowing the runs further: which of the two states is being read.
    // Only meaningful once the runs themselves are what the list shows.
    applyStateQuery() {
      const raw = this.$route.query.state;
      if (EXPERIMENT_DISPLAY_STATES.indexOf(raw) === -1) return;
      this.typeFilter = ACTION;
      this.actionState = raw;
      this.$nextTick(() => {
        this.alignActive('state');
      });
    },
    // Coming from a belief card: select its chip, and scroll the pill row so
    // the selection is visible rather than somewhere off to the right.
    applyBeliefQuery() {
      const raw = this.$route.query.belief;
      if (!raw) return;
      const time = parseInt(raw, 10);
      if (!this.filterBeliefs.some(b => b.time === time)) return;
      this.beliefFilter = time;
      this.$nextTick(() => {
        this.alignActive('belief');
      });
    },
    // Coming from a trend bar: clear the filter so the row it points at is
    // actually in the list, then bring it into view.
    revealRequested() {
      const id = requestedId(this.$route);
      if (!id) return;
      if (!this.entries.some(e => String(this.rowId(e)) === id)) return;
      this.beliefFilter = null;
      this.typeFilter = null;
      this.actionState = null;
      this.$nextTick(() => scrollRowIntoView(this.$el, id));
    },
    // Picking a chip brings it to the left edge of its row, where the first
    // chip sits — so what the list is narrowed to is the first thing read,
    // however far along the row it was tapped.
    pick(event, filter, value) {
      this[filter] = value;
      alignPill(event.currentTarget);
    },
    // Which row a filter lives in depends on how many of them are shown, so
    // it is named rather than counted.
    alignActive(kind) {
      const row = this.$el.querySelector(`.pill-row[data-pill-row="${kind}"]`);
      // Not just any active chip: the collapse toggle shares this row and is
      // marked active whenever the compact view is on. It sits at the very
      // left, so aligning that one scrolls nowhere at all.
      alignPill(row && row.querySelector('.pill.active:not(.pill-icon)'));
    },
    rowId(entry) { return entry.actionId || entry.time; },
    isSwiping(key) { return this.sw.openKey === key || this.sw.touchKey === key; },
    typeOf(entry) { return entryType(entry); },
    isAction(entry) { return entryType(entry) === ACTION; },
    // What a run offers besides deleting: planning it again re-opens the
    // wizard on it, evaluating records its result. Both live in the swipe
    // menu, so the card itself stays a record rather than a control panel.
    swipeSteps(entry) {
      if (!this.isAction(entry)) {
        return [{ key: 'edit', label: 'Bearbeiten', color: '#4ade80', run: e => this.editEntry(e) }];
      }
      return [
        { key: 'plan', label: 'Planen', color: '#4ade80', run: e => this.editAction(e) },
        { key: 'evaluate', label: 'Auswerten', color: '#4ade80', run: e => this.startResult(e) },
      ];
    },
    // A single button's group takes that button's colour, so its outline
    // matches it rather than the card's inherited text colour.
    groupStyle(steps) {
      return steps.length === 1 ? { color: steps[0].color } : null;
    },
    // The three answers a run collects, in the order it collects them.
    actionDetails(entry) {
      if (this.collapsed) return [];
      return [
        { key: 'fear', label: 'Befürchtung', value: entry.fear },
        { key: 'outcome', label: 'Was passiert ist', value: entry.outcome },
        { key: 'learning', label: 'Was sagt dir das?', value: entry.meaning },
      ].filter(d => d.value);
    },
    isOpen(entry, key) { return !!this.openRows[`${entry.key}:${key}`]; },
    toggleRow(entry, key) {
      const k = `${entry.key}:${key}`;
      this.openRows = Object.assign({}, this.openRows, { [k]: !this.openRows[k] });
    },
    // The same wizard as "Handeln" on a belief, so there is one place a run
    // is planned.
    editAction(entry) {
      this.sw.openKey = null; this.sw.openDir = null;
      this.$router.push(`/act-belief/${entry.beliefTime}/${entry.actionId}`);
    },
    startResult(entry) {
      this.sw.openKey = null; this.sw.openDir = null;
      this.resultRow = entry.row;
    },
    typeIcon(entry) {
      const t = entryType(entry);
      if (t === TRIGGER) return mdiLightningBolt;
      return t === ACTION ? mdiFlaskOutline : mdiBookOpenPageVariant;
    },

    // Every belief this entry names: what it is called, what this one entry
    // rated it at, and where the belief itself stands.
    beliefsOf(entry) {
      const beliefs = this.$store.getters.beliefs;
      const patterns = this.$store.getters.patterns;
      const journal = this.$store.getters.journal;
      return journalBeliefTimes(entry).map((time) => {
        const belief = beliefs.find(b => b.time === time);
        return {
          time: time,
          text: belief ? belief.belief : 'Gelöschte Überzeugung',
          // Quoted under every kind of entry, a Trigger included: the moment
          // the belief strikes is exactly when the sentence meant to replace
          // it is worth having in front of you.
          affirmation: belief ? affirmationTextOf(belief) : '',
          exists: !!belief,
          current: journalTruthFor(entry, time),
          standing: belief ? beliefStanding(patterns, belief, journal) : null,
          baseline: belief ? beliefCredibility(patterns, belief, journal) : null,
        };
      });
    },
    // Once the list is narrowed to one belief, that is the only one an entry
    // is being read for here — the others would just repeat what their own
    // cards already say.
    shownBeliefsOf(entry) {
      const list = this.beliefsOf(entry);
      if (this.beliefFilter === null) return list;
      return list.filter(b => b.time === this.beliefFilter);
    },
    feelingsOf(entry) {
      return Array.isArray(entry.feelings) ? entry.feelings : [];
    },
    dayLabel(time) {
      moment.locale('de');
      return moment(time).format('D. MMM').toUpperCase();
    },
    openBelief(beliefTime) {
      if (!this.$store.getters.beliefs.some(b => b.time === beliefTime)) return;
      this.$router.push({ path: '/beliefs', query: openQuery(beliefTime, { top: true }) });
    },
    editEntry(entry) {
      this.sw.openKey = null; this.sw.openDir = null;
      this.$router.push(`/edit-journal/${entry.time}`);
    },
    preDelete(entry) {
      this.sw.openKey = null; this.sw.openDir = null;
      this.entryToDelete = entry;
      this.isDeleteDialogShowing = true;
    },
    cancelDelete() { this.isDeleteDialogShowing = false; this.entryToDelete = null; },
    confirmDelete() {
      this.isDeleteDialogShowing = false;
      const entry = this.entryToDelete;
      this.entryToDelete = null;
      if (!entry) return;
      if (this.isAction(entry)) {
        deleteExperiment(this.$store, entry.beliefTime, entry.actionId);
        return;
      }
      this.$store.dispatch('deleteJournalEntry', entry);
    },
    // Same swipe mechanics the Verlauf timeline uses, keyed by entry rather
    // than index for the same reason: a grouped list would otherwise collide
    // across months.
    tsStart(e, key) {
      if (e.target && e.target.closest
        && (e.target.closest('.swipe-btn') || e.target.closest('.belief-chip'))) return;
      this.sw.handleHeight = e.currentTarget ? e.currentTarget.offsetHeight : 0;
      const t = e.touches[0];
      this.sw.touchKey = key; this.sw.startX = t.clientX; this.sw.startY = t.clientY;
      this.sw.dx = 0; this.sw.isH = null; this.sw.drag = false;
    },
    tsMove(e, key) {
      if (this.sw.touchKey !== key) return;
      const t = e.touches[0];
      const dx = t.clientX - this.sw.startX, dy = t.clientY - this.sw.startY;
      if (this.sw.isH === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8))
        this.sw.isH = Math.abs(dx) > Math.abs(dy) * 1.5;
      if (!this.sw.isH) return;
      e.preventDefault();
      this.sw.dx = Math.max(-110, Math.min(dx, this.rightWidth(key)));
      this.sw.drag = true;
    },
    tsEnd(e, key) {
      if (this.sw.touchKey !== key) return;
      if (this.sw.drag) {
        if (this.sw.dx < -40) { this.sw.openKey = key; this.sw.openDir = 'left'; }
        else if (this.sw.dx > 40) { this.sw.openKey = key; this.sw.openDir = 'right'; }
        else { this.sw.openKey = null; this.sw.openDir = null; }
      } else if (this.sw.openKey !== null) {
        this.sw.openKey = null; this.sw.openDir = null;
      }
      this.sw.touchKey = null; this.sw.dx = 0; this.sw.drag = false; this.sw.isH = null;
    },
    // Keep in step with the buttons rendered above: a mismatch makes the card
    // spring back before the second one can be tapped.
    rightWidth(key) {
      const entry = this.entries.find(e => e.time === key);
      const n = entry ? this.swipeSteps(entry).length : 1;
      return n >= 2 ? 190 : 120;
    },
    rowSt(key) {
      const s = this.sw;
      const live = s.touchKey === key && s.drag && s.isH;
      let x = 0;
      if (live) x = s.dx;
      else if (s.openKey === key) x = s.openDir === 'left' ? -110 : this.rightWidth(key);
      return { transform: `translateX(${x}px)`, transition: live ? 'none' : 'transform 0.2s ease' };
    },
  },
};
</script>

<style scoped lang="scss">
.dark-page { background: #000; min-height: 100vh; }

.month-head {
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: #636366;
  font-weight: 600;
  margin: 18px 0 10px;
  padding: 0 20px;
}

/* Same thread the Verlauf timeline draws through its dots — but each entry
   is a card on it rather than bare text, so the row gives up the side
   padding the card supplies itself. */
.timeline-row {
  position: relative;
  display: flex;
  gap: 14px;
  padding: 4px 20px 12px;
  background: #000;
  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 24px;
    width: 1px;
    background: #2c2c2e;
  }
  /* Up to the dot and on from it, never across it: the dot starts 6px down
     and ends 9px later. */
  &::before { top: 15px; bottom: 0; }
  &::after { top: 0; height: 6px; }
  &.timeline-first::after { display: none; }
}
.timeline-dot {
  position: relative;
  flex-shrink: 0;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #48484a;
  margin-top: 6px;
}
.timeline-body { flex: 1; min-width: 0; position: relative; z-index: 1; }
.timeline-meta {
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  color: #636366;
  margin: 0 0 6px;
  text-transform: uppercase;
}
/* The card is the handle, so it keeps its own fill and radius and only
   drops the side margin .card carries for a full-width list. */
.journal-card { margin: 0; }
/* Sits with the first line of the text rather than centred on the whole
   block, so a wrapped sentence does not push it out of line. */
.entry-icon {
  flex-shrink: 0;
  margin-top: 3px;
}
/* The same two colours the credibility bar is read in: a Trigger is evidence
   for the belief, a Reflexion evidence against it. */
.entry-icon-trigger { color: #c0483d; }
/* Both speak against the belief, so both are green; the shape says which. */
.entry-icon-reflection { color: #46955f; }
.entry-icon-action { color: #46955f; }
.journal-meaning {
  font-size: 0.92rem;
  color: #8e8e93;
  line-height: 1.45;
  margin: 8px 0 0;
  font-style: italic;
}
/* Right under the fact it was felt about, before the interpretation and
   everything that follows it. */
.journal-feelings { margin-top: 12px; }
.journal-note {
  font-size: 0.85rem;
  color: #636366;
  line-height: 1.4;
  margin: 12px 0 0;
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
