<template>
  <div class="empathy-panel">
    <template v-if="showApiKeyInput">
      <p class="wizard-note">Anthropic API Key eingeben, um Empathie zu generieren:</p>
      <v-text-field
        v-model="apiKeyInput"
        label="API Key"
        type="password"
        single-line
        hide-details
        class="mb-2"
      ></v-text-field>
      <v-btn small flat color="primary" :disabled="!apiKeyInput" @click="saveApiKey">Speichern &amp; generieren</v-btn>
      <v-btn small flat color="grey" @click="showApiKeyInput = false">Abbrechen</v-btn>
    </template>
    <template v-else>
      <div class="action-row">
        <v-progress-circular
          v-if="isLoading"
          indeterminate
          color="#4ade80"
          size="20"
          width="2"
        ></v-progress-circular>
        <button v-else class="card-btn" @click="generate">Empathie bekommen</button>
        <v-btn v-if="apiKey" small flat icon @click="showApiKeyInput = true" title="API Key ändern">
          <v-icon small color="grey lighten-1">settings</v-icon>
        </v-btn>
      </div>
    </template>

    <p v-if="errorMsg" class="wizard-note error-text">{{ errorMsg }}</p>

    <div v-if="text !== null" class="card empathy-rendered md-content" v-html="renderMd(text)"></div>

    <!-- The question the mirroring is for: not what was said, but what of it
         is worth keeping. Only meaningful once there is something to answer. -->
    <template v-if="text !== null">
      <p class="wizard-question">Was möchtest du davon annehmen?</p>
      <input-card
        v-model="reflection"
        label="Was du annehmen willst"
        :rows="3"
        @input="$emit('reflectionChanged', reflection)"
      ></input-card>
    </template>
  </div>
</template>

<script>
import InputCard from '@/components/InputCard.vue';
import { dedupeByName } from '@/utils/emotions';
import { situationsForBelief } from '@/utils/patterns';

// The empathy request and its rendering, so the wizard step and anything else
// that offers it ask in exactly the same way.
export default {
  name: 'empathy-panel',
  components: { InputCard },
  props: {
    // The belief to reflect on, as stored.
    entry: { type: Object, default: null },
    initialText: { type: String, default: '' },
    initialReflection: { type: String, default: '' },
  },
  data() {
    return {
      text: this.initialText || null,
      reflection: this.initialReflection || '',
      isLoading: false,
      errorMsg: '',
      showApiKeyInput: false,
      apiKeyInput: '',
      apiKey: localStorage.getItem('nvc.apiKey') || '',
    };
  },
  methods: {
    renderMd(raw) {
      if (!raw) return '';
      const esc = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const inline = s => s
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
      const lines = esc.split('\n');
      let html = '', inUl = false;
      lines.forEach(line => {
        if (/^### /.test(line)) {
          if (inUl) { html += '</ul>'; inUl = false; }
          html += `<h3>${inline(line.slice(4))}</h3>`;
        } else if (/^## /.test(line)) {
          if (inUl) { html += '</ul>'; inUl = false; }
          html += `<h2>${inline(line.slice(3))}</h2>`;
        } else if (/^# /.test(line)) {
          if (inUl) { html += '</ul>'; inUl = false; }
          html += `<h1>${inline(line.slice(2))}</h1>`;
        } else if (/^[*-] /.test(line)) {
          if (!inUl) { html += '<ul>'; inUl = true; }
          html += `<li>${inline(line.slice(2))}</li>`;
        } else if (line.trim() === '') {
          if (inUl) { html += '</ul>'; inUl = false; }
          html += '<div class="md-gap"></div>';
        } else {
          if (inUl) { html += '</ul>'; inUl = false; }
          html += `<p>${inline(line)}</p>`;
        }
      });
      if (inUl) html += '</ul>';
      return html;
    },
    // Deliberately narrow: this step only shares what it just asked for —
    // Überzeugung, Situation, Reaktion, Gefühle, Ursprung, Bedürfnisse. Later
    // work (Veränderungsarbeit, Verhaltensexperimente, ...) belongs to other
    // requests, not to the empathy asked for here.
    buildPrompt() {
      var e = this.entry;
      var system = 'Du bist ein einfühlsamer Gesprächsbegleiter. Eine Person teilt dir eine persönliche Situation in strukturierter Form mit – bestehend aus:\n\n- Glaube: Welche Überzeugung oder Interpretation hat die Person?\n- Situation: In welchen Momenten ist diese Überzeugung aufgetaucht?\n- Reaktion: Wie hat die Person reagiert (innerlich oder äußerlich)?\n- Gefühl: Welche Emotion(en) entstehen dadurch?\n- Ursprungshypothese: Woher könnte dieser Glaube oder dieses Muster stammen?\n- Bedürfnis: Welches unerfüllte Bedürfnis steckt dahinter?\n\nDeine Aufgabe ist es, empathisch zu antworten. Halte dich dabei an folgende Prinzipien:\n\n1. Erst spiegeln, dann würdigen – Fasse zusammen, was du gehört hast, ohne zu interpretieren oder zu bewerten. Zeige, dass du wirklich zugehört hast.\n2. Den Kern berühren – Benenne das Gefühl und das Bedürfnis direkt und warmherzig. Die Person soll sich gesehen fühlen, nicht analysiert.\n3. Die Ursprungshypothese würdigen – Anerkenne, wie viel Selbstreflexion darin steckt, ohne sie zu bestätigen oder zu widerlegen.\n4. Keine Ratschläge, keine Lösungen – Außer die Person fragt explizit danach.\n5. Offene Einladung zum Ende – Schließe mit einer offenen Frage oder einem Raumangebot, kein Druck.\n\nTon: warm, ruhig, präsent. Nicht therapeutisch-distanziert, nicht überschwänglich. Sprich die Person direkt an (du/Sie je nach Input). Antworte auf Deutsch, es sei denn, die Person schreibt auf Englisch.';

      var lines = [system, ''];
      if (e.belief) lines.push('Glaube: ' + e.belief);
      var situations = situationsForBelief(this.$store.getters.patterns, e.time);
      if (situations.length) {
        lines.push('Situation: ' + situations.map(function(p) {
          return p.trigger;
        }).join(' | '));
      }
      if (e.withBelief) lines.push('Reaktion: ' + e.withBelief);
      var feelings = e.feelings && e.feelings.length ? e.feelings.map(function(f) { return f.name; }).join(', ') : '';
      if (feelings) lines.push('Gefühl: ' + feelings);
      var r = e.reflection || {};
      if (r.origin) lines.push('Ursprungshypothese: ' + r.origin);
      var needs = e.needs && e.needs.length ? dedupeByName(e.needs).map(function(n) { return n.name; }).join(', ') : '';
      if (needs) lines.push('Bedürfnis: ' + needs);
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
      if (!this.apiKey) {
        this.showApiKeyInput = true;
        return;
      }
      this.isLoading = true;
      this.errorMsg = '';
      var self = this;
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
          max_tokens: 600,
          messages: [{ role: 'user', content: this.buildPrompt() }],
        }),
      }).then(function(res) {
        if (!res.ok) {
          return res.json().catch(function() { return {}; }).then(function(err) {
            throw new Error((err.error && err.error.message) || ('Fehler ' + res.status));
          });
        }
        return res.json();
      }).then(function(data) {
        self.text = data.content[0].text.trim();
        self.$emit('changed', self.text);
      }).catch(function(e) {
        self.errorMsg = e.message || 'Empathie konnte nicht geladen werden.';
      }).then(function() {
        self.isLoading = false;
      });
    },
    close() {
      this.$router.push('/beliefs');
    },
  },
};
</script>

<style scoped lang="scss">
/* The button and the key prompt sit in the page's own margin; everything
   below them is a card and carries its own. */
.empathy-panel > .action-row,
.empathy-panel > .wizard-note,
.empathy-panel > .v-input,
.empathy-panel > .v-btn { margin-left: 16px; margin-right: 16px; }
.action-row { display: flex; align-items: center; gap: 8px; }
.error-text { color: #ff453a !important; }

.empathy-rendered {
  margin-top: 12px;
  font-size: 0.95rem;
  color: #ebebf5;
  line-height: 1.7;
}
.md-content {
  h1, h2, h3 { color: #fff; font-weight: 700; margin: 0 0 6px; line-height: 1.3; }
  h1 { font-size: 1.1rem; }
  h2 { font-size: 1rem; }
  h3 { font-size: 0.95rem; color: #4ade80; }
  p { margin: 0 0 8px; }
  p:last-child { margin-bottom: 0; }
  ul { margin: 0 0 8px; padding-left: 18px; }
  li { margin-bottom: 4px; }
  strong { font-weight: 700; }
  em { font-style: italic; }
  .md-gap { height: 10px; }
}
</style>
