<template>
  <div>
    <v-toolbar color="white" app>
      <v-toolbar-title>Empathie</v-toolbar-title>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <v-layout column>
          <v-flex class="mt-2 mb-3">
            <h1 class="headline font-weight-regular">Empathie bekommen</h1>
            <p class="body-1 grey--text mt-2">Lass dir einfühlsam spiegeln, was dich gerade bewegt — auf Basis aller deiner Muster und Überzeugungen.</p>
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
              <v-btn flat color="primary" :loading="isLoading" :disabled="isDataUnchanged" @click="generate">
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
            <v-textarea
              v-model="text"
              auto-grow
              hide-details
            ></v-textarea>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>

    <v-bottom-nav :value="true" fixed app color="white" class="elevation-3">
      <v-btn flat color="grey" to="/patterns">
        <span>Muster</span>
        <v-icon>repeat</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/beliefs">
        <span>Überzeugungen</span>
        <v-icon>lightbulb_outline</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/affirmations">
        <span>Affirmationen</span>
        <v-icon>stars</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/empathy">
        <span>Empathie</span>
        <v-icon>favorite_border</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
var STORAGE_KEY = 'nvc.globalEmpathy';

function hashString(str) {
  var hash = 5381;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return (hash >>> 0).toString(16);
}

export default {
  name: 'empathy-view',
  data() {
    var saved = null;
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
      var patterns = this.$store.getters.patterns;
      var beliefs = this.$store.getters.beliefs;
      return hashString(JSON.stringify({ patterns: patterns, beliefs: beliefs }));
    },
    isDataUnchanged() {
      return this.savedHash !== null && this.currentHash === this.savedHash;
    },
  },
  methods: {
    buildPrompt() {
      var patterns = this.$store.getters.patterns;
      var beliefs = this.$store.getters.beliefs;

      var system = 'Du bist ein einfühlsamer Gesprächsbegleiter. Eine Person teilt dir ihre persönlichen Muster und Überzeugungen mit – in strukturierter Form. Jedes Muster beschreibt eine Situation und die damit verbundenen Überzeugungen. Jede Überzeugung enthält die Überzeugung selbst, damit verbundene Gefühle, Reaktionen und Bedürfnisse.\n\nDeine Aufgabe ist es, empathisch zu antworten. Halte dich dabei an folgende Prinzipien:\n\n1. Erst spiegeln, dann würdigen – Fasse zusammen, was du gehört hast, ohne zu interpretieren oder zu bewerten. Zeige, dass du wirklich zugehört hast.\n2. Den Kern berühren – Benenne die wiederkehrenden Gefühle und Bedürfnisse direkt und warmherzig. Die Person soll sich gesehen fühlen, nicht analysiert.\n3. Muster erkennen – Wenn sich Themen über mehrere Einträge wiederholen, würdige das behutsam.\n4. Keine Ratschläge, keine Lösungen – Außer die Person fragt explizit danach.\n5. Offene Einladung zum Ende – Schließe mit einer offenen Frage oder einem Raumangebot, kein Druck.\n\nTon: warm, ruhig, präsent. Antworte auf Deutsch.';

      var lines = [system, ''];

      if (patterns.length > 0) {
        lines.push('MUSTER:');
        patterns.forEach(function(p, i) {
          lines.push('');
          lines.push('Muster ' + (i + 1) + (p.name ? ' (' + p.name + ')' : '') + ':');
          if (p.trigger) lines.push('  Situation: ' + p.trigger);
          var linkedBeliefs = (p.beliefs || []).map(function(id) {
            return beliefs.find(function(b) { return b.time === id; });
          }).filter(Boolean);
          if (linkedBeliefs.length) {
            lines.push('  Glaubenssätze: ' + linkedBeliefs.map(function(b) { return b.belief; }).join('; '));
          }
        });
      }

      if (beliefs.length > 0) {
        lines.push('');
        lines.push('ÜBERZEUGUNGEN:');
        beliefs.forEach(function(b, i) {
          lines.push('');
          lines.push('Überzeugung ' + (i + 1) + ':');
          lines.push('  Glaube: ' + b.belief);
          var feelings = b.feelings && b.feelings.length ? b.feelings.map(function(f) { return f.name; }).join(', ') : '';
          if (feelings) lines.push('  Gefühl: ' + feelings);
          if (b.withBelief) lines.push('  Reaktion: ' + b.withBelief);
          var needs = b.needs && b.needs.length ? b.needs.map(function(n) { return n.name; }).join(', ') : '';
          if (needs) lines.push('  Bedürfnis: ' + needs);
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
      if (!this.apiKey) {
        this.showApiKeyInput = true;
        return;
      }
      this.isLoading = true;
      this.errorMsg = '';
      var self = this;
      var hash = this.currentHash;
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
      }).then(function(res) {
        if (!res.ok) {
          return res.json().catch(function() { return {}; }).then(function(err) {
            throw new Error((err.error && err.error.message) || ('Fehler ' + res.status));
          });
        }
        return res.json();
      }).then(function(data) {
        self.text = data.content[0].text.trim();
        self.savedHash = hash;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ text: self.text, hash: hash }));
      }).catch(function(e) {
        self.errorMsg = e.message || 'Empathie konnte nicht geladen werden.';
      }).then(function() {
        self.isLoading = false;
      });
    },
  },
};
</script>

<style scoped lang="scss">
</style>
