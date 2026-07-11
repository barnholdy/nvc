<template>
  <div class="dark-page">
    <v-toolbar color="#000" dark flat app>
      <v-toolbar-title>Empathie</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$router.push('/settings')">
        <v-icon color="#4ade80">settings</v-icon>
      </v-btn>
    </v-toolbar>

    <v-content>
      <div class="intro-card">
        <span class="intro-icon">❤️</span>
        <p class="intro-title">Einfühlsam begegnen</p>
        <p class="intro-text">Lass dir spiegeln, was dich gerade bewegt — auf Basis all deiner Muster und Überzeugungen.</p>
      </div>

      <div class="ios-section">
        <template v-if="showApiKeyInput">
          <p class="section-label">Anthropic API Key</p>
          <div class="input-row">
            <v-text-field
              v-model="apiKeyInput"
              placeholder="sk-ant-..."
              type="password"
              single-line
              hide-details
              class="dark-input"
            ></v-text-field>
          </div>
          <div class="action-row mt-3">
            <button class="primary-btn" :disabled="!apiKeyInput" @click="saveApiKey">Speichern &amp; generieren</button>
            <button class="ghost-btn" @click="showApiKeyInput = false">Abbrechen</button>
          </div>
        </template>
        <template v-else>
          <div class="generate-row">
            <button
              class="primary-btn"
              :disabled="isLoading || isDataUnchanged"
              @click="generate"
            >
              <span v-if="isLoading">Wird generiert…</span>
              <span v-else>❤️ Empathie generieren</span>
            </button>
            <button v-if="apiKey" class="icon-btn" @click="showApiKeyInput = true" title="API Key ändern">
              <v-icon small color="#636366">settings</v-icon>
            </button>
          </div>
          <p v-if="isDataUnchanged && text" class="hint-text">Keine neuen Daten seit der letzten Generierung.</p>
        </template>

        <p v-if="errorMsg" class="error-text mt-2">{{ errorMsg }}</p>

        <div v-if="text !== null" class="empathy-result mt-4">
          <p class="empathy-text">{{ text }}</p>
        </div>
      </div>
    </v-content>

    <v-bottom-nav :value="true" fixed app color="#1c1c1e" class="dark-nav">
      <v-btn flat color="grey" to="/patterns">
        <v-icon>bolt</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/beliefs">
        <v-icon>lightbulb_outline</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/affirmations">
        <v-icon>stars</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/actions">
        <v-icon>directions_run</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/empathy">
        <v-icon>favorite_border</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
const STORAGE_KEY = 'nvc.globalEmpathy';

function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return (hash >>> 0).toString(16);
}

export default {
  name: 'empathy-view',
  data() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) {}
    return {
      text: saved ? saved.text : null,
      savedHash: saved ? (saved.hash || null) : null,
      isLoading: false,
      errorMsg: '',
      showApiKeyInput: false,
      apiKeyInput: '',
      apiKey: localStorage.getItem('nvc.apiKey') || '',
    };
  },
  computed: {
    currentHash() {
      const patterns = this.$store.getters.patterns;
      const beliefs = this.$store.getters.beliefs;
      return hashString(JSON.stringify({ patterns, beliefs }));
    },
    isDataUnchanged() {
      return this.savedHash !== null && this.currentHash === this.savedHash;
    },
  },
  methods: {
    buildPrompt() {
      const patterns = this.$store.getters.patterns;
      const beliefs = this.$store.getters.beliefs;
      const system = 'Du bist ein einfühlsamer Gesprächsbegleiter. Eine Person teilt dir ihre persönlichen Muster und Überzeugungen mit – in strukturierter Form. Jedes Muster beschreibt eine Situation und die damit verbundenen Überzeugungen. Jede Überzeugung enthält die Überzeugung selbst, damit verbundene Gefühle, Reaktionen und Bedürfnisse.\n\nDeine Aufgabe ist es, empathisch zu antworten. Halte dich dabei an folgende Prinzipien:\n\n1. Erst spiegeln, dann würdigen – Fasse zusammen, was du gehört hast, ohne zu interpretieren oder zu bewerten. Zeige, dass du wirklich zugehört hast.\n2. Den Kern berühren – Benenne die wiederkehrenden Gefühle und Bedürfnisse direkt und warmherzig. Die Person soll sich gesehen fühlen, nicht analysiert.\n3. Muster erkennen – Wenn sich Themen über mehrere Einträge wiederholen, würdige das behutsam.\n4. Keine Ratschläge, keine Lösungen – Außer die Person fragt explizit danach.\n5. Offene Einladung zum Ende – Schließe mit einer offenen Frage oder einem Raumangebot, kein Druck.\n\nTon: warm, ruhig, präsent. Antworte auf Deutsch.';
      const lines = [system, ''];
      if (patterns.length > 0) {
        lines.push('MUSTER:');
        patterns.forEach((p, i) => {
          lines.push('');
          lines.push(`Muster ${i + 1}${p.name ? ` (${p.name})` : ''}:`);
          if (p.trigger) lines.push(`  Situation: ${p.trigger}`);
          const linked = (p.beliefs || []).map(id => beliefs.find(b => b.time === id)).filter(Boolean);
          if (linked.length) lines.push(`  Glaubenssätze: ${linked.map(b => b.belief).join('; ')}`);
        });
      }
      if (beliefs.length > 0) {
        lines.push('');
        lines.push('ÜBERZEUGUNGEN:');
        beliefs.forEach((b, i) => {
          lines.push('');
          lines.push(`Überzeugung ${i + 1}:`);
          lines.push(`  Glaube: ${b.belief}`);
          const feelings = b.feelings && b.feelings.length ? b.feelings.map(f => f.name).join(', ') : '';
          if (feelings) lines.push(`  Gefühl: ${feelings}`);
          if (b.withBelief) lines.push(`  Reaktion: ${b.withBelief}`);
          const needs = b.needs && b.needs.length ? b.needs.map(n => n.name).join(', ') : '';
          if (needs) lines.push(`  Bedürfnis: ${needs}`);
        });
      }
      return lines.join('\n');
    },
    saveApiKey() {
      this.apiKey = this.apiKeyInput;
      localStorage.setItem('nvc.apiKey', this.apiKey);
      this.apiKeyInput = '';
      this.showApiKeyInput = false;
      this.generate();
    },
    generate() {
      if (!this.apiKey) { this.showApiKeyInput = true; return; }
      this.isLoading = true;
      this.errorMsg = '';
      const hash = this.currentHash;
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          messages: [{ role: 'user', content: this.buildPrompt() }],
        }),
      }).then((res) => {
        if (!res.ok) {
          return res.json().catch(() => ({})).then((err) => { throw new Error((err.error && err.error.message) || `Fehler ${res.status}`); });
        }
        return res.json();
      }).then((data) => {
        this.text = data.content[0].text.trim();
        this.savedHash = hash;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ text: this.text, hash }));
      }).catch((e) => {
        this.errorMsg = e.message || 'Empathie konnte nicht geladen werden.';
      }).then(() => {
        this.isLoading = false;
      });
    },
  },
};
</script>

<style scoped lang="scss">
.dark-page {
  background: #000;
  min-height: 100vh;
}
.page-title-area {
  padding: 8px 20px 20px;
}
.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
  margin: 0 0 8px;
}
.page-sub {
  font-size: 0.875rem;
  color: #8e8e93;
  margin: 0;
  line-height: 1.5;
}
.ios-section {
  padding: 0 16px;
}
.section-label {
  font-size: 0.78rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: 600;
  margin: 0 0 8px 4px;
}
.input-row {
  background: #1c1c1e;
  border-radius: 12px;
  padding: 4px 12px;
}
.generate-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.primary-btn {
  background: #4ade80;
  color: #000;
  border: none;
  border-radius: 12px;
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:disabled { opacity: 0.35; cursor: not-allowed; }
  &:active:not(:disabled) { background: #3dcc70; transform: scale(0.98); }
}
.ghost-btn {
  background: none;
  border: none;
  color: #4ade80;
  font-size: 0.95rem;
  font-family: inherit;
  cursor: pointer;
  padding: 12px 0;
  -webkit-tap-highlight-color: transparent;
}
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  -webkit-tap-highlight-color: transparent;
}
.hint-text {
  font-size: 0.8rem;
  color: #636366;
  margin: 8px 0 0;
}
.error-text {
  font-size: 0.85rem;
  color: #ff453a;
  margin: 0;
}
.empathy-result {
  background: #1c1c1e;
  border-radius: 16px;
  padding: 20px;
}
.empathy-text {
  font-size: 0.95rem;
  color: #ebebf5;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
}
.mt-2 { margin-top: 8px !important; }
.mt-3 { margin-top: 12px !important; }
.mt-4 { margin-top: 20px !important; }

.dark-nav { border-top: 1px solid #2c2c2e !important; }
</style>
