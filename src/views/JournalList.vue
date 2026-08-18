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

        <!-- Which belief is being worked on, the same way the Verlauf list
             narrows to one. Only worth offering once more than one has an
             entry. -->
        <div v-if="filterBeliefs.length > 1" class="pill-row">
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
        </div>
      </div>

      <div v-if="!groups.length" class="list-empty">
        <p class="list-empty-title">Noch keine Einträge</p>
        <p class="list-empty-sub">Täglich kleine Gegenbeispiele notieren.</p>
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
                    <p class="card-title">{{ entry.fact }}</p>
                  </div>
                </div>

                <feeling-chips
                  v-if="feelingsOf(entry).length"
                  :items="feelingsOf(entry)"
                  type="feelings"
                  flat
                  class="journal-feelings"
                ></feeling-chips>

                <p v-if="entry.meaning" class="journal-meaning">{{ entry.meaning }}</p>

                <!-- The objection first, then the sentence it is aimed at:
                     the affirmation gets the last word. -->
                <p v-if="entry.note" class="journal-note">„{{ entry.note }}“</p>

                <!-- The sentence this entry is evidence for. -->
                <div v-if="affirmationOf(entry)" class="aff-box">
                  <p class="aff-label">Affirmation</p>
                  <p class="aff-text">„{{ affirmationOf(entry) }}“</p>
                </div>

                <belief-chip
                  :text="beliefTextOf(entry)"
                  :value="ownValue(entry)"
                  :baseline="credibilityOf(entry)"
                  @open="openBelief(entry)"
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
      <v-btn flat color="grey" to="/patterns">
        <nav-icon name="patterns"></nav-icon>
      </v-btn>
      <v-btn flat color="grey" to="/beliefs">
        <nav-icon name="beliefs"></nav-icon>
      </v-btn>
      <v-btn flat color="grey" to="/actions">
        <nav-icon name="actions"></nav-icon>
      </v-btn>
      <v-btn flat color="primary" to="/journal">
        <nav-icon name="journal"></nav-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import moment from 'moment';
import { openQuery, requestedId, scrollRowIntoView } from '@/utils/reveal';
import { beliefCredibility } from '@/utils/credibility';
import NavIcon from '@/components/NavIcon.vue';
import BeliefChip from '@/components/BeliefChip.vue';
import FeelingChips from '@/components/FeelingChips.vue';

export default {
  name: 'journal-list',
  components: { NavIcon, BeliefChip, FeelingChips },
  data() {
    return {
      beliefFilter: null,
      entryToDelete: null,
      isDeleteDialogShowing: false,
      sw: { openKey: null, handleHeight: 0, openDir: null, touchKey: null, startX: 0, startY: 0, dx: 0, isH: null, drag: false },
    };
  },
  computed: {
    entries() {
      return this.$store.getters.journal.concat().sort((a, b) => b.time - a.time);
    },
    filtered() {
      if (this.beliefFilter === null) return this.entries;
      return this.entries.filter(e => e.beliefTime === this.beliefFilter);
    },
    // Only beliefs an entry was actually written against can filter one.
    filterBeliefs() {
      const counts = {};
      this.entries.forEach((e) => { counts[e.beliefTime] = (counts[e.beliefTime] || 0) + 1; });
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
    this.applyBeliefQuery();
    this.revealRequested();
  },
  watch: {
    '$route.query.open': function() { this.revealRequested(); },
    '$route.query.belief': function() { this.applyBeliefQuery(); },
  },
  methods: {
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
      this.$nextTick(() => scrollRowIntoView(this.$el, id));
    },
    isSwiping(key) { return this.sw.openKey === key || this.sw.touchKey === key; },
    beliefOf(entry) {
      return this.$store.getters.beliefs.find(b => b.time === entry.beliefTime);
    },
    beliefTextOf(entry) {
      const b = this.beliefOf(entry);
      return b ? b.belief : 'Gelöschte Überzeugung';
    },
    affirmationOf(entry) {
      const b = this.beliefOf(entry);
      if (!b) return '';
      return (b.affirmations || []).map(a => a && a.text).filter(Boolean).join(' · ');
    },
    feelingsOf(entry) {
      return Array.isArray(entry.feelings) ? entry.feelings : [];
    },
    // Where the belief stands — the number its own card shows as its headline.
    credibilityOf(entry) {
      const b = this.beliefOf(entry);
      if (!b) return null;
      return beliefCredibility(this.$store.getters.patterns, b, this.$store.getters.journal);
    },
    // What this one entry rated it at, which an older entry may not carry.
    ownValue(entry) {
      return typeof entry.credibility === 'number' ? entry.credibility : null;
    },
    dayLabel(time) {
      moment.locale('de');
      return moment(time).format('D. MMM').toUpperCase();
    },
    openBelief(entry) {
      if (!this.beliefOf(entry)) return;
      this.$router.push({ path: '/beliefs', query: openQuery(entry.beliefTime, { top: true }) });
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
  &::before { top: 14px; bottom: 0; }
  &::after { top: 0; height: 14px; }
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
/* .aff-box carries no top margin of its own — everywhere else it follows a
   detail row whose padding already holds it off. Here a paragraph sits above
   it, and a paragraph's bottom margin is zero. */
.aff-box { margin-top: 14px; }
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
