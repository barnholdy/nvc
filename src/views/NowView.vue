<template>
  <div class="dark-page">
    <v-content>
      <div class="screen-header">
        <div class="screen-title-row">
          <h1 class="screen-title">Jetzt</h1>
          <div class="screen-actions">
            <button class="screen-add" @click="$router.push('/settings')" aria-label="Einstellungen">
              <v-icon color="#8e8e93">settings</v-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Above everything, and always there: writing down what just happened
           is the one thing that does not depend on anything already being in
           the app. -->
      <div class="card capture-card" @click="$router.push('/add-pattern')">
        <svg class="capture-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path :d="captureIcon" fill="currentColor"></path>
        </svg>
        <div class="capture-body">
          <p class="capture-title">Situation erfassen</p>
          <p class="capture-sub">Was ist dir gerade begegnet?</p>
        </div>
        <v-icon class="detail-chevron">chevron_right</v-icon>
      </div>

      <!-- A pause before the lists below ask anything of you. -->
      <p class="section-head">Komme an</p>
      <breath-circle></breath-circle>

      <div v-if="!topTileSection && !practiseSection && !trendRows.length" class="list-empty">
        <p class="list-empty-title">Nichts offen</p>
        <p class="list-empty-sub">Lege eine Situation an, wenn dir etwas begegnet.</p>
      </div>

      <!-- Affirmations first: saying one again is the lightest next step, and
           just the one that has waited longest, not a grid to choose from. -->
      <template v-if="practiseSection">
        <p class="section-head">{{ practiseSection.title }}</p>
        <div class="practise-grid">
          <div
            v-for="item in practiseSection.items"
            :key="item.key"
            class="card practise-card practise-card-wide"
            @click="practiseSection.run(item)"
          >
            <div class="aff-box practise-aff">
              <p class="aff-label">Affirmation</p>
              <p class="aff-text">{{ item.text }}</p>
            </div>
            <p class="now-sub">{{ item.sub }}</p>
            <button
              class="now-btn"
              @click.stop="practiseSection.run(item)"
            >{{ practiseSection.action }}</button>
          </div>
        </div>

        <!-- Only when there is more than what is shown. -->
        <div
          v-if="practiseSection.count > practiseSection.top"
          class="now-more"
          @click="practiseSection.more()"
        >
          <span>{{ practiseSection.count - practiseSection.top }} weitere anzeigen</span>
          <v-icon class="detail-chevron">chevron_right</v-icon>
        </div>
      </template>

      <!-- What to do next otherwise — just the one nearest step, not all five
           at once: whichever kind comes first in the section order below.
           Which belief or action to work on is picked in the list the tile
           opens, not previewed here. -->
      <template v-if="topTileSection">
        <p class="section-head">Handlungen &amp; Überzeugungen</p>
        <div class="tile-grid">
          <div
            class="tile-card tile-card-wide"
            @click="topTileSection.more()"
          >
            <div class="tile-top">
              <p class="tile-label">{{ topTileSection.tileLabel }}</p>
              <v-icon class="detail-chevron">chevron_right</v-icon>
            </div>
            <p class="tile-count">
              <span class="tile-number">{{ topTileSection.count }}</span>
              <span class="tile-action">{{ topTileSection.action }}</span>
            </p>
          </div>
        </div>
      </template>

      <!-- Then what has moved. One chip per belief: an affirmation is read on
           the opposite scale, so mixing both in here only invites reading a
           bar the wrong way round. -->
      <template v-if="trendRows.length">
        <p class="section-head">Trends</p>

        <div class="pill-row">
          <button
            v-for="r in trendRows"
            :key="r.key"
            class="pill trend-pill"
            :class="{ active: r.key === shownTrendKey }"
            @click="trendKey = r.key"
          >„{{ r.short }}“<span class="pill-count"> · {{ r.points.length }}</span></button>
        </div>

        <div v-if="shownTrend" class="card">
          <p class="card-title">„{{ shownTrend.text }}“</p>
          <div v-if="shownTrend.standing !== null" class="score-row">
            <div class="score-main">
              <span class="score-value">{{ round(shownTrend.standing) }}</span>
              <span class="score-max">/10</span>
              <span class="score-label">Glaubwürdigkeit</span>
            </div>
            <div v-if="trendOf(shownTrend)" class="score-side">
              <span
                class="score-trend"
                :style="{ color: trendOf(shownTrend).color }"
              >{{ trendOf(shownTrend).text }}</span>
            </div>
          </div>
          <trend-chart :row="shownTrend"></trend-chart>
        </div>
      </template>

      <profile-stats></profile-stats>

      <!-- Last: what the beliefs have in common, and the same material read
           back to you. Both are a look around, not a next step. -->
      <pattern-groups></pattern-groups>
      <empathy-block></empathy-block>

      <div class="list-bottom-space"></div>
    </v-content>

    <affirmation-practice
      v-if="practising"
      :text="practising.text"
      :feelings="practising.feelings"
      :needs="practising.needs"
      @close="practising = null"
    ></affirmation-practice>

    <v-bottom-nav :value="true" fixed app color="#1c1c1e" class="dark-nav">
      <v-btn flat color="primary" to="/now">
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
      <v-btn flat color="grey" to="/journal">
        <nav-icon name="journal"></nav-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import moment from 'moment';
import AffirmationPractice from '@/components/AffirmationPractice.vue';
import { beliefStatus } from '@/utils/beliefStatus';
import {
  collectExperiments,
  experimentDisplayState,
  experimentsOf,
  isPlanned,
  experimentState,
} from '@/utils/experiment';
import {
  beliefCredibility, beliefRows, baselineOf, standingOf,
} from '@/utils/credibility';
import { deltaColor } from '@/utils/beliefTrend';
import { mdiLightningBolt } from '@mdi/js';
import NavIcon from '@/components/NavIcon.vue';
import TrendChart from '@/components/TrendChart.vue';
import ProfileStats from '@/components/ProfileStats.vue';
import PatternGroups from '@/components/PatternGroups.vue';
import EmpathyBlock from '@/components/EmpathyBlock.vue';
import BreathCircle from '@/components/BreathCircle.vue';

// The rest is one tap away in the list that owns it. The five belief and
// action blocks, and the affirmation to practise, are all narrowed to just
// the one nearest thing now — a single next step, not a list to choose from.
const ONE = 1;
const PRACTICE_KEY = 'nvc.amen';
const DAY_MS = 24 * 60 * 60 * 1000;

function readPractised() {
  try {
    return JSON.parse(localStorage.getItem(PRACTICE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

export default {
  name: 'now-view',
  components: {
    AffirmationPractice, NavIcon, TrendChart, ProfileStats, PatternGroups, EmpathyBlock, BreathCircle,
  },
  data() {
    return {
      practising: null, practised: readPractised(), now: Date.now(), trendKey: null,
    };
  },
  computed: {
    // A situation is the moment something struck — the bolt this app used for
    // Situationen before the nav went to a history icon.
    captureIcon() { return mdiLightningBolt; },
    beliefs() { return this.$store.getters.beliefs; },
    patterns() { return this.$store.getters.patterns; },
    journal() { return this.$store.getters.journal; },
    rows() { return collectExperiments(this.beliefs); },
    // Most believed first: the belief you hold hardest is the one worth
    // touching next.
    byStatus() {
      const patterns = this.patterns;
      const journal = this.journal;
      const out = { open: [], working: [], done: [] };
      this.beliefs.forEach((b) => {
        const bucket = out[beliefStatus(b)];
        if (bucket) bucket.push(b);
      });
      Object.keys(out).forEach((k) => {
        out[k].sort((a, b) => {
          const ca = beliefCredibility(patterns, a, journal);
          const cb = beliefCredibility(patterns, b, journal);
          return (cb === null ? -1 : cb) - (ca === null ? -1 : ca);
        });
      });
      return out;
    },
    // Every sentence that exists, least believed first — the one you believe
    // least recently said is the one most worth saying again.
    // Only from beliefs that have actually been transformed: an affirmation
    // written earlier in the process belongs to the wandeln wizard that wrote
    // it, not to this list of sentences worth practising.
    affirmations() {
      const map = {};
      this.beliefs.filter(b => beliefStatus(b) === 'done').forEach((b) => {
        (b.affirmations || []).forEach((a) => {
          if (!a || !a.text || map[a.text]) return;
          map[a.text] = {
            text: a.text,
            feelings: ((b.reflection || {}).withoutBeliefFeelings) || [],
            needs: b.needs || [],
          };
        });
      });
      // Never practised sorts first — longer ago than any real gap could be.
      return Object.values(map).sort((a, b) => {
        const la = this.practised[a.text] || 0;
        const lb = this.practised[b.text] || 0;
        return la - lb;
      });
    },
    // Nothing to show until something has been rated twice; one reading is a
    // number, not a trend. Situations, evaluated actions and journal entries
    // all rate the same belief on the same scale, so they share a chart.
    trendRows() {
      const shorten = t => (t.length > 28 ? `${t.slice(0, 27)}…` : t);
      return beliefRows(this.patterns, this.beliefs, this.journal)
        .filter(r => r.hasTrend)
        .map(r => Object.assign({}, r, {
          short: shorten(r.text),
          standing: standingOf(r.points),
          baseline: baselineOf(r.points),
        }));
    },
    // The chosen chip, or the first one — a chip that vanished (a rating
    // undone elsewhere) must not leave the block blank.
    shownTrendKey() {
      const rows = this.trendRows;
      if (!rows.length) return null;
      return rows.some(r => r.key === this.trendKey) ? this.trendKey : rows[0].key;
    },
    shownTrend() {
      return this.trendRows.find(r => r.key === this.shownTrendKey) || null;
    },
    openExperiments() {
      return this.rows.filter(r => experimentState(r.experiment) !== 'evaluated'
        && !isPlanned(r.experiment));
    },
    plannedExperiments() {
      return this.rows.filter(r => experimentDisplayState(r.experiment) === 'planned');
    },
    sections() {
      const belief = (b) => {
        const c = beliefCredibility(this.patterns, b, this.journal);
        return {
          key: `b${b.time}`,
          text: `„${b.belief}“`,
          sub: c === null
            ? 'Überzeugung · noch nicht bewertet'
            : `Überzeugung · ${this.round(c)}/10 Glaubwürdigkeit`,
          entry: b,
        };
      };
      const affirmation = (a) => {
        const last = this.practised[a.text];
        const days = last ? Math.floor((this.now - last) / DAY_MS) : null;
        return {
          key: `a${a.text}`,
          text: `„${a.text}“`,
          // No overdue chip here: an affirmation is not a deadline, and the
          // sub-line already says when it was last said. No "Affirmation ·"
          // prefix either — the grid sits under its own heading, which
          // already says what these are.
          sub: this.sinceLabel(days),
          aff: a,
        };
      };
      const experiment = r => ({
        key: `x${r.experiment.id}`,
        text: r.experiment.situation || r.beliefText,
        sub: `Handlung · „${r.beliefText}“`,
        row: r,
      });
      const all = [
        {
          key: 'evaluate',
          top: ONE,
          title: 'geplante Handlungen auswerten',
          tileLabel: 'Geplante Handlungen',
          action: 'Auswerten',
          count: this.plannedExperiments.length,
          items: this.plannedExperiments.map(experiment),
          // Evaluating happens in the Handlungen list, which owns that wizard.
          run: item => this.$router.push({
            path: '/actions',
            query: { open: String(item.row.experiment.id) },
          }),
          more: () => this.$router.push({ path: '/actions', query: { tab: 'planned' } }),
        },
        {
          key: 'plan',
          top: ONE,
          title: 'neue Handlungen planen',
          tileLabel: 'Neue Handlungen',
          action: 'Planen',
          count: this.openExperiments.length,
          items: this.openExperiments.map(experiment),
          run: item => this.$router.push(
            `/act-belief/${item.row.beliefTime}/${item.row.experiment.id}`,
          ),
          more: () => this.$router.push({ path: '/actions', query: { tab: 'open' } }),
        },
        {
          key: 'act',
          top: ONE,
          title: 'gewandelte Überzeugungen handeln',
          tileLabel: 'Gewandelte Überzeugungen',
          action: 'Handeln',
          count: this.byStatus.done.length,
          items: this.byStatus.done.map(b => belief(b)),
          run: item => this.$router.push(`/act-belief/${item.entry.time}`),
          more: () => this.$router.push({ path: '/beliefs', query: { tab: 'done' } }),
        },
        {
          key: 'practise',
          top: ONE,
          title: 'Affirmation üben',
          action: 'Üben',
          count: this.affirmations.length,
          items: this.affirmations.map(affirmation),
          run: item => this.startPractice(item.aff),
          more: () => this.$router.push({ path: '/beliefs', query: { tab: 'done' } }),
        },
        {
          key: 'change',
          top: ONE,
          title: 'ergründete Überzeugungen wandeln',
          tileLabel: 'Ergründete Überzeugungen',
          action: 'Wandeln',
          count: this.byStatus.working.length,
          items: this.byStatus.working.map(b => belief(b)),
          run: item => this.$router.push(`/change-belief/${item.entry.time}`),
          more: () => this.$router.push({ path: '/beliefs', query: { tab: 'working' } }),
        },
        {
          key: 'explore',
          top: ONE,
          title: 'neue Überzeugungen ergründen',
          tileLabel: 'Neue Überzeugungen',
          action: 'Ergründen',
          count: this.byStatus.open.length,
          items: this.byStatus.open.map(b => belief(b)),
          run: item => this.$router.push(`/edit-belief/${item.entry.time}`),
          more: () => this.$router.push({ path: '/beliefs', query: { tab: 'open' } }),
        },
      ];
      // Cut to size here, once, rather than at every call site.
      return all
        .filter(x => x.count > 0)
        .map(x => Object.assign({}, x, { items: x.items.slice(0, x.top) }));
    },
    // The five belief and action blocks, in the order above.
    tileSections() {
      return this.sections.filter(s => s.key !== 'practise');
    },
    // Only the nearest one is shown — the first that actually has something
    // in it, in that same order.
    topTileSection() {
      return this.tileSections[0] || null;
    },
    // Affirmations, rendered as a grid — kept apart because picking which
    // sentence to say again is the point, not a count.
    practiseSection() {
      return this.sections.find(s => s.key === 'practise') || null;
    },
  },
  methods: {
    round(v) { return String(Math.round(v * 10) / 10).replace('.', ','); },
    // The current standing held against the frozen anchor, the same
    // comparison the Überzeugungen list shows under its own headline number.
    trendOf(row) {
      if (!row || row.baseline === null || row.standing === null) return null;
      const delta = Math.round((row.standing - row.baseline) * 10) / 10;
      if (delta === 0) return null;
      moment.locale('de');
      const sign = delta > 0 ? '+' : '−';
      const shown = String(Math.abs(delta)).replace('.', ',');
      return {
        text: `${sign}${shown} seit ${moment(row.points[0].time).format('MMMM')}`,
        color: deltaColor(delta),
      };
    },
    sinceLabel(days) {
      if (days === null) return 'noch nie geübt';
      if (days <= 0) return 'heute geübt';
      if (days === 1) return 'gestern geübt';
      return `zuletzt geübt vor ${days} Tagen`;
    },
    startPractice(aff) {
      this.practising = { text: aff.text, feelings: aff.feelings, needs: aff.needs };
      const at = Date.now();
      // Kept in sync locally so the sub-line updates the moment you close the
      // practice, without a reload.
      this.practised = Object.assign({}, this.practised, { [aff.text]: at });
      try {
        const map = JSON.parse(localStorage.getItem(PRACTICE_KEY)) || {};
        map[aff.text] = at;
        localStorage.setItem(PRACTICE_KEY, JSON.stringify(map));
      } catch (e) { /* a full or blocked store must not stop the practice */ }
    },
    experimentsOf(b) { return experimentsOf(b); },
  },
};
</script>

<style scoped lang="scss">
.dark-page { background: #000; min-height: 100vh; }

/* Small grey capitals: the heading names the pile, the cards below are the
   things in it. */
.section-head {
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8e8e93;
  margin: 18px 20px 8px;
}

/* The one action that always applies, so it gets the full width and sits
   above every count. */
.capture-card {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 4px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.7; }
}
.capture-icon {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  color: #4ade80;
}
.capture-body { flex: 1; min-width: 0; }
.capture-title {
  font-size: 1.05rem;
  font-weight: 500;
  color: #fff;
  line-height: 1.3;
  margin: 0;
}
.capture-sub {
  font-size: 0.88rem;
  color: #8e8e93;
  margin: 3px 0 0;
}

/* Two-column count tiles: a label, a number, the verb that acts on it — no
   item preview, because picking which one happens in the list the tile
   opens. */
.tile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 0 14px 12px;
}
.tile-card {
  background: #141416;
  border-radius: 18px;
  padding: 16px 16px 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.7; }
  /* Without this a grid column widens to fit whatever its content asks for —
     a long label word, an icon before its font has loaded — and pushes the
     second column off the screen. */
  min-width: 0;
}
/* Only one tile shows now, so it takes the row the grid would otherwise
   split between two — same padding and line-heights, just the full width. */
.tile-card-wide { grid-column: 1 / -1; }
.tile-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
}
.tile-label {
  font-size: 0.85rem;
  color: #8e8e93;
  line-height: 1.3;
  margin: 0;
  min-width: 0;
  /* Reserves two lines so a one-line label does not leave a shorter tile
     than its neighbour. */
  min-height: 2.6em;
}
.tile-count {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 14px 0 0;
}
.tile-number {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}
.tile-action {
  font-size: 1rem;
  color: #fff;
  font-weight: 500;
}

/* Card grid the tiles above also use — only one affirmation ever lands in
   it now, so it always takes the full width. */
.practise-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 0 14px 4px;
}
.practise-card-wide { grid-column: 1 / -1; }
.practise-card {
  margin: 0;
  min-width: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.7; }
}
.practise-aff { margin-bottom: 8px; }
.practise-card .now-sub {
  white-space: normal;
  margin-bottom: 12px;
}

.now-sub {
  font-size: 0.88rem;
  color: #8e8e93;
  margin: 4px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.now-btn {
  flex-shrink: 0;
  background: none;
  border: 1px solid #4ade80;
  border-radius: 999px;
  color: #4ade80;
  font-family: inherit;
  font-size: 0.95rem;
  padding: 9px 20px;
  cursor: pointer;
}
/* A belief is a sentence, so its chip needs a ceiling or one chip fills the
   whole row. */
.trend-pill {
  max-width: 62vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}
.trend-kind {
  margin-top: 2px;
}
.now-more {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  margin: -2px 20px 12px;
  font-size: 0.9rem;
  color: #8e8e93;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.dark-nav {
  border-top: 1px solid #2c2c2e;
  .v-btn { min-width: 0; }
}
</style>
