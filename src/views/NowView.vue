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

      <!-- One block per kind of next step. A block with nothing in it is not
           shown at all: an empty list is not news. -->
      <div v-for="section in sections" :key="section.key" class="card">
        <p class="now-head">{{ section.count }} {{ section.title }}</p>

        <div
          v-for="item in section.items"
          :key="item.key"
          class="now-row"
          @click="section.run(item)"
        >
          <span class="now-text">{{ item.text }}</span>
          <span class="now-action">{{ section.action }}</span>
          <v-icon class="detail-chevron">chevron_right</v-icon>
        </div>

        <!-- Only when there is more than the three shown. -->
        <div v-if="section.count > TOP" class="card-link" @click="section.more()">
          <span class="card-link-text">
            {{ section.count - TOP }} {{ section.count - TOP === 1 ? 'weitere' : 'weitere' }} anzeigen
          </span>
          <v-icon class="detail-chevron">chevron_right</v-icon>
        </div>
      </div>

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
        <v-icon>schedule</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/patterns">
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
import AffirmationPractice from '@/components/AffirmationPractice.vue';
import { beliefStatus } from '@/utils/beliefStatus';
import {
  collectExperiments,
  experimentDisplayState,
  experimentsOf,
  isPlanned,
  experimentState,
} from '@/utils/experiment';
import { affirmationCredibility, beliefCredibility } from '@/utils/credibility';

// Three is enough to start on; the rest is one tap away in the list that owns
// them. Showing everything would turn this screen back into those lists.
const TOP = 3;
const PRACTICE_KEY = 'nvc.amen';

export default {
  name: 'now-view',
  components: { AffirmationPractice },
  data() {
    return { practising: null };
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
    openExperiments() {
      return this.rows.filter(r => experimentState(r.experiment) !== 'evaluated'
        && !isPlanned(r.experiment));
    },
    plannedExperiments() {
      return this.rows.filter(r => experimentDisplayState(r.experiment) === 'planned');
    },
    sections() {
      const belief = (b, action) => ({ key: `b${b.time}`, text: b.belief, entry: b, action });
      const run = list => list.slice(0, TOP);
      const all = [
        {
          key: 'explore',
          title: 'neue Überzeugungen ergründen',
          action: 'Ergründen',
          count: this.byStatus.open.length,
          items: run(this.byStatus.open).map(b => belief(b)),
          run: item => this.$router.push(`/edit-belief/${item.entry.time}`),
          more: () => this.$router.push({ path: '/beliefs', query: { tab: 'open' } }),
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
          items: run(this.affirmations).map(a => ({ key: `a${a.text}`, text: a.text, aff: a })),
          run: item => this.startPractice(item.aff),
          more: () => this.$router.push('/beliefs'),
        },
        {
          key: 'plan',
          title: 'neue Handlungen planen',
          action: 'Planen',
          count: this.openExperiments.length,
          items: run(this.openExperiments).map(r => ({
            key: `x${r.experiment.id}`,
            text: r.experiment.situation || r.beliefText,
            row: r,
          })),
          run: item => this.$router.push(
            `/act-belief/${item.row.beliefTime}/${item.row.experiment.id}`,
          ),
          more: () => this.$router.push({ path: '/actions', query: { tab: 'open' } }),
        },
        {
          key: 'evaluate',
          title: 'geplante Handlungen auswerten',
          action: 'Auswerten',
          count: this.plannedExperiments.length,
          items: run(this.plannedExperiments).map(r => ({
            key: `x${r.experiment.id}`,
            text: r.experiment.situation || r.beliefText,
            row: r,
          })),
          // Evaluating happens in the Handlungen list, which owns that wizard.
          run: item => this.$router.push({
            path: '/actions',
            query: { open: String(item.row.experiment.id) },
          }),
          more: () => this.$router.push({ path: '/actions', query: { tab: 'planned' } }),
        },
      ];
      return all.filter(s => s.count > 0);
    },
  },
  methods: {
    startPractice(aff) {
      this.practising = { text: aff.text, feelings: aff.feelings, needs: aff.needs };
      try {
        const map = JSON.parse(localStorage.getItem(PRACTICE_KEY)) || {};
        map[aff.text] = Date.now();
        localStorage.setItem(PRACTICE_KEY, JSON.stringify(map));
      } catch (e) { /* a full or blocked store must not stop the practice */ }
    },
    experimentsOf(b) { return experimentsOf(b); },
  },
};
</script>

<style scoped lang="scss">
.dark-page { background: #000; min-height: 100vh; }

.now-head {
  font-size: 1rem;
  color: #fff;
  margin: 0 0 4px;
  font-weight: 500;
}
.now-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #2c2c2e;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
  &:last-child { border-bottom: none; }
}
.now-text {
  flex: 1;
  min-width: 0;
  font-size: 0.95rem;
  color: #8e8e93;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.now-action {
  flex-shrink: 0;
  font-size: 0.9rem;
  color: #4ade80;
}

.dark-nav {
  border-top: 1px solid #2c2c2e;
  .v-btn { min-width: 0; }
}
</style>
