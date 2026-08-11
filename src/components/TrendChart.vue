<template>
  <div>
    <div class="trend-badges">
      <span class="card-pill">
        {{ row.points.length }} {{ row.points.length === 1 ? 'Bewertung' : 'Bewertungen' }}
      </span>
      <span
        v-if="row.hasTrend"
        class="card-pill"
        :style="{ color: deltaTint, borderColor: deltaTint }"
      >{{ deltaText }}</span>
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
            <!-- Where the reading was taken; the same scale is filled in three
                 different places. -->
            <span class="bar-source">{{ sourceLabel(p.source) }}</span>
          </div>
        </div>
      </div>
    </div>

    <p v-if="!row.hasTrend" class="trend-hint">{{ hint }}</p>
  </div>
</template>

<script>
import moment from 'moment';
import { truthColor, deltaColor, deltaLabel, TRUTH_SCALE_MAX } from '@/utils/beliefTrend';
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
  name: 'trend-chart',
  props: {
    row: { type: Object, required: true },
    // A belief is worth less the higher it stands, an affirmation is worth
    // more — so the same colour scale would say the opposite thing.
    inverted: { type: Boolean, default: false },
  },
  computed: {
    deltaTint() {
      return this.inverted ? deltaColor(-this.row.delta) : deltaColor(this.row.delta);
    },
    deltaText() { return deltaLabel(this.row.delta); },
    hint() {
      return this.inverted
        ? 'Eine zweite Bewertung — beim Wandeln oder nach einer Handlung — zeigt, ob sich '
          + 'etwas bewegt.'
        : 'Eine zweite Bewertung in einer späteren Situation zeigt, ob sich etwas bewegt.';
    },
  },
  methods: {
    sourceLabel(source) { return SOURCES[source] || ''; },
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
    barColor(value) {
      return this.inverted ? truthColor(TRUTH_SCALE_MAX - value) : truthColor(value);
    },
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
