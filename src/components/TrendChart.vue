<template>
  <div>
    <div class="chart-row">
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
            <!-- What this reading said, in figures: no line to read off a
                 scale, the number is the reading. -->
            <span class="bar-value">{{ percentOf(p.value) }}%</span>
            <div class="bar-track">
              <!-- Each bar is the credibility bar stood on its end: as much
                   red as the belief was given in that moment, green for the
                   ground it had lost there. The figure above says the same
                   number, so colour and text cannot drift apart. -->
              <span
                v-for="n in scale"
                :key="n"
                class="bar-seg"
                :class="segClass(n, i)"
              ></span>
            </div>
            <span class="bar-date">{{ shortDate(p.time) }}</span>
            <!-- Where the reading was taken, said by the mark that side is
                 known by elsewhere in the app; the word stays as its title. -->
            <span class="bar-source" :title="sourceLabel(p.source)">
              <svg
                v-if="sourceIcon(p.source)"
                class="bar-icon"
                :class="`bar-icon-${p.source}`"
                viewBox="0 0 24 24"
                width="13"
                height="13"
              ><path :d="sourceIcon(p.source)" fill="currentColor"></path></svg>
              <template v-else>{{ sourceLabel(p.source) }}</template>
            </span>
          </div>
        </div>
      </div>
    </div>

    <p v-if="!row.hasTrend" class="trend-hint">{{ hint }}</p>
  </div>
</template>

<script>
import moment from 'moment';
import { TRUTH_SCALE_MAX } from '@/utils/beliefTrend';
import { openQuery } from '@/utils/reveal';
import {
  mdiLightningBolt, mdiBookOpenPageVariant, mdiFlaskOutline, mdiVanish,
} from '@mdi/js';

// Which side a reading came from — the same 0-10 question is asked in several
// different places, and a bar means something else depending on where.
const SOURCES = {
  situation: 'Trigger',
  wandeln: 'Wandeln',
  action: 'Handlung',
  journal: 'Reflexion',
};

// Every kind that stands in the Tagebuch carries the same mark the list gives
// it there — a run included, since an evaluated one is read among them.
const SOURCE_ICONS = {
  situation: mdiLightningBolt,
  journal: mdiBookOpenPageVariant,
  action: mdiFlaskOutline,
  // A wandeln reading is not in the Tagebuch at all — it carries the mark the
  // Überzeugungen tab is known by instead.
  wandeln: mdiVanish,
};

// The list each kind of reading can be followed back into.
const ROUTES = {
  situation: '/journal',
  wandeln: '/beliefs',
  action: '/journal',
  journal: '/journal',
};

export default {
  name: 'trend-chart',
  props: {
    row: { type: Object, required: true },
    // An affirmation is the same scale read the other way round: what a
    // belief loses, it gains. The bars say so by filling from the other end.
    kind: { type: String, default: 'belief' },
  },
  computed: {
    scale() {
      return TRUTH_SCALE_MAX;
    },
    hint() {
      return this.kind === 'affirmation'
        ? 'Jedes Wandeln bewertet die Affirmation neu — dann zeigt sich, ob sie trägt.'
        : 'Eine zweite Bewertung in einer späteren Situation zeigt, ob sich etwas bewegt.';
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
    // The reading as a share of the scale, the way every slider states it.
    percentOf(value) {
      const v = Math.max(0, Math.min(TRUTH_SCALE_MAX, value));
      return Math.round((v / TRUTH_SCALE_MAX) * 100);
    },
    // The whole scale is coloured, the way the credibility bar colours it, so
    // the turn stays visible however low the reading itself was. It is that
    // reading and no median over its neighbours: the figure above the bar
    // states the same number, and the two must not say different things.
    segClass(n, i) {
      const point = (this.row.points || [])[i];
      if (!point || typeof point.value !== 'number') return {};
      // Red always means the same thing — how much of the old belief still
      // has you. On an affirmation that is what it has not yet won over.
      const below = n <= point.value;
      if (this.kind === 'affirmation') return below ? { freed: true } : { held: true };
      return below ? { held: true } : { freed: true };
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
.chart-scroll {
  flex: 1;
  overflow-x: auto;
  /* Sideways is the only direction there is anything to see in. Left on its
     own, overflow-x turns the other axis into `auto` too, and a single
     sub-pixel of height is then enough to make the whole chart wobble. */
  overflow-y: hidden;
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
/* Above its bar, so the column reads number first, then how far it stands. */
.bar-value {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  margin-bottom: 4px;
}
.bar-seg {
  flex: 1;
  border-radius: 2px;
  background: var(--border-default);
}
/* The same two colours the credibility bar is read in. */
.bar-seg.held { background: var(--old-belief); }
.bar-seg.freed { background: var(--accent-fill); }
.bar-date {
  font-size: 0.62rem;
  color: var(--text-disabled);
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
  height: 13px;
  white-space: nowrap;
}
.bar-icon { flex-shrink: 0; }
/* The same two colours the credibility bar is read in, so a bar's mark means
   the same thing here as it does in the list. */
.bar-icon-situation { color: var(--trigger-icon); }
/* Both speak against the belief, so both are green; the shape says which. */
.bar-icon-journal { color: var(--accent-light); }
.bar-icon-action { color: var(--accent-light); }
.bar-icon-wandeln { color: var(--accent-light); }

.trend-hint {
  font-size: 0.72rem;
  color: var(--text-disabled);
  line-height: 1.45;
  margin: 12px 0 0;
}
</style>
