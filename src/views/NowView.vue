<template>
  <div class="dark-page">
    <v-content>
      <div class="screen-title-row">
        <h1 class="screen-title">Jetzt</h1>
        <div class="screen-actions">
          <button class="screen-add" @click="$router.push('/settings')" aria-label="Einstellungen">
            <v-icon color="#8e8e93">settings</v-icon>
          </button>
        </div>
      </div>

      <div v-if="!sections.length" class="list-empty">
        <span class="list-empty-icon">✅</span>
        <p class="list-empty-title">Nichts offen</p>
        <p class="list-empty-sub">Lege eine Situation an, wenn dir etwas begegnet.</p>
      </div>

      <!-- One block per kind of next step, one card per thing to do. A block
           with nothing in it is not shown at all: an empty list is not news. -->
      <template v-for="section in sections">
        <p :key="section.key + '-head'" class="section-head">
          {{ section.count }} {{ section.title }}
        </p>

        <div
          v-for="item in section.items"
          :key="item.key"
          class="card now-card"
          @click="section.run(item)"
        >
          <div class="now-line">
            <div class="now-body">
              <p class="now-title">{{ item.text }}</p>
              <p v-if="item.sub" class="now-sub">{{ item.sub }}</p>
            </div>
            <button class="now-btn" @click.stop="section.run(item)">{{ section.action }}</button>
          </div>
          <span v-if="item.chip" class="now-chip">{{ item.chip }}</span>
        </div>

        <!-- Only when there is more than the three shown. -->
        <div
          v-if="section.count > TOP"
          :key="section.key + '-more'"
          class="now-more"
          @click="section.more()"
        >
          <span>{{ section.count - TOP }} weitere anzeigen</span>
          <v-icon class="detail-chevron">chevron_right</v-icon>
        </div>
      </template>

      <!-- Last, and deliberately so: everything above is what to do next,
           this is what has moved so far. One chart at a time — a wall of them
           is a report, and nobody reads a report on their phone. -->
      <template v-if="trendRows.length">
        <p class="section-head">Trends</p>

        <div class="pill-row">
          <button
            v-for="r in trendRows"
            :key="r.key"
            class="pill trend-pill"
            :class="{ active: r.key === shownTrendKey }"
            @click="trendKey = r.key"
          >{{ r.short }}<span class="pill-count"> · {{ r.points.length }}</span></button>
        </div>

        <div class="card">
          <p class="card-title">„{{ shownTrend.text }}“</p>
          <p class="now-sub trend-kind">{{ shownTrend.kind }}</p>
          <trend-chart :row="shownTrend" :inverted="shownTrend.inverted"></trend-chart>
        </div>
      </template>

      <!-- What keeps coming up across everything, under the trends: the same
           look back, one level wider. -->
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
      <v-btn flat color="grey" to="/patterns">
        <nav-icon name="patterns"></nav-icon>
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
import AffirmationPractice from '@/components/AffirmationPractice.vue';
import { beliefStatus } from '@/utils/beliefStatus';
import {
  collectExperiments,
  experimentDisplayState,
  experimentsOf,
  isPlanned,
  isDue,
  experimentState,
} from '@/utils/experiment';
import {
  affirmationCredibility, beliefCredibility, beliefRows, affirmationRows,
} from '@/utils/credibility';
import NavIcon from '@/components/NavIcon.vue';
import TrendChart from '@/components/TrendChart.vue';
import ProfileStats from '@/components/ProfileStats.vue';

// Three is enough to start on; the rest is one tap away in the list that owns
// them. Showing everything would turn this screen back into those lists.
const TOP = 3;
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
    AffirmationPractice, NavIcon, TrendChart, ProfileStats,
  },
  data() {
    return {
      practising: null, practised: readPractised(), now: Date.now(), trendKey: null,
    };
  },
  computed: {
    TOP() { return TOP; },
    beliefs() { return this.$store.getters.beliefs; },
    patterns() { return this.$store.getters.patterns; },
    rows() { return collectExperiments(this.beliefs); },
    // Most believed first: the belief you hold hardest is the one worth
    // touching next.
    byStatus() {
      const patterns = this.patterns;
      const out = { open: [], working: [], done: [] };
      this.beliefs.forEach((b) => {
        const bucket = out[beliefStatus(b)];
        if (bucket) bucket.push(b);
      });
      Object.keys(out).forEach((k) => {
        out[k].sort((a, b) => {
          const ca = beliefCredibility(patterns, a);
          const cb = beliefCredibility(patterns, b);
          return (cb === null ? -1 : cb) - (ca === null ? -1 : ca);
        });
      });
      return out;
    },
    // Every sentence that exists, least believed first — the one you believe
    // least is the one most worth saying again.
    affirmations() {
      const map = {};
      this.beliefs.forEach((b) => {
        (b.affirmations || []).forEach((a) => {
          if (!a || !a.text || map[a.text]) return;
          map[a.text] = {
            text: a.text,
            feelings: ((b.reflection || {}).withoutBeliefFeelings) || [],
            needs: b.needs || [],
            credibility: affirmationCredibility(this.beliefs, a.text),
          };
        });
      });
      return Object.values(map).sort((a, b) => {
        const ca = a.credibility === null ? Infinity : a.credibility;
        const cb = b.credibility === null ? Infinity : b.credibility;
        return ca - cb;
      });
    },
    // Nothing to show until something has been rated twice; one reading is a
    // number, not a trend. Beliefs first — that is the scale the rest of the
    // screen is about.
    trendRows() {
      const shorten = t => (t.length > 28 ? `${t.slice(0, 27)}…` : t);
      const beliefs = beliefRows(this.patterns, this.beliefs)
        .filter(r => r.hasTrend)
        .map(r => Object.assign({}, r, {
          key: `b${r.key}`,
          kind: 'Überzeugung',
          inverted: false,
          short: shorten(r.text),
        }));
      const affirmations = affirmationRows(this.beliefs)
        .filter(r => r.hasTrend)
        .map(r => Object.assign({}, r, {
          key: `a${r.key}`,
          kind: 'Affirmation',
          inverted: true,
          short: shorten(r.text),
        }));
      return beliefs.concat(affirmations);
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
        const c = beliefCredibility(this.patterns, b);
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
          text: a.text,
          // No overdue chip here: an affirmation is not a deadline, and the
          // sub-line already says when it was last said.
          sub: `Affirmation · ${this.sinceLabel(days)}`,
          aff: a,
        };
      };
      const experiment = r => ({
        key: `x${r.experiment.id}`,
        text: r.experiment.situation || r.beliefText,
        sub: `Handlung · „${r.beliefText}“`,
        row: r,
      });
      const run = list => list.slice(0, TOP);
      const all = [
        {
          key: 'evaluate',
          title: 'geplante Handlungen auswerten',
          action: 'Auswerten',
          count: this.plannedExperiments.length,
          items: run(this.plannedExperiments).map(r => Object.assign(experiment(r), {
            // isDue is the same seven-day mark the Handlungen list uses.
            chip: isDue(r.experiment, this.now) ? 'überfällig' : null,
          })),
          // Evaluating happens in the Handlungen list, which owns that wizard.
          run: item => this.$router.push({
            path: '/actions',
            query: { open: String(item.row.experiment.id) },
          }),
          more: () => this.$router.push({ path: '/actions', query: { tab: 'planned' } }),
        },
        {
          key: 'plan',
          title: 'neue Handlungen planen',
          action: 'Planen',
          count: this.openExperiments.length,
          items: run(this.openExperiments).map(experiment),
          run: item => this.$router.push(
            `/act-belief/${item.row.beliefTime}/${item.row.experiment.id}`,
          ),
          more: () => this.$router.push({ path: '/actions', query: { tab: 'open' } }),
        },
        {
          key: 'act',
          title: 'gewandelte Überzeugungen handeln',
          action: 'Handeln',
          count: this.byStatus.done.length,
          items: run(this.byStatus.done).map(b => belief(b)),
          run: item => this.$router.push(`/act-belief/${item.entry.time}`),
          more: () => this.$router.push({ path: '/beliefs', query: { tab: 'done' } }),
        },
        {
          key: 'practise',
          title: this.affirmations.length === 1 ? 'Affirmation üben' : 'Affirmationen üben',
          action: 'Üben',
          count: this.affirmations.length,
          items: run(this.affirmations).map(affirmation),
          run: item => this.startPractice(item.aff),
          more: () => this.$router.push('/beliefs'),
        },
        {
          key: 'change',
          title: 'ergründete Überzeugungen wandeln',
          action: 'Wandeln',
          count: this.byStatus.working.length,
          items: run(this.byStatus.working).map(b => belief(b)),
          run: item => this.$router.push(`/change-belief/${item.entry.time}`),
          more: () => this.$router.push({ path: '/beliefs', query: { tab: 'working' } }),
        },
        {
          key: 'explore',
          title: 'neue Überzeugungen ergründen',
          action: 'Ergründen',
          count: this.byStatus.open.length,
          items: run(this.byStatus.open).map(b => belief(b)),
          run: item => this.$router.push(`/edit-belief/${item.entry.time}`),
          more: () => this.$router.push({ path: '/beliefs', query: { tab: 'open' } }),
        },
      ];
      return all.filter(s => s.count > 0);
    },
  },
  methods: {
    round(v) { return String(Math.round(v * 10) / 10).replace('.', ','); },
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

.now-card {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.7; }
}
.now-line {
  display: flex;
  align-items: center;
  gap: 14px;
}
.now-body { flex: 1; min-width: 0; }
.now-title {
  font-size: 1.05rem;
  font-weight: 400;
  color: #fff;
  line-height: 1.35;
  margin: 0;
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
.now-chip {
  display: inline-block;
  margin-top: 12px;
  border: 1px solid #fd9927;
  border-radius: 8px;
  color: #fd9927;
  font-size: 0.85rem;
  padding: 5px 12px;
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
