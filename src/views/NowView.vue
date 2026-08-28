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
           the app. One way in — which of the two kinds it is, is the wizard's
           own first question, so it is not asked twice. -->
      <div class="capture-grid">
        <div class="capture-card capture-wide" @click="$router.push('/add-journal')">
          <svg class="capture-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path :d="journalIcon" fill="currentColor"></path>
          </svg>
          <p class="capture-title">Eintrag erfassen</p>
        </div>
      </div>

      <!-- A pause before the lists below ask anything of you. -->
      <p class="section-head">Komme an</p>
      <breath-circle></breath-circle>

      <div v-if="!topTileSection && !practiseSection && !trendRows.length" class="list-empty">
        <p class="list-empty-title">Nichts offen</p>
        <p class="list-empty-sub">Erfasse einen Eintrag, wenn dir etwas begegnet.</p>
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

      <!-- Then what has moved. One chip per belief, and one for all of them
           taken together. -->
      <template v-if="trendRows.length">
        <p class="section-head">Trends</p>

        <div class="pill-row">
          <button
            v-for="r in trendRows"
            :key="r.key"
            class="pill trend-pill"
            :class="{ active: r.key === shownTrendKey }"
            @click="pickTrend($event, r.key)"
          >{{ r.quoted ? `„${r.short}“` : r.short
          }}<span class="pill-count"> · {{ r.points.length }}</span></button>
        </div>

        <div v-if="shownTrend" class="card">
          <p class="card-title">{{ shownTrend.quoted ? `„${shownTrend.text}“` : shownTrend.text }}</p>
          <trend-chart :row="shownTrend"></trend-chart>
        </div>
      </template>

      <!-- Which beliefs keep turning up in the same moment. Counted from the
           entries, so it says what happened rather than what was expected. -->
      <template v-if="pairRows.length">
        <p class="section-head">Häufig zusammen genannt</p>

        <div v-for="pair in pairRows" :key="pair.key" class="card pair-card">
          <!-- Two rings: what each belief did without the other, and the
               overlap where the same moment named both. -->
          <svg class="venn" viewBox="0 0 200 124" role="img"
               :aria-label="vennLabel(pair)">
            <circle class="venn-ring venn-a" cx="75" cy="62" r="48"></circle>
            <circle class="venn-ring venn-b" cx="125" cy="62" r="48"></circle>
            <text class="venn-count" x="49" y="62">{{ pair.onlyA }}</text>
            <text class="venn-count venn-count-both" x="100" y="62">{{ pair.count }}</text>
            <text class="venn-count" x="151" y="62">{{ pair.onlyB }}</text>
          </svg>

          <p class="venn-key venn-key-a">„{{ pair.aText }}“</p>
          <p class="venn-key venn-key-b">„{{ pair.bText }}“</p>
          <p class="pair-count">{{ pairLabel(pair.count) }}, je {{ pair.onlyA }}× und
            {{ pair.onlyB }}× für sich</p>
        </div>
      </template>

      <!-- What the beliefs have in common, and the same material read back to
           you. Both are a look around, not a next step. -->
      <pattern-groups></pattern-groups>
      <empathy-block></empathy-block>

      <!-- Last of all: the tally across everything. It answers "what am I
           like", which is the least urgent question on this screen. -->
      <profile-stats></profile-stats>

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
      <v-btn flat color="grey" to="/journal">
        <nav-icon name="journal"></nav-icon>
      </v-btn>
      <v-btn flat color="grey" to="/beliefs">
        <nav-icon name="beliefs"></nav-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
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
  beliefCredibility, beliefRows, baselineOf, allBeliefPoints,
} from '@/utils/credibility';
import { beliefPairs } from '@/utils/beliefPairs';
import { alignPill } from '@/utils/pillScroll';
import { ACTION } from '@/utils/journalBeliefs';
import { mdiBookOpenPageVariant } from '@mdi/js';
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
// The chip that adds every belief up, rather than reading one of them.
const ALL_TRENDS = 'all';
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
    AffirmationPractice, NavIcon, TrendChart, ProfileStats, PatternGroups, EmpathyBlock,
    BreathCircle,
  },
  data() {
    return {
      practising: null, practised: readPractised(), now: Date.now(), trendKey: null,
    };
  },
  computed: {
    journalIcon() { return mdiBookOpenPageVariant; },
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
      const rows = beliefRows(this.patterns, this.beliefs, this.journal)
        .filter(r => r.hasTrend)
        .map(r => Object.assign({}, r, {
          short: shorten(r.text),
          quoted: true,
          // The frozen anchor the whole row is held against; where it stood
          // at each single reading is worked out per bar by the chart.
          baseline: baselineOf(r.points),
        }));
      // Only worth offering once there is more than one belief to add up: with
      // a single one the sum is that belief, said twice.
      if (rows.length < 2) return rows;
      const points = allBeliefPoints(this.patterns, this.beliefs, this.journal);
      rows.unshift({
        key: ALL_TRENDS,
        text: 'Alle Glaubenssätze',
        short: 'Alle Glaubenssätze',
        quoted: false,
        points: points,
        baseline: baselineOf(points),
        hasTrend: points.length > 1,
      });
      return rows;
    },
    // Pairs of beliefs the same entry named, most frequent first.
    pairRows() {
      return beliefPairs(this.beliefs, this.journal);
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
          // Evaluating happens in the Tagebuch, which owns that wizard.
          run: item => this.$router.push({
            path: '/journal',
            query: { open: String(item.row.experiment.id) },
          }),
          more: () => this.$router.push({
            path: '/journal',
            query: { type: ACTION, state: 'planned' },
          }),
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
          more: () => this.$router.push({ path: '/journal', query: { type: ACTION } }),
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
    pairLabel(n) {
      return n === 1 ? 'Einmal zusammen genannt' : `${n}× zusammen genannt`;
    },
    // What the picture says, for anyone who cannot see it.
    vennLabel(pair) {
      return `„${pair.aText}“ ${pair.onlyA}× allein, „${pair.bText}“ ${pair.onlyB}× allein, `
        + `${pair.count}× zusammen genannt`;
    },
    // Like the Tagebuch's chips: what is being read moves to the left edge.
    pickTrend(event, key) {
      this.trendKey = key;
      alignPill(event.currentTarget);
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
/* The two rings carry no fill of their own beyond a wash, so the lens where
   they cross is simply where both washes lie — the overlap draws itself. */
.venn {
  display: block;
  width: 100%;
  max-width: 260px;
  margin: 2px auto 12px;
  overflow: visible;
}
.venn-ring {
  stroke-width: 1.5;
  fill-opacity: 0.28;
}
.venn-a { fill: #c0483d; stroke: #c0483d; }
.venn-b { fill: #6aaef7; stroke: #6aaef7; }
.venn-count {
  fill: #fff;
  font-size: 15px;
  font-weight: 700;
  text-anchor: middle;
  dominant-baseline: central;
}
.venn-count-both { font-size: 17px; }
/* Each sentence in the colour of the ring it belongs to, so the picture and
   the words are read as one. */
.venn-key {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.venn-key + .venn-key { margin-top: 4px; }
.venn-key-a { color: #d98a82; }
.venn-key-b { color: #9ecbfa; }
.pair-count {
  margin: 10px 0 0;
  font-size: 0.78rem;
  color: #8e8e93;
}
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

/* The two actions that always apply, so they get the top of the screen —
   in one card, since which of the two it is, is the wizard's first question. */
.capture-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin: 4px 14px 0;
}
/* Alone in its row it reads better as a bar than as a tall tile. */
.capture-card.capture-wide {
  flex-direction: row;
  align-items: center;
}
.capture-card {
  background: #141416;
  border-radius: 18px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.7; }
}
.capture-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  color: #4ade80;
}
.capture-title {
  font-size: 0.95rem;
  font-weight: 500;
  color: #fff;
  line-height: 1.3;
  margin: 0;
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
