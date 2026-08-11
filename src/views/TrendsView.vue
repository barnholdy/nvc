<template>
  <div class="dark-page">
    <v-content>
      <div class="screen-title-row">
        <h1 class="screen-title">Trends</h1>
        <div class="screen-actions">
          <button class="screen-add" @click="$router.back()" aria-label="Zurück">
            <v-icon color="#8e8e93">close</v-icon>
          </button>
        </div>
      </div>

      <!-- The same two-way split the rest of the app uses for filters. -->
      <div class="pill-row">
        <button
          class="pill"
          :class="{ active: tab === 'beliefs' }"
          @click="tab = 'beliefs'"
        >Überzeugungen<span class="pill-count"> · {{ beliefCount }}</span></button>
        <button
          class="pill"
          :class="{ active: tab === 'affirmations' }"
          @click="tab = 'affirmations'"
        >Affirmationen<span class="pill-count"> · {{ affirmationCount }}</span></button>
      </div>

      <div v-if="!rows.length" class="list-empty">
        <span class="list-empty-icon">📉</span>
        <p class="list-empty-title">Noch keine Bewertungen</p>
        <p class="list-empty-sub">{{ emptyText }}</p>
      </div>

      <template v-else>
        <p class="section-head">{{ trendCount }} mit Verlauf · {{ rows.length }} bewertet</p>

        <div v-for="row in rows" :key="row.key" class="card">
          <p class="card-title">„{{ row.text }}“</p>

          <div class="trend-badges">
            <span class="card-pill">
              {{ row.points.length }} {{ row.points.length === 1 ? 'Bewertung' : 'Bewertungen' }}
            </span>
            <span
              v-if="row.hasTrend"
              class="card-pill"
              :style="{ color: deltaColor(row.delta), borderColor: deltaColor(row.delta) }"
            >{{ deltaLabel(row.delta) }}</span>
          </div>

          <div class="chart-row">
            <div class="axis">
              <span class="axis-label">10</span>
              <span class="axis-label">5</span>
              <span class="axis-label">0</span>
            </div>
            <div class="chart-scroll">
              <div class="chart">
                <!-- A bar is a reading taken somewhere; tapping it opens that
                     somewhere, unfolded, in the list that owns it. -->
                <div
                  v-for="(p, i) in row.points"
                  :key="i"
                  class="bar-col"
                  :class="{ tappable: canOpen(p) }"
                  @click="openPoint(p)"
                >
                  <span class="bar-value" :style="{ color: barColor(p.value) }">{{ p.value }}</span>
                  <div class="bar-track">
                    <div class="bar-mid"></div>
                    <div
                      class="bar-fill"
                      :style="{ height: barHeight(p.value), background: barColor(p.value) }"
                    ></div>
                  </div>
                  <span class="bar-date">{{ shortDate(p.time) }}</span>
                  <!-- Where the reading was taken; the same scale is filled in
                       three different places. -->
                  <span class="bar-source">{{ sourceLabel(p.source) }}</span>
                </div>
              </div>
            </div>
          </div>

          <p v-if="!row.hasTrend" class="trend-hint">{{ hintText }}</p>
        </div>
      </template>

      <div class="list-bottom-space"></div>
    </v-content>
  </div>
</template>

<script>
import moment from 'moment';
import { truthColor, deltaColor, deltaLabel, TRUTH_SCALE_MAX } from '@/utils/beliefTrend';
import { beliefRows, affirmationRows } from '@/utils/credibility';
import { openQuery } from '@/utils/reveal';

// Which side a reading came from — the same 0-10 question is asked in three
// different places, and a bar means something else depending on where.
const SOURCES = {
  situation: 'Situation',
  wandeln: 'Wandeln',
  action: 'Handlung',
};

// The list each kind of reading can be followed back into.
const ROUTES = {
  situation: '/patterns',
  wandeln: '/beliefs',
  action: '/actions',
};

export default {
  name: 'trends-view',
  data() {
    return { tab: 'beliefs' };
  },
  computed: {
    isBeliefs() { return this.tab === 'beliefs'; },
    beliefCount() {
      const store = this.$store.getters;
      return beliefRows(store.patterns, store.beliefs).length;
    },
    affirmationCount() { return affirmationRows(this.$store.getters.beliefs).length; },
    rows() {
      const store = this.$store.getters;
      return this.isBeliefs
        ? beliefRows(store.patterns, store.beliefs)
        : affirmationRows(store.beliefs);
    },
    trendCount() {
      return this.rows.filter(r => r.hasTrend).length;
    },
    emptyText() {
      return this.isBeliefs
        ? 'Lege eine Situation an und bewerte dort deine Überzeugungen — ab der zweiten '
          + 'Bewertung derselben Überzeugung entsteht ein Verlauf.'
        : 'Wandle eine Überzeugung und bewerte dort die Affirmation — ab der zweiten '
          + 'Bewertung desselben Satzes entsteht ein Verlauf.';
    },
    hintText() {
      return this.isBeliefs
        ? 'Eine zweite Bewertung in einer späteren Situation zeigt, ob sich etwas bewegt.'
        : 'Eine zweite Bewertung — beim Wandeln oder nach einer Handlung — zeigt, ob sich '
          + 'etwas bewegt.';
    },
  },
  methods: {
    sourceLabel(source) { return SOURCES[source] || ''; },
    // Which list owns the thing a reading was taken on. A situation reading
    // came from a Situation, a wandeln reading from the belief that produced
    // it, an action reading from the experiment that was evaluated.
    routeFor(point) {
      return point && ROUTES[point.source] ? ROUTES[point.source] : null;
    },
    canOpen(point) {
      return !!this.routeFor(point)
        && point.targetId !== undefined && point.targetId !== null;
    },
    openPoint(point) {
      if (!this.canOpen(point)) return;
      this.$router.push({ path: this.routeFor(point), query: openQuery(point.targetId) });
    },
    // A belief is worth less the higher it stands, an affirmation is worth
    // more — so the same colour scale would say the opposite thing.
    barColor(value) {
      return this.isBeliefs ? truthColor(value) : truthColor(TRUTH_SCALE_MAX - value);
    },
    deltaColor(delta) { return this.isBeliefs ? deltaColor(delta) : deltaColor(-delta); },
    deltaLabel(delta) { return deltaLabel(delta); },
    // A zero would otherwise be invisible, and "kaum noch wahr" is exactly the
    // result worth seeing.
    barHeight(value) {
      const pct = (value / TRUTH_SCALE_MAX) * 100;
      return `${Math.max(2, pct)}%`;
    },
    shortDate(time) {
      moment.locale('de');
      return moment(time).format('D. MMM');
    },
  },
};
</script>

<style scoped lang="scss">
.dark-page {
  background: #000;
  min-height: 100vh;
}

/* Small grey capitals, same as the headings on Jetzt. */
.section-head {
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8e8e93;
  margin: 18px 20px 8px;
}

.trend-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 10px 0 14px;
}

.chart-row {
  display: flex;
  align-items: stretch;
  gap: 8px;
}
// The axis is aligned to the track only, not to the value and date rows above
// and below it, so the numbers sit where the bars actually start and end.
.axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 0 20px;
  flex-shrink: 0;
}
.axis-label {
  font-size: 0.62rem;
  color: #636366;
  line-height: 1;
}
.chart-scroll {
  flex: 1;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.chart {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  min-width: min-content;
}
.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 48px;
  flex-shrink: 0;
  &.tappable {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    &:active { opacity: 0.6; }
  }
}
.bar-value {
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1;
  margin-bottom: 4px;
  height: 16px;
}
.bar-track {
  position: relative;
  width: 26px;
  height: 110px;
  background: #2c2c2e;
  border-radius: 6px;
  overflow: hidden;
}
.bar-mid {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  border-top: 1px dashed #48484a;
}
.bar-fill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 6px;
}
.bar-date {
  font-size: 0.62rem;
  color: #636366;
  margin-top: 6px;
  height: 14px;
  white-space: nowrap;
}
.bar-source {
  font-size: 0.58rem;
  color: #48484a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  height: 12px;
  white-space: nowrap;
}

.trend-hint {
  font-size: 0.72rem;
  color: #636366;
  line-height: 1.45;
  margin: 12px 0 0;
}
</style>
