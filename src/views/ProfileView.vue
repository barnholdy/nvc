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

      <div style="height: 40px;"></div>
    </v-content>
  </div>
</template>

<script>

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
  },
  methods: {
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

/* Still used by the Kernmuster columns. */
.col-label {
  font-size: 0.7rem;
  color: #8e8e93;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 5px;
  text-align: left;
}
</style>
