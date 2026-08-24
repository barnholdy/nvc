<template>
  <div class="dark-page">
    <v-content>
      <div class="screen-header">
        <div class="screen-title-row">
          <h1 class="screen-title">Tagebuch</h1>
          <div class="screen-actions">
            <button class="screen-add" @click="$router.push('/add-journal')" aria-label="Neuer Eintrag">+</button>
            <button class="screen-add" @click="$router.push('/settings')" aria-label="Einstellungen">
              <v-icon color="#8e8e93">settings</v-icon>
            </button>
          </div>
        </div>

        <!-- How much of an entry to show, and which belief to narrow to —
             one row, since both say what the list below is showing. -->
        <div class="pill-row">
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
              @click="beliefFilter = null"
            >Alle</button>
            <button
              v-for="b in filterBeliefs"
              :key="b.time"
              class="pill"
              :class="{ active: beliefFilter === b.time }"
              @click="beliefFilter = b.time"
            >„{{ b.belief }}“<span class="pill-count"> · {{ b.count }}</span></button>
          </template>
        </div>

        <!-- Which kind of entry: what set a belief off, or what spoke
             against it. Only worth offering once both kinds exist. -->
        <div v-if="hasBothTypes" class="pill-row">
          <button
            class="pill"
            :class="{ active: typeFilter === null }"
            @click="typeFilter = null"
          >Alle</button>
          <button
            v-for="t in typeFilters"
            :key="t.key"
            class="pill"
            :class="{ active: typeFilter === t.key }"
            @click="typeFilter = t.key"
          >{{ t.label }}<span class="pill-count"> · {{ t.count }}</span></button>
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
          :key="entry.time"
          :data-row-id="entry.time"
        >
          <div
            class="timeline-row"
            :class="{ 'timeline-first': entry.time === group.entries[0].time }"
          >
            <span class="timeline-dot"></span>
            <div class="timeline-body">
              <p class="timeline-meta">{{ dayLabel(entry.time) }}</p>
              <div class="card journal-card">
                <!-- Only the head answers the swipe; the rest of the card
                     stays put, the way the belief and action cards work. -->
                <div class="head-swipe">
                  <div v-if="isSwiping(entry.time)" class="swipe-panel left">
                    <div class="swipe-group single swipe-btn-edit">
                      <button class="swipe-btn swipe-btn-edit" @click.stop="editEntry(entry)">Bearbeiten</button>
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
                    <!-- Which of the two an entry is, said by its mark rather
                         than by a word: a bolt for the moment a belief struck,
                         a page for the moment it did not hold. -->
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

                <feeling-chips
                  v-if="!collapsed && feelingsOf(entry).length"
                  :items="feelingsOf(entry)"
                  type="feelings"
                  flat
                  class="journal-feelings"
                ></feeling-chips>

                <p v-if="!collapsed && entry.meaning" class="journal-meaning">{{ entry.meaning }}</p>

                <!-- The objection first, then the sentence it is aimed at:
                     the affirmation gets the last word. -->
                <p v-if="!collapsed && entry.note" class="journal-note">„{{ entry.note }}“</p>

                <!-- Every belief this entry was written against, each with
                     the sentence meant to replace it and what this one entry
                     rated it at. -->
                <belief-chip
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
      <v-btn flat color="grey" to="/actions">
        <nav-icon name="actions"></nav-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import moment from 'moment';
import { openQuery, requestedId, scrollRowIntoView } from '@/utils/reveal';
import { beliefCredibility, beliefStanding } from '@/utils/credibility';
import {
  journalBeliefTimes, journalNames, journalTruthFor, entryType, isTrigger,
  TRIGGER, REFLECTION,
} from '@/utils/journalBeliefs';
import { mdiLightningBolt, mdiBookOpenPageVariant } from '@mdi/js';
import NavIcon from '@/components/NavIcon.vue';
import BeliefChip from '@/components/BeliefChip.vue';
import FeelingChips from '@/components/FeelingChips.vue';

const COLLAPSED_KEY = 'nvc.journalCollapsed';

// A belief can carry more than one sentence to grow into; they read as one.
function affirmationTextOf(belief) {
  return (belief.affirmations || []).map(a => a && a.text).filter(Boolean).join(' · ');
}

export default {
  name: 'journal-list',
  components: { NavIcon, BeliefChip, FeelingChips },
  data() {
    return {
      collapsed: localStorage.getItem(COLLAPSED_KEY) === '1',
      beliefFilter: null,
      typeFilter: null,
      entryToDelete: null,
      isDeleteDialogShowing: false,
      sw: { openKey: null, handleHeight: 0, openDir: null, touchKey: null, startX: 0, startY: 0, dx: 0, isH: null, drag: false },
    };
  },
  computed: {
    entries() {
      return this.$store.getters.journal.concat().sort((a, b) => b.time - a.time);
    },
    // Each filter counts against what the other one left standing, so the
    // numbers on the chips describe the list you would actually get.
    byType() {
      if (this.typeFilter === null) return this.entries;
      return this.entries.filter(e => entryType(e) === this.typeFilter);
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
      return [
        { key: TRIGGER, label: 'Trigger', count: list.filter(isTrigger).length },
        { key: REFLECTION, label: 'Reflexionen', count: list.filter(e => !isTrigger(e)).length },
      ];
    },
    hasBothTypes() {
      return this.typeFilters.every(t => t.count > 0);
    },
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
    this.applyBeliefQuery();
    this.revealRequested();
  },
  watch: {
    collapsed(v) { localStorage.setItem(COLLAPSED_KEY, v ? '1' : '0'); },
    '$route.query.open': function() { this.revealRequested(); },
    '$route.query.belief': function() { this.applyBeliefQuery(); },
    '$route.query.type': function() { this.applyTypeQuery(); },
  },
  methods: {
    // Coming from a belief card's "Trigger" or "Reflexionen" row: it asks for
    // one kind, and the chip row shows which one is being read.
    applyTypeQuery() {
      const raw = this.$route.query.type;
      if (raw === TRIGGER || raw === REFLECTION) this.typeFilter = raw;
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
        const el = this.$el.querySelector('.pill.active');
        if (el && el.scrollIntoView) {
          el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        }
      });
    },
    // Coming from a trend bar: clear the filter so the row it points at is
    // actually in the list, then bring it into view.
    revealRequested() {
      const id = requestedId(this.$route);
      if (!id) return;
      if (!this.entries.some(e => String(e.time) === id)) return;
      this.beliefFilter = null;
      this.typeFilter = null;
      this.$nextTick(() => scrollRowIntoView(this.$el, id));
    },
    isSwiping(key) { return this.sw.openKey === key || this.sw.touchKey === key; },
    typeOf(entry) { return entryType(entry); },
    typeIcon(entry) { return isTrigger(entry) ? mdiLightningBolt : mdiBookOpenPageVariant; },
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
          // A Trigger speaks for the belief, so the sentence meant to replace
          // it has no business being quoted underneath.
          affirmation: belief && !isTrigger(entry) ? affirmationTextOf(belief) : '',
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
      this.sw.dx = Math.max(-110, Math.min(dx, 120));
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
    rowSt(key) {
      const s = this.sw;
      const live = s.touchKey === key && s.drag && s.isH;
      let x = 0;
      if (live) x = s.dx;
      else if (s.openKey === key) x = s.openDir === 'left' ? -110 : 120;
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
.entry-icon-reflection { color: #46955f; }
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
