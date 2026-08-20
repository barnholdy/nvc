<template>
  <div>
    <div class="chart-row">
      <div class="axis">
        <span class="axis-label">10</span>
        <span class="axis-label">5</span>
        <span class="axis-label">0</span>
      </div>
      <div class="chart-scroll" ref="scroll">
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
            <span class="bar-value">{{ p.value }}</span>
            <div class="bar-track">
              <div class="bar-mid"></div>
              <span
                v-for="n in scale"
                :key="n"
                class="bar-seg"
                :class="{ filled: n <= p.value }"
              ></span>
              <!-- Where the belief itself stands, held against every single
                   reading — the same anchor its own card and chip show. -->
              <div
                v-if="row.baseline !== null"
                class="bar-baseline"
                :style="{ bottom: baselinePct }"
              ></div>
            </div>
            <span class="bar-date">{{ shortDate(p.time) }}</span>
            <!-- Where the reading was taken; the same scale is filled in
                 several different places. A Trigger and a Reflexion both come
                 from the Tagebuch, so each carries its own mark. -->
            <span class="bar-source">
              <svg
                v-if="sourceIcon(p.source)"
                class="bar-icon"
                :class="`bar-icon-${p.source}`"
                viewBox="0 0 24 24"
                width="11"
                height="11"
              ><path :d="sourceIcon(p.source)" fill="currentColor"></path></svg>
              {{ sourceLabel(p.source) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <p v-if="!row.hasTrend" class="trend-hint">
      Eine zweite Bewertung in einer späteren Situation zeigt, ob sich etwas bewegt.
    </p>
  </div>
</template>

<script>
import moment from 'moment';
import { TRUTH_SCALE_MAX } from '@/utils/beliefTrend';
import { openQuery } from '@/utils/reveal';
import { mdiLightningBolt, mdiBookOpenPageVariant } from '@mdi/js';

// Which side a reading came from — the same 0-10 question is asked in several
// different places, and a bar means something else depending on where.
const SOURCES = {
  situation: 'Trigger',
  wandeln: 'Wandeln',
  action: 'Handlung',
  journal: 'Reflexion',
};

// The two kinds of Tagebuch entry carry the same marks the list gives them.
const SOURCE_ICONS = {
  situation: mdiLightningBolt,
  journal: mdiBookOpenPageVariant,
};

// The list each kind of reading can be followed back into.
const ROUTES = {
  situation: '/journal',
  wandeln: '/beliefs',
  action: '/actions',
  journal: '/journal',
};

export default {
  name: 'trend-chart',
  props: {
    row: { type: Object, required: true },
  },
  computed: {
    scale() {
      return TRUTH_SCALE_MAX;
    },
    baselinePct() {
      return `${(Math.max(0, Math.min(TRUTH_SCALE_MAX, this.row.baseline)) / TRUTH_SCALE_MAX) * 100}%`;
    },
  },
  watch: {
    // A different belief's trend, or a newly added reading — either way the
    // newest bar is the one worth seeing without having to scroll for it.
    row() {
      this.$nextTick(this.scrollToEnd);
    },
  },
  mounted() {
    this.scrollToEnd();
  },
  methods: {
    scrollToEnd() {
      const el = this.$refs.scroll;
      if (el) el.scrollLeft = el.scrollWidth;
    },
    sourceLabel(source) { return SOURCES[source] || ''; },
    sourceIcon(source) { return SOURCE_ICONS[source] || null; },
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
    shortDate(time) {
      moment.locale('de');
      return moment(time).format('D. MMM');
    },
  },
};
</script>

<style scoped lang="scss">
.chart-row {
  display: flex;
  align-items: stretch;
  gap: 8px;
  margin-top: 16px;
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
  color: #6aaef7;
  line-height: 1;
  margin-bottom: 4px;
  height: 16px;
}
.bar-track {
  position: relative;
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
  width: 26px;
  height: 165px;
  border-radius: 6px;
  overflow: hidden;
}
.bar-seg {
  flex: 1;
  border-radius: 2px;
  background: #3a3a3c;
}
.bar-seg.filled { background: #6aaef7; }
.bar-mid {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  border-top: 1px dashed #48484a;
  z-index: 1;
}
/* Drawn over the segments and reaching past them, so it reads as a line held
   against the scale rather than as one more block in it — the same marker
   the belief chip draws across its own row. */
.bar-baseline {
  position: absolute;
  left: -2px;
  right: -2px;
  height: 2px;
  margin-bottom: -1px;
  border-radius: 1px;
  background: #fd9927;
  z-index: 2;
}
.bar-date {
  font-size: 0.62rem;
  color: #636366;
  margin-top: 6px;
  height: 14px;
  white-space: nowrap;
}
.bar-source {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.58rem;
  color: #48484a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  height: 12px;
  white-space: nowrap;
}
.bar-icon { flex-shrink: 0; }
.bar-icon-situation { color: #fd9927; }
.bar-icon-journal { color: #4ade80; }

.trend-hint {
  font-size: 0.72rem;
  color: #636366;
  line-height: 1.45;
  margin: 12px 0 0;
}
</style>
