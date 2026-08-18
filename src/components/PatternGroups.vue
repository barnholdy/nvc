<template>
  <div v-if="beliefs.length">
    <p class="section-head">Meine Muster</p>

    <!-- One card per cluster: the name the analysis gave it, and the beliefs
         that fell into it as chips. -->
    <div v-for="(k, i) in patternGroups" :key="i" class="card">
      <p class="card-title">{{ k.title }}</p>
      <!-- Only clickable when the text still matches a belief that exists:
           the analysis echoes text back, and a renamed or deleted one has
           nowhere left to jump to. -->
      <div v-for="(b, j) in k.beliefs" :key="j" class="group-item">
        <belief-chip
          :text="b.text"
          :value="b.standing"
          :baseline="b.credibility"
          :tappable="b.time !== null"
          @open="openBelief(b)"
        ></belief-chip>
        <feeling-chips
          v-if="b.feelings.length"
          :items="b.feelings"
          type="feelings"
          flat
          class="group-feelings"
        ></feeling-chips>
      </div>
    </div>

    <div class="card now-card" @click="generateKernmuster">
      <div class="now-line">
        <div class="now-body">
          <p class="now-title">{{ kernmuster.length ? 'Neu analysieren' : 'Muster analysieren' }}</p>
          <p class="now-sub">{{ subline }}</p>
        </div>
        <v-progress-circular
          v-if="isLoading"
          indeterminate
          color="#4ade80"
          size="20"
          width="2"
        ></v-progress-circular>
        <button
          v-else
          class="now-btn"
          @click.stop="generateKernmuster"
        >{{ kernmuster.length ? 'Neu' : 'Analysieren' }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import { beliefCredibility, beliefStanding } from '@/utils/credibility';
import { openQuery } from '@/utils/reveal';
import BeliefChip from '@/components/BeliefChip.vue';
import FeelingChips from '@/components/FeelingChips.vue';

// Quotes, case, spacing and a trailing period are all the analysis is likely to
// change when it repeats a belief back — none of them make it a different one.
function normalizeBelief(text) {
  return String(text || '')
    .replace(/[„“"‚‘’']/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/, '')
    .trim()
    .toLowerCase();
}

export default {
  name: 'pattern-groups',
  components: { BeliefChip, FeelingChips },
  data() {
    const saved = localStorage.getItem('nvc.kernmuster');
    return {
      kernmuster: saved ? JSON.parse(saved) : [],
      kernmusterSnapshot: localStorage.getItem('nvc.kernmusterSnapshot') || '',
      isLoading: false,
      error: '',
      apiKey: localStorage.getItem('nvc.apiKey') || '',
    };
  },
  computed: {
    beliefs() { return this.$store.getters.beliefs; },
    currentSnapshot() {
      return this.beliefs.map(b => b.belief).slice().sort().join('|');
    },
    dataChanged() {
      return this.kernmuster.length > 0 && this.currentSnapshot !== this.kernmusterSnapshot;
    },
    // Only the beliefs the analysis actually grouped, echoed back and matched
    // loosely against what is stored — it comes back retyped.
    patternGroups() {
      const byText = {};
      this.beliefs.forEach((b) => {
        if (b && b.belief) byText[normalizeBelief(b.belief)] = b;
      });
      const patterns = this.$store.getters.patterns;
      const journal = this.$store.getters.journal;
      return this.kernmuster.map(k => ({
        title: k.title,
        beliefs: ((k && k.beliefs) || []).map((t) => {
          const belief = byText[normalizeBelief(t)];
          const c = belief ? beliefCredibility(patterns, belief, journal) : null;
          return {
            text: belief ? belief.belief : t,
            // Raw, so the chip can place it on its own scale — it does the
            // rounding and the German comma itself.
            credibility: c,
            standing: belief ? beliefStanding(patterns, belief, journal) : null,
            // What it feels like when the belief is true — the same feelings
            // the belief's own card shows, so a cluster reads as more than a
            // list of sentences.
            feelings: belief && Array.isArray(belief.feelings) ? belief.feelings : [],
            // Only set when the text still matches something stored — that is
            // what makes the chip a link rather than just a label.
            time: belief ? belief.time : null,
          };
        }),
      }));
    },
    subline() {
      if (this.error) return this.error;
      if (!this.apiKey) return 'API Key in den Einstellungen hinterlegen';
      if (!this.beliefs.length) return 'Noch keine Überzeugungen vorhanden';
      if (this.isLoading) return 'Analysiere…';
      return this.dataChanged
        ? 'Überzeugungen haben sich geändert'
        : 'KI clustert deine Überzeugungen';
    },
  },
  methods: {
    // Lands on Überzeugungen with this belief flush against the top edge —
    // the chip names exactly one thing, so there is nothing to search for.
    openBelief(chip) {
      if (chip.time === null) return;
      this.$router.push({ path: '/beliefs', query: openQuery(chip.time, { top: true }) });
    },
    async generateKernmuster() {
      if (this.isLoading) return;
      if (!this.apiKey) {
        this.$router.push('/settings');
        return;
      }
      if (!this.beliefs.length) {
        this.error = 'Noch keine Überzeugungen vorhanden.';
        return;
      }
      this.isLoading = true;
      this.error = '';
      this.kernmuster = [];

      const beliefTexts = this.beliefs.map((b, i) => `${i + 1}. ${b.belief}`).join('\n');

      // Grouping is the whole job: the affirmations column that used to sit
      // beside each group is gone, so there is nothing else to ask for.
      const prompt = 'Analysiere diese Glaubenssätze und gruppiere sie in 3–5 Kernmuster (Cluster).\n'
        + 'Jedes Cluster erhält einen prägnanten deutschen Namen und listet die dazugehörigen Glaubenssätze auf.\n'
        + 'Gib jeden Glaubenssatz genau so zurück, wie er dasteht.\n\n'
        + `Glaubenssätze:\n${beliefTexts}\n\n`
        + 'Antworte ausschließlich mit einem JSON-Array (kein Markdown, kein Text davor oder danach):\n'
        + '[{"title":"Clustername","beliefs":["Glaube 1","Glaube 2"]},...]';

      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err.error && err.error.message) || `Fehler ${res.status}`);
        }
        const data = await res.json();
        const text = data.content[0].text.trim();
        const match = text.match(/\[[\s\S]*\]/);
        if (!match) throw new Error('Ungültiges Antwortformat.');
        this.kernmuster = JSON.parse(match[0]);
        this.kernmusterSnapshot = this.currentSnapshot;
        localStorage.setItem('nvc.kernmuster', JSON.stringify(this.kernmuster));
        localStorage.setItem('nvc.kernmusterSnapshot', this.kernmusterSnapshot);
      } catch (e) {
        this.error = e.message || 'Analyse fehlgeschlagen.';
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.section-head {
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8e8e93;
  margin: 18px 20px 8px;
}
/* The feelings ride under their own belief's chip, not the next one's. */
.group-feelings { margin-top: 8px; }

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
</style>
