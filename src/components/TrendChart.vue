<template>
  <div>
    <div class="chart-row">
      <!-- The scale is named rather than numbered, the way the credibility bar
           names it: where the belief started and the last reading taken. The
           labels stay put while the bars scroll past them. -->
      <div class="axis">
        <span
          v-if="row.baseline !== null"
          class="axis-mark axis-mark-start"
          :style="{ bottom: levelOf(row.baseline) }"
        >Start</span>
        <span
          v-if="row.current !== null"
          class="axis-mark axis-mark-now"
          :style="{ bottom: levelOf(row.current) }"
        >aktuell</span>
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
            <div class="bar-track">
              <div class="bar-mid"></div>
              <!-- Filled to what this reading said, in the colours the bar
                   uses everywhere: red as far as the belief still stands,
                   green for whatever reaches past it. -->
              <span
                v-for="n in scale"
                :key="n"
                class="bar-seg"
                :class="segClass(n, p.value)"
              ></span>
              <div
                v-if="row.baseline !== null"
                class="bar-level bar-level-start"
                :style="{ bottom: levelOf(row.baseline) }"
              ></div>
              <div
                v-if="row.current !== null"
                class="bar-level bar-level-now"
                :style="{ bottom: levelOf(row.current) }"
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
    levelOf(value) {
      const v = Math.max(0, Math.min(TRUTH_SCALE_MAX, value));
      return `${(v / TRUTH_SCALE_MAX) * 100}%`;
    },
    // Only as far as this reading went, and split where the belief stands
    // today — the same red-then-green the credibility bar draws.
    segClass(n, value) {
      if (n > value) return {};
      const standing = this.row.standing;
      if (standing === null || standing === undefined) return { held: true };
      return n <= standing ? { held: true } : { freed: true };
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
  align-items: flex-start;
  gap: 8px;
  margin-top: 16px;
}
/* Exactly as tall as a bar's track, so a label placed by its own value lines
   up with the rule drawn at that value across every bar. */
.axis {
  position: relative;
  width: 44px;
  height: 165px;
  flex-shrink: 0;
}
.axis-mark {
  position: absolute;
  right: 0;
  transform: translateY(50%);
  font-size: 0.62rem;
  font-weight: 600;
  white-space: nowrap;
}
.axis-mark-start { color: #fd9927; }
.axis-mark-now { color: #4ade80; }
.chart-scroll {
  flex: 1;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.chart {
  display: flex;
  align-items: flex-start;
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
/* The same two colours the credibility bar is read in. */
.bar-seg.held { background: #c0483d; }
.bar-seg.freed { background: #46955f; }
.bar-mid {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  border-top: 1px dashed #48484a;
  z-index: 1;
}
/* Drawn over the segments and reaching past them, so they read as levels held
   against every bar rather than as part of any one of them. */
.bar-level {
  position: absolute;
  left: -2px;
  right: -2px;
  height: 2px;
  margin-bottom: -1px;
  border-radius: 1px;
  z-index: 2;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
}
.bar-level-start { background: #fd9927; }
.bar-level-now { background: #4ade80; }
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
/* The same two colours the credibility bar is read in, so a bar's mark means
   the same thing here as it does in the list. */
.bar-icon-situation { color: #c0483d; }
.bar-icon-journal { color: #46955f; }

.trend-hint {
  font-size: 0.72rem;
  color: #636366;
  line-height: 1.45;
  margin: 12px 0 0;
}
</style>
