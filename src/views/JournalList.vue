<template>
  <div class="dark-page">
    <v-content>
      <div class="screen-header">
        <div class="screen-title-row">
          <h1 class="screen-title">Positiv-Tagebuch</h1>
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
                <p
                  class="timeline-text swipe-handle"
                  :style="rowSt(entry.time)"
                  @touchstart="tsStart($event, entry.time)"
                  @touchmove="tsMove($event, entry.time)"
                  @touchend="tsEnd($event, entry.time)"
                >{{ entry.fact }}</p>
              </div>
              <p v-if="entry.meaning" class="journal-meaning">{{ entry.meaning }}</p>
              <div class="timeline-chips">
                <!-- Where the belief stands altogether, the way the Handlungen
                     cards tag theirs — the reading this entry itself took is
                     on the chip beside it. -->
                <span class="timeline-chip" @click.stop="openBelief(entry)">
                  „{{ beliefTextOf(entry) }}“
                  <span v-if="beliefTruthOf(entry) !== null" class="timeline-chip-score">
                    {{ round(beliefTruthOf(entry)) }}/10
                  </span>
                </span>
                <span class="fit-chip" :class="entry.fit">
                  {{ entry.fit === 'new' ? 'Neue Affirmation' : 'Alte Überzeugung' }}
                  <span v-if="typeof entry.credibility === 'number'" class="fit-chip-score"> · {{ entry.credibility }}/10</span>
                </span>
              </div>
              <p v-if="entry.note" class="journal-note">„{{ entry.note }}“</p>
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

export default {
  name: 'journal-list',
  components: { NavIcon },
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
        .map(b => ({ time: b.time, belief: b.belief, count: counts[b.time] }));
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
    this.revealRequested();
  },
  watch: {
    '$route.query.open': function() { this.revealRequested(); },
  },
  methods: {
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
    // The belief's own standing across every reading it has collected — this
    // entry's rating is one of them.
    beliefTruthOf(entry) {
      const b = this.beliefOf(entry);
      if (!b) return null;
      return beliefCredibility(this.$store.getters.patterns, b, this.$store.getters.journal);
    },
    // One decimal, German comma — the same rounding the list cards use.
    round(v) { return String(Math.round(v * 10) / 10).replace('.', ','); },
    dayLabel(time) {
      moment.locale('de');
      return moment(time).format('D. MMM').toUpperCase();
    },
    openBelief(entry) {
      if (!this.beliefOf(entry)) return;
      this.$router.push({ path: '/beliefs', query: openQuery(entry.beliefTime) });
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
        && (e.target.closest('.swipe-btn') || e.target.closest('.timeline-chip'))) return;
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

/* Same thread the Verlauf timeline draws through its dots. */
.timeline-row {
  position: relative;
  display: flex;
  gap: 14px;
  padding: 4px 20px 18px;
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
.head-swipe .swipe-handle { background: #000; }
.timeline-text {
  font-size: 1rem;
  color: #ebebf5;
  line-height: 1.45;
  margin: 0 0 8px;
}
.journal-meaning {
  font-size: 0.92rem;
  color: #8e8e93;
  line-height: 1.45;
  margin: 0 0 10px;
  font-style: italic;
}
.timeline-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.timeline-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1c1c1e;
  border: 1px solid #2c2c2e;
  border-radius: 999px;
  padding: 7px 13px;
  font-size: 0.85rem;
  color: #8e8e93;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
/* Old belief in grey, new affirmation in the app's accent — the same
   red/green convention the gap bar uses for expected vs. real. */
.fit-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 7px 13px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid currentColor;
  &.old { color: #8e8e93; }
  &.new { color: #4ade80; }
}
.fit-chip-score { opacity: 0.75; font-weight: 400; }
.timeline-chip-score { color: #636366; }
.journal-note {
  font-size: 0.85rem;
  color: #636366;
  line-height: 1.4;
  margin: 10px 0 0;
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
