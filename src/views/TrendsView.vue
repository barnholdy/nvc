<template>
  <div class="dark-page">
    <v-toolbar color="#000" dark flat app>
      <v-btn icon @click="$router.back()">
        <v-icon color="#4ade80">arrow_back</v-icon>
      </v-btn>
      <v-toolbar-title>Trends</v-toolbar-title>
    </v-toolbar>

    <v-content>
      <div class="intro-card">
        <span class="intro-icon">📉</span>
        <p class="intro-title">Für wie glaubwürdig hältst du sie?</p>
        <p class="intro-text">{{ introText }}</p>
      </div>

      <div class="segment-row">
        <button
          class="seg-tab"
          :class="{ active: tab === 'beliefs' }"
          @click="tab = 'beliefs'"
        >Überzeugungen</button>
        <button
          class="seg-tab"
          :class="{ active: tab === 'affirmations' }"
          @click="tab = 'affirmations'"
        >Affirmationen</button>
      </div>

      <div v-if="!rows.length" class="empty-state">
        <span class="empty-icon">📉</span>
        <p class="empty-title">Noch keine Bewertungen</p>
        <p class="empty-sub">{{ emptyText }}</p>
      </div>

      <template v-else>
        <p class="section-header">{{ trendCount }} mit Verlauf · {{ rows.length }} bewertet</p>

        <div v-for="row in rows" :key="row.key" class="trend-card">
          <p class="trend-belief">{{ row.text }}</p>

          <div class="trend-badges">
            <span class="badge-pill">
              {{ row.points.length }} {{ row.points.length === 1 ? 'Bewertung' : 'Bewertungen' }}
            </span>
            <span
              v-if="row.hasTrend"
              class="badge-pill"
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

      <div class="bottom-space"></div>
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
    rows() {
      const store = this.$store.getters;
      return this.isBeliefs
        ? beliefRows(store.patterns, store.beliefs)
        : affirmationRows(store.beliefs);
    },
    trendCount() {
      return this.rows.filter(r => r.hasTrend).length;
    },
    introText() {
      return this.isBeliefs
        ? 'Jedes Mal, wenn du eine Überzeugung zu einer Situation hinzufügst oder eine '
          + 'Handlung auswertest, hältst du fest, für wie glaubwürdig du sie gerade hältst. '
          + 'Nebeneinander gestellt wird sichtbar, was sich bewegt — nach unten ist die '
          + 'Richtung, in die du arbeitest.'
        : 'Beim Wandeln und beim Auswerten einer Handlung hältst du fest, für wie '
          + 'glaubwürdig sich eine Affirmation anfühlt. Hier stehen diese Werte '
          + 'nebeneinander — nach oben ist die Richtung, in die du arbeitest.';
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

.intro-card {
  background: #1c1c1e;
  border-radius: 12px;
  margin: 16px;
  padding: 16px;
}
.intro-icon { font-size: 1.6rem; display: block; margin-bottom: 8px; }
.intro-title {
  font-size: 1rem;
  color: #fff;
  font-weight: 600;
  margin: 0 0 6px;
}
.intro-text {
  font-size: 0.8rem;
  color: #8e8e93;
  line-height: 1.5;
  margin: 0;
}

.section-header {
  font-size: 0.75rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: 600;
  margin: 20px 20px 6px;
}

.trend-card {
  background: #1c1c1e;
  border-radius: 12px;
  margin: 0 16px 12px;
  padding: 14px 16px;
}
.trend-belief {
  font-size: 0.95rem;
  color: #fff;
  font-weight: 500;
  line-height: 1.4;
  margin: 0 0 8px;
}
.trend-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}
.badge-pill {
  font-size: 0.7rem;
  color: #8e8e93;
  border: 1px solid #3a3a3c;
  border-radius: 999px;
  padding: 2px 9px;
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

.segment-row {
  display: flex;
  padding: 0 16px 16px;
  border-bottom: 1px solid #2c2c2e;
  margin-bottom: 4px;
}
.seg-tab {
  flex: 1;
  background: none;
  border: none;
  padding: 8px 2px;
  font-size: 0.85rem;
  color: #8e8e93;
  cursor: pointer;
  position: relative;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  &::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; right: 0;
    height: 2px;
    background: transparent;
    border-radius: 2px;
  }
  &.active { color: #fff; font-weight: 600; &::after { background: #4ade80; } }
}

.trend-hint {
  font-size: 0.72rem;
  color: #636366;
  line-height: 1.45;
  margin: 12px 0 0;
}

.empty-state {
  text-align: center;
  padding: 40px 32px;
}
.empty-icon { font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 16px; }
.empty-title { font-size: 1.1rem; color: #fff; font-weight: 600; margin: 0 0 6px; }
.empty-sub { font-size: 0.875rem; color: #8e8e93; margin: 0; line-height: 1.5; }

.bottom-space { height: 24px; }
</style>
