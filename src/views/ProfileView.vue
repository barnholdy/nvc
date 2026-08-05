<template>
  <div class="dark-page">
    <v-toolbar color="#000" dark flat app>
      <v-btn icon @click="$router.back()">
        <v-icon color="#4ade80">arrow_back</v-icon>
      </v-btn>
      <v-toolbar-title>Dein Profil</v-toolbar-title>
    </v-toolbar>

    <v-content>

      <!-- Kernmuster: what holds a group together and what dissolves it, side
           by side — listing the titles twice said the same thing twice. -->
      <template v-if="patternGroups.length">
        <p class="section-header">Muster &amp; Auflösung</p>
        <div class="settings-group">
          <template v-for="(k, i) in patternGroups">
            <div :key="i" class="pattern-item">
              <p class="pattern-title">{{ k.title }}</p>
              <div class="pattern-grid">
                <div>
                  <p class="col-label">Überzeugungen</p>
                  <p
                    v-for="(b, j) in k.beliefs"
                    :key="'b' + j"
                    class="pattern-line"
                  >{{ b }}</p>
                </div>
                <div>
                  <p class="col-label">Affirmationen</p>
                  <p
                    v-for="(a, j) in k.affirmations"
                    :key="'a' + j"
                    class="pattern-line"
                  >{{ a }}</p>
                  <!-- Nothing here means nothing was wandelt yet in this
                       group — an honest gap, not a missing feature. -->
                  <p v-if="!k.affirmations.length" class="pattern-line pattern-empty">–</p>
                </div>
              </div>
            </div>
            <div :key="'s'+i" v-if="i < patternGroups.length - 1" class="settings-sep"></div>
          </template>
        </div>
      </template>

      <div class="settings-group" :style="kernmuster.length ? 'margin-top:20px' : ''">
        <template v-if="!kernmuster.length && !isLoadingKernmuster">
          <div v-if="kernmusterError" class="info-row">
            <p class="error-text">{{ kernmusterError }}</p>
          </div>
          <div v-else-if="!apiKey" class="info-row">
            <p class="info-text">API Key in den Einstellungen hinterlegen, um Muster zu analysieren.</p>
          </div>
          <div v-else-if="!beliefs.length" class="info-row">
            <p class="info-text">Noch keine Überzeugungen vorhanden.</p>
          </div>
        </template>
        <div v-if="kernmusterError && kernmuster.length" class="info-row">
          <p class="error-text">{{ kernmusterError }}</p>
        </div>
        <div v-if="isLoadingKernmuster" class="loading-row">
          <v-progress-circular indeterminate color="#4ade80" size="18" width="2"></v-progress-circular>
          <span class="loading-label">Analysiere…</span>
        </div>
        <div v-else class="settings-row tappable" @click="generateKernmuster">
          <div class="settings-row-body">
            <p class="settings-label">{{ kernmuster.length ? 'Neu analysieren' : 'Muster analysieren' }}</p>
            <p class="settings-sub" :class="{ 'changed-sub': dataChanged }">
              {{ dataChanged ? 'Überzeugungen haben sich geändert' : 'KI clustert deine Überzeugungen' }}
            </p>
          </div>
          <v-icon :color="dataChanged ? '#fd9927' : '#4ade80'">auto_awesome</v-icon>
        </div>
      </div>

      <!-- Bedürfnisprofil -->
      <p class="section-header">Bedürfnisprofil</p>
      <div class="settings-group">
        <template v-if="topNeeds.length">
          <div v-for="(n, i) in topNeeds" :key="n.name">
            <div class="stat-item">
              <div class="stat-header-row">
                <span class="stat-name">{{ n.name }}</span>
                <span class="stat-count">{{ n.count }}×</span>
              </div>
              <div class="stat-bar-bg">
                <div class="stat-bar-fill" :style="{ width: pct(n.count, topNeeds[0].count), background: needColor(n.name) }"></div>
              </div>
            </div>
            <div v-if="i < topNeeds.length - 1" class="settings-sep"></div>
          </div>
        </template>
        <div v-else class="info-row">
          <p class="info-text">Noch keine Bedürfnisse in Überzeugungen erfasst.</p>
        </div>
      </div>

      <!-- Affektprofil -->
      <div class="affect-grid">
        <div>
          <p class="col-label">Überzeugung</p>
          <div class="settings-group">
            <template v-if="topFeelings.length">
              <div v-for="(f, i) in topFeelings" :key="f.name">
                <div class="stat-item stat-item-sm">
                  <div class="stat-header-row">
                    <span class="stat-name stat-name-sm">{{ f.name }}</span>
                    <span class="stat-count">{{ f.count }}×</span>
                  </div>
                  <div class="stat-bar-bg">
                    <div class="stat-bar-fill" :style="{ width: pct(f.count, topFeelings[0].count), background: feelingColor(f.name) }"></div>
                  </div>
                </div>
                <div v-if="i < topFeelings.length - 1" class="settings-sep"></div>
              </div>
            </template>
            <div v-else class="info-row">
              <p class="info-text">–</p>
            </div>
          </div>
        </div>

        <div>
          <p class="col-label">Neue Perspektive</p>
          <div class="settings-group">
            <template v-if="topChangeProcessFeelings.length">
              <div v-for="(f, i) in topChangeProcessFeelings" :key="f.name">
                <div class="stat-item stat-item-sm">
                  <div class="stat-header-row">
                    <span class="stat-name stat-name-sm">{{ f.name }}</span>
                    <span class="stat-count">{{ f.count }}×</span>
                  </div>
                  <div class="stat-bar-bg">
                    <div class="stat-bar-fill" :style="{ width: pct(f.count, topChangeProcessFeelings[0].count), background: feelingColor(f.name) }"></div>
                  </div>
                </div>
                <div v-if="i < topChangeProcessFeelings.length - 1" class="settings-sep"></div>
              </div>
            </template>
            <div v-else class="info-row">
              <p class="info-text">–</p>
            </div>
          </div>
        </div>
      </div>

      <div style="height: 40px;"></div>
    </v-content>
  </div>
</template>

<script>
import { colorForFeeling } from '@/utils/emotions';
import { colorForNeed } from '@/utils/needs';

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
  name: 'profile-view',
  data() {
    var saved = localStorage.getItem('nvc.kernmuster');
    return {
      kernmuster: saved ? JSON.parse(saved) : [],
      kernmusterSnapshot: localStorage.getItem('nvc.kernmusterSnapshot') || '',
      isLoadingKernmuster: false,
      kernmusterError: '',
      apiKey: localStorage.getItem('nvc.apiKey') || '',
    };
  },
  computed: {
    beliefs() {
      return this.$store.getters.beliefs;
    },
    currentSnapshot() {
      return this.beliefs.map(function(b) { return b.belief; }).slice().sort().join('|');
    },
    dataChanged() {
      return this.kernmuster.length > 0 && this.currentSnapshot !== this.kernmusterSnapshot;
    },
    // The affirmations shown next to a group are the ones actually saved on its
    // beliefs — not generated text. A group with none stays empty, which is the
    // point: it shows where the work has not happened yet.
    patternGroups() {
      var byText = {};
      this.beliefs.forEach(function(b) {
        if (b && b.belief) byText[normalizeBelief(b.belief)] = b;
      });
      return this.kernmuster.map(function(k) {
        var texts = (k && k.beliefs) || [];
        var seen = {};
        var affirmations = [];
        texts.forEach(function(text) {
          // The analysis echoes the belief back, so the text is the only key
          // there is — matched loosely, because it comes back retyped.
          var belief = byText[normalizeBelief(text)];
          if (!belief) return;
          (belief.affirmations || []).forEach(function(a) {
            if (a && a.text && !seen[a.text]) {
              seen[a.text] = true;
              affirmations.push(a.text);
            }
          });
        });
        return { title: k.title, beliefs: texts, affirmations: affirmations };
      });
    },
    topNeeds() {
      var counts = {};
      this.beliefs.forEach(function(b) {
        // A need may be stored once per Grundemotion — count it once per belief.
        var seen = {};
        (b.needs || []).forEach(function(n) {
          if (n && n.name && !seen[n.name]) {
            seen[n.name] = true;
            counts[n.name] = (counts[n.name] || 0) + 1;
          }
        });
      });
      return Object.keys(counts)
        .map(function(name) { return { name: name, count: counts[name] }; })
        .sort(function(a, b) { return b.count - a.count; })
        .slice(0, 5);
    },
    topFeelings() {
      return this._countFeelings(function(b) { return b.feelings || []; });
    },
    topChangeProcessFeelings() {
      return this._countFeelings(function(b) {
        return (b.reflection && b.reflection.withoutBeliefFeelings) || [];
      });
    },
  },
  methods: {
    _countFeelings(getFeelings) {
      var counts = {};
      var valences = {};
      var beliefs = this.beliefs;
      beliefs.forEach(function(b) {
        var seen = {};
        getFeelings(b).forEach(function(f) {
          if (f && f.name && !seen[f.name]) {
            seen[f.name] = true;
            counts[f.name] = (counts[f.name] || 0) + 1;
            if (typeof valences[f.name] === 'undefined' && f.valence !== undefined) {
              valences[f.name] = f.valence;
            }
          }
        });
      });
      return Object.keys(counts)
        .map(function(name) { return { name: name, count: counts[name], valence: valences[name] }; })
        .sort(function(a, b) { return b.count - a.count; })
        .slice(0, 5);
    },
    pct(count, max) {
      if (!max) return '0%';
      return Math.round(count / max * 100) + '%';
    },
    feelingColor(name) {
      return colorForFeeling(name);
    },
    needColor(name) {
      return colorForNeed(name);
    },
    async generateKernmuster() {
      if (!this.apiKey) {
        this.$router.push('/settings');
        return;
      }
      if (!this.beliefs.length) {
        this.kernmusterError = 'Noch keine Überzeugungen vorhanden.';
        return;
      }
      this.isLoadingKernmuster = true;
      this.kernmusterError = '';
      this.kernmuster = [];

      var beliefTexts = this.beliefs.map(function(b, i) {
        return (i + 1) + '. ' + b.belief;
      }).join('\n');

      // Grouping is the whole job now. The resolutions used to be generated
      // here too, but the column that showed them names the affirmations the
      // user actually wrote — so asking for invented ones only cost tokens.
      var prompt = 'Analysiere diese Glaubenssätze und gruppiere sie in 3–5 Kernmuster (Cluster).\n' +
        'Jedes Cluster erhält einen prägnanten deutschen Namen und listet die dazugehörigen Glaubenssätze auf.\n' +
        'Gib jeden Glaubenssatz genau so zurück, wie er dasteht.\n\n' +
        'Glaubenssätze:\n' + beliefTexts + '\n\n' +
        'Antworte ausschließlich mit einem JSON-Array (kein Markdown, kein Text davor oder danach):\n' +
        '[{"title":"Clustername","beliefs":["Glaube 1","Glaube 2"]},...]';

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
          const err = await res.json().catch(function() { return {}; });
          throw new Error((err.error && err.error.message) || ('Fehler ' + res.status));
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
        this.kernmusterError = e.message || 'Analyse fehlgeschlagen.';
      } finally {
        this.isLoadingKernmuster = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.dark-page {
  background: #000;
  min-height: 100vh;
}
.section-header {
  font-size: 0.75rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: 600;
  margin: 20px 20px 6px;
}
.settings-group {
  background: #1c1c1e;
  border-radius: 12px;
  margin: 0 16px;
  overflow: hidden;
}
.settings-row {
  display: flex;
  align-items: center;
  padding: 13px 16px;
  &.tappable {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    &:active { background: #2c2c2e; }
  }
}
.settings-row-body { flex: 1; min-width: 0; }
.settings-label {
  font-size: 0.95rem;
  color: #fff;
  margin: 0 0 2px;
  font-weight: 500;
}
.settings-sub {
  font-size: 0.78rem;
  color: #8e8e93;
  margin: 0;
}
.changed-sub { color: #fd9927 !important; }
.settings-sep {
  height: 1px;
  background: #2c2c2e;
  margin: 0 0 0 16px;
}

.pattern-item {
  padding: 13px 16px;
}
.pattern-title {
  font-size: 0.88rem;
  color: #fff;
  font-weight: 600;
  margin: 0 0 4px;
}
.pattern-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.pattern-line {
  font-size: 0.75rem;
  color: #8e8e93;
  margin: 0 0 4px;
  line-height: 1.45;
  &:last-child { margin-bottom: 0; }
}
.pattern-empty { color: #636366; }

/* Loading / info */
.loading-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 16px;
}
.loading-label {
  font-size: 0.875rem;
  color: #8e8e93;
}
.info-row {
  padding: 13px 16px;
}
.info-text {
  font-size: 0.875rem;
  color: #8e8e93;
  margin: 0;
}
.error-text {
  font-size: 0.875rem;
  color: #ff453a;
  margin: 0;
}

/* Affektprofil two-column */
.affect-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 20px 16px 0;
  .settings-group { margin: 0; }
}
.col-label {
  font-size: 0.7rem;
  color: #8e8e93;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 5px;
  text-align: left;
}
.stat-item-sm {
  padding: 9px 10px !important;
}
.stat-name-sm {
  font-size: 0.82rem !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

/* Stat bars */
.stat-item {
  padding: 13px 16px;
}
.stat-header-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
  min-width: 0;
}
.stat-name {
  font-size: 0.95rem;
  color: #fff;
  font-weight: 500;
}
.stat-count {
  font-size: 0.78rem;
  color: #8e8e93;
  flex-shrink: 0;
  margin-left: 8px;
}
.stat-bar-bg {
  height: 16px;
  background: #2c2c2e;
  border-radius: 8px;
  overflow: hidden;
}
.stat-bar-fill {
  height: 100%;
  border-radius: 8px;
  transition: width 0.5s ease;
  min-width: 8px;
}
</style>
