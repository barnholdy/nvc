<template>
  <div class="dark-page">
    <v-content>
      <div class="screen-title-row">
        <h1 class="screen-title">Verlauf</h1>
        <div class="screen-actions">
          <button class="screen-add" @click="$router.push('/add-pattern')" aria-label="Neue Situation">+</button>
          <button class="screen-add" @click="$router.push('/settings')" aria-label="Einstellungen">
            <v-icon color="#8e8e93">settings</v-icon>
          </button>
        </div>
      </div>

      <!-- Filtering by belief rather than by state: this screen is a record of
           what happened, and the question it answers is which belief keeps
           turning up. -->
      <div class="pill-row">
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

      <div v-if="!filtered.length" class="list-empty">
        <span class="list-empty-icon">⚡</span>
        <p class="list-empty-title">Noch keine Situationen</p>
        <p class="list-empty-sub">Tippe auf + um eine neue Situation hinzuzufügen.</p>
      </div>

      <template v-else>
        <!-- What this month actually looked like. The belief cards count every
             situation ever; this counts only the ones just recorded, which is a
             different question and the reason this card exists. -->
        <div v-if="summary" class="card summary-card">
          <p class="summary-head">{{ summary.month }} · {{ summary.total }} {{ summary.total === 1 ? 'Situation' : 'Situationen' }} erfasst</p>
          <p class="summary-claim">„{{ summary.top.belief }}“ taucht in {{ summary.top.count }} von {{ summary.total }} auf.</p>
          <div v-for="row in summary.rows" :key="row.time" class="summary-row">
            <span class="summary-belief">„{{ row.belief }}“</span>
            <span class="summary-track">
              <span class="summary-fill" :style="{ width: barWidth(row.count, summary.top.count) }"></span>
            </span>
            <span class="summary-count">{{ row.count }}</span>
          </div>
        </div>

        <template v-for="group in groups">
          <p :key="group.key" class="month-head">{{ group.label }}</p>

          <div
            v-for="entry in group.entries"
            :key="entry.time"
            :data-row-id="entry.time"
          >
            <div class="timeline-row">
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
                  >{{ entry.trigger }}</p>
                </div>
                <div v-if="beliefFilter === null" class="timeline-chips">
                  <span
                    v-for="b in beliefsOf(entry)"
                    :key="b.time"
                    class="timeline-chip"
                    @click.stop="openBelief(b)"
                  >
                    „{{ b.belief }}“
                    <span v-if="truthOf(entry, b) !== null" class="timeline-chip-score">
                      {{ truthOf(entry, b) }}/10
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
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
        <v-icon>schedule</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/patterns">
        <v-icon>bolt</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/beliefs">
        <v-icon>lightbulb_outline</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/actions">
        <v-icon>gps_fixed</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import moment from 'moment';
import { isComplete } from '@/utils/beliefStatus';
import { beliefTruthIn, beliefCredibility } from '@/utils/credibility';
import { openQuery, requestedId, scrollRowIntoView } from '@/utils/reveal';

export default {
  name: 'pattern-list',
  data() {
    return {
      beliefFilter: null,
      entryToDelete: null,
      isDeleteDialogShowing: false,
      sw: { openKey: null, handleHeight: 0, openDir: null, touchKey: null, startX: 0, startY: 0, dx: 0, isH: null, drag: false },
    };
  },
  computed: {
    // The panels reach only as far down as the part that answers the
    // swipe, so a tall card does not get a full-height slab behind it.
    panelStyle() {
      return this.sw.handleHeight ? { height: `${this.sw.handleHeight}px` } : null;
    },
    patterns() {
      return this.$store.getters.patterns.concat().sort((a, b) => b.time - a.time);
    },
    filtered() {
      if (this.beliefFilter === null) return this.patterns;
      return this.patterns.filter(p => (p.beliefs || []).indexOf(this.beliefFilter) !== -1);
    },
    // Only beliefs that actually appear in a situation can filter one.
    filterBeliefs() {
      const seen = {};
      this.patterns.forEach((p) => { (p.beliefs || []).forEach((id) => { seen[id] = true; }); });
      const patterns = this.$store.getters.patterns;
      return this.$store.getters.beliefs
        .filter(b => seen[b.time])
        .map(b => Object.assign({}, b, {
          truth: beliefCredibility(patterns, b),
          // How many situations it turns up in — the same reading the state
          // chips give, so both rows of chips answer the same question.
          count: this.patterns.filter(pt => (pt.beliefs || []).indexOf(b.time) !== -1).length,
        }));
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
    // The most recent month with anything in it, counted by belief.
    summary() {
      const first = this.groups[0];
      if (!first || !first.entries.length) return null;
      const counts = {};
      first.entries.forEach((entry) => {
        (entry.beliefs || []).forEach((id) => { counts[id] = (counts[id] || 0) + 1; });
      });
      const beliefs = this.$store.getters.beliefs;
      const rows = Object.keys(counts)
        .map((id) => {
          const b = beliefs.find(x => String(x.time) === String(id));
          return b ? { time: b.time, belief: b.belief, count: counts[id] } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.count - a.count);
      if (!rows.length) return null;
      moment.locale('de');
      return {
        month: moment(first.entries[0].time).format('MMMM'),
        total: first.entries.length,
        rows,
        top: rows[0],
      };
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
    isSwiping(key) { return this.sw.openKey === key || this.sw.touchKey === key; },
    revealRequested() {
      const id = requestedId(this.$route);
      if (!id) return;
      if (!this.patterns.some(p => String(p.time) === id)) return;
      this.beliefFilter = null;
      this.$nextTick(() => scrollRowIntoView(this.$el, id));
    },
    // One decimal, and a German comma: the headline number is the only
    // place this value is shown, so rounding it whole would hide half a
    // point that was actually recorded.
    round(v) {
      if (v === null || v === undefined) return '';
      return String(Math.round(v * 10) / 10).replace('.', ',');
    },
    beliefsOf(entry) {
      const beliefs = this.$store.getters.beliefs;
      return (entry.beliefs || []).map(id => beliefs.find(b => b.time === id)).filter(Boolean);
    },
    // A situation whose beliefs have not been worked through yet is worth
    // marking: it is the open end of the record.
    isExplored(entry) {
      const list = this.beliefsOf(entry);
      return list.length > 0 && list.every(isComplete);
    },
    truthOf(entry, belief) { return beliefTruthIn(entry, belief); },
    barWidth(count, max) {
      return `${max ? Math.max(6, (count / max) * 100) : 0}%`;
    },
    dayLabel(time) {
      moment.locale('de');
      return moment(time).format('D. MMM').toUpperCase();
    },
    openBelief(belief) {
      this.sw.openKey = null; this.sw.openDir = null;
      this.$router.push({ path: '/beliefs', query: openQuery(belief.time) });
    },
    editEntry(entry) { this.sw.openKey = null; this.sw.openDir = null; this.$router.push(`/edit-pattern/${entry.time}`); },
    preDelete(entry) { this.sw.openKey = null; this.sw.openDir = null; this.entryToDelete = entry; this.isDeleteDialogShowing = true; },
    confirmDelete() {
      this.isDeleteDialogShowing = false;
      this.$store.dispatch('deletePattern', this.entryToDelete);
      this.entryToDelete = null;
    },
    cancelDelete() { this.isDeleteDialogShowing = false; this.entryToDelete = null; },
    // Keyed by the entry rather than its index: the timeline is grouped, so an
    // index within a group would collide across months.
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

.summary-card { padding-bottom: 16px; }
.summary-head { font-size: 0.9rem; color: #8e8e93; margin: 0 0 10px; }
.summary-claim {
  font-size: 1.15rem;
  color: #fff;
  line-height: 1.35;
  margin: 0 0 16px;
  font-weight: 500;
}
.summary-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.summary-belief {
  flex: 1;
  min-width: 0;
  font-size: 0.95rem;
  color: #ebebf5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.summary-track {
  width: 90px;
  height: 6px;
  border-radius: 999px;
  background: #2c2c2e;
  flex-shrink: 0;
  overflow: hidden;
}
.summary-fill { display: block; height: 100%; background: #48484a; border-radius: 999px; }
.summary-count { width: 18px; text-align: right; font-size: 0.9rem; color: #8e8e93; flex-shrink: 0; }

.month-head {
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: #636366;
  font-weight: 600;
  margin: 18px 0 10px;
  padding: 0 20px;
}


/* The line runs through the dots, so the entries read as one thread rather
   than as separate cards. */
.timeline-row {
  position: relative;
  display: flex;
  gap: 14px;
  padding: 4px 20px 18px;
  background: #000;
  /* The thread runs inside the entry only. Drawn from the dot as one long
     line it carried on straight through the month headings between them. */
  &::before {
    content: '';
    position: absolute;
    left: 24px;
    top: 17px;
    bottom: 0;
    width: 1px;
    background: #2c2c2e;
  }
  &:last-child::before { display: none; }
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
  margin: 0 0 10px;
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
.timeline-chip-score { color: #636366; }

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
