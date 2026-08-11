<template>
  <div v-if="beliefs.length">
    <p class="section-head">Meine Muster</p>

    <!-- One card per cluster: the name the analysis gave it, and the beliefs
         that fell into it as chips. -->
    <div v-for="(k, i) in patternGroups" :key="i" class="card">
      <p class="card-title">{{ k.title }}</p>
      <div class="group-chips">
        <span v-for="(b, j) in k.beliefs" :key="j" class="group-chip">
          „{{ b.text }}“<span v-if="b.credibility !== null" class="chip-score"> · {{ b.credibility }}/10</span>
        </span>
      </div>
    </div>

    <div class="card now-card" @click="generateKernmuster">
      <div class="now-line">
        <div class="now-body">
          <p class="now-title">{{ kernmuster.length ? 'Neu analysieren' : 'Muster analysieren' }}</p>
          <p class="now-sub" :class="{ 'sub-changed': dataChanged }">{{ subline }}</p>
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
          :class="{ 'btn-changed': dataChanged }"
          @click.stop="generateKernmuster"
        >{{ kernmuster.length ? 'Neu' : 'Analysieren' }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import { beliefCredibility } from '@/utils/credibility';

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
      return this.kernmuster.map(k => ({
        title: k.title,
        beliefs: ((k && k.beliefs) || []).map((t) => {
          const belief = byText[normalizeBelief(t)];
          const c = belief ? beliefCredibility(patterns, belief) : null;
          return {
            text: belief ? belief.belief : t,
            // One decimal, German comma — the same number the cards show.
            credibility: c === null ? null : String(Math.round(c * 10) / 10).replace('.', ','),
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

.group-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}
/* Outline, like the feeling chips: a belief in a cluster is a label, not a
   button. */
.group-chip {
  font-size: 0.85rem;
  color: #8e8e93;
  white-space: nowrap;
  border: 1px solid #3a3a3c;
  border-radius: 999px;
  padding: 5px 12px;
  line-height: 1.3;
}

/* The number is the quieter half of the chip. */
.chip-score { color: #636366; }

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
/* Orange when the beliefs have moved on since the last analysis — the same
   colour the rest of the app uses for "this needs attention". */
.sub-changed { color: #fd9927; }
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
.btn-changed { border-color: #fd9927; color: #fd9927; }
</style>
