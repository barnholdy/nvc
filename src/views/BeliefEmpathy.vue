<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-toolbar-title>Empathie bekommen</v-toolbar-title>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <v-layout column>
          <v-flex class="mt-2 mb-3">
            <p class="subheading grey--text belief-quote mt-1">„{{ entry ? entry.belief : '' }}“</p>
            <p class="body-1 grey--text mt-2">Lass dir einfühlsam spiegeln, was du gerade erlebst.</p>
          </v-flex>

          <v-flex class="mt-1">
            <template v-if="showApiKeyInput">
              <p class="caption grey--text mb-1">Anthropic API Key eingeben, um Empathie zu generieren:</p>
              <v-text-field
                v-model="apiKeyInput"
                label="API Key"
                type="password"
                single-line
                hide-details
                class="mb-2"
              ></v-text-field>
              <v-btn small flat color="primary" :disabled="!apiKeyInput" @click="saveApiKey">Speichern & generieren</v-btn>
              <v-btn small flat color="grey" @click="showApiKeyInput = false">Abbrechen</v-btn>
            </template>
            <template v-else>
              <v-btn flat color="primary" :loading="isLoading" @click="generate">
                <v-icon left>favorite_border</v-icon>
                Empathie generieren
              </v-btn>
              <v-btn v-if="apiKey" small flat icon @click="showApiKeyInput = true" title="API Key ändern">
                <v-icon small color="grey lighten-1">settings</v-icon>
              </v-btn>
            </template>
          </v-flex>

          <v-flex v-if="errorMsg" class="mt-1">
            <p class="caption red--text">{{ errorMsg }}</p>
          </v-flex>

          <v-flex v-if="text !== null" class="mt-3">
            <div class="empathy-rendered md-content" v-html="renderMd(text)"></div>
          </v-flex>
        </v-layout>
      </v-container>

      <v-footer v-if="text !== null" :fixed="isFooterFixed" color="white elevation-3" height="44">
        <v-btn @click="save" block large color="primary">speichern</v-btn>
      </v-footer>
    </v-content>
  </div>
</template>

<script>
import { dedupeByName } from '@/utils/emotions';
import { experimentsOf } from '@/utils/experiment';
import { normalizeTruth } from '@/utils/affirmationTruth';
export default {
  name: 'belief-empathy',
  data() {
    const entry = this.$store.getters.beliefs
      .find(function(b) { return b.time === parseInt(this.$route.params.time, 10); }, this);
    return {
      entry: entry || null,
      text: entry && entry.empathy ? entry.empathy : null,
      isLoading: false,
      errorMsg: '',
      showApiKeyInput: false,
      apiKeyInput: '',
      apiKey: localStorage.getItem('nvc.apiKey') || '',
      isFooterFixed: true,
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
    buildPrompt() {
      var e = this.entry;
      var system = 'Du bist ein einfühlsamer Gesprächsbegleiter. Eine Person teilt dir eine persönliche Situation in strukturierter Form mit – bestehend aus:\n\n- Glaube: Welche Überzeugung oder Interpretation hat die Person?\n- Gefühl: Welche Emotion(en) entstehen dadurch?\n- Reaktion: Wie hat die Person reagiert (innerlich oder äußerlich)?\n- Bedürfnis: Welches unerfüllte Bedürfnis steckt dahinter?\n- Ursprungshypothese: Woher könnte dieser Glaube oder dieses Muster stammen?\n- Veränderungsarbeit: Ausnahmen, eine neue Perspektive, neue Gefühle und ein Affirmationssatz – falls die Person daran schon gearbeitet hat.\n- Verhaltensexperimente: konkrete Situationen, in denen die Person die Überzeugung getestet hat, mit ihrer vorab notierten Befürchtung und dem tatsächlichen Ausgang.\n\nDeine Aufgabe ist es, empathisch zu antworten. Halte dich dabei an folgende Prinzipien:\n\n1. Erst spiegeln, dann würdigen – Fasse zusammen, was du gehört hast, ohne zu interpretieren oder zu bewerten. Zeige, dass du wirklich zugehört hast.\n2. Den Kern berühren – Benenne das Gefühl und das Bedürfnis direkt und warmherzig. Die Person soll sich gesehen fühlen, nicht analysiert.\n3. Die Ursprungshypothese würdigen – Anerkenne, wie viel Selbstreflexion darin steckt, ohne sie zu bestätigen oder zu widerlegen.\n4. Keine Ratschläge, keine Lösungen – Außer die Person fragt explizit danach.\n5. Offene Einladung zum Ende – Schließe mit einer offenen Frage oder einem Raumangebot, kein Druck.\n\nTon: warm, ruhig, präsent. Nicht therapeutisch-distanziert, nicht überschwänglich. Sprich die Person direkt an (du/Sie je nach Input). Antworte auf Deutsch, es sei denn, die Person schreibt auf Englisch.';

      var lines = [system, ''];
      if (e.belief) lines.push('Glaube: ' + e.belief);
      var feelings = e.feelings && e.feelings.length ? e.feelings.map(function(f) { return f.name; }).join(', ') : '';
      if (feelings) lines.push('Gefühl: ' + feelings);
      if (e.withBelief) lines.push('Reaktion: ' + e.withBelief);
      var needs = e.needs && e.needs.length ? dedupeByName(e.needs).map(function(n) { return n.name; }).join(', ') : '';
      if (needs) lines.push('Bedürfnis: ' + needs);
      var r = e.reflection || {};
      if (r.origin) lines.push('Ursprungshypothese: ' + r.origin);

      if (r.exceptions) lines.push('Ausnahmen: ' + r.exceptions);
      if (r.withoutBelief) lines.push('Neue Perspektive: ' + r.withoutBelief);
      var newFeelings = r.withoutBeliefFeelings && r.withoutBeliefFeelings.length
        ? r.withoutBeliefFeelings.map(function(f) { return f.name; }).join(', ')
        : '';
      if (newFeelings) lines.push('Neue Gefühle: ' + newFeelings);
      if (typeof r.bodyIntensity === 'number') {
        lines.push('Körperempfindung dabei: ' + r.bodyIntensity + ' von 10');
      }
      (e.affirmations || []).forEach(function(a) {
        if (!a || !a.text) return;
        var truth = typeof a.resonance === 'number' ? ' (Glaubwürdigkeit ' + normalizeTruth(a.resonance) + ' von 10)' : '';
        lines.push('Affirmation: ' + a.text + truth);
      });
      experimentsOf(e).forEach(function(x) {
        var parts = ['Verhaltensexperiment: ' + (x.situation || '—')];
        if (x.fear) {
          parts.push('Befürchtung: ' + x.fear
            + (typeof x.fearExpected === 'number' ? ' (erwartet ' + x.fearExpected + ' von 100)' : ''));
        }
        if (x.outcome) {
          parts.push('Tatsächlich: ' + x.outcome
            + (typeof x.fearActual === 'number' ? ' (real ' + x.fearActual + ' von 100)' : ''));
        }
        if (x.learning) parts.push('Erkenntnis: ' + x.learning);
        lines.push(parts.join(' | '));
      });
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
      }).catch(function(e) {
        self.errorMsg = e.message || 'Empathie konnte nicht geladen werden.';
      }).then(function() {
        self.isLoading = false;
      });
    },
    save() {
      this.$store.dispatch('updateBelief', Object.assign({}, this.entry, { empathy: this.text }));
      this.$router.push('/beliefs');
    },
    close() {
      this.$router.push('/beliefs');
    },
  },
};
</script>

<style scoped lang="scss">
.belief-quote {
  font-style: italic;
}
.empathy-rendered {
  font-size: 0.95rem;
  color: #ebebf5;
  line-height: 1.7;
  background: #1c1c1e;
  border-radius: 12px;
  padding: 16px;
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
