<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Groll benennen</h1>
      <p class="subheading grey--text resentment-quote mt-1">„{{ resentment }}"</p>
      <p class="body-1 grey--text mt-2">Gib diesem Groll einen kurzen, treffenden Namen.</p>
    </v-flex>
    <v-flex>
      <v-text-field
        placeholder="..."
        v-model="text"
        multi-line
        rows="4"
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
    </v-flex>

    <v-flex class="mt-1">
      <template v-if="showApiKeyInput">
        <p class="caption grey--text mb-1">Anthropic API Key eingeben, um Vorschläge zu generieren:</p>
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
        <v-btn small flat color="primary" :loading="isLoading" @click="generateSuggestions">
          <v-icon small left>lightbulb_outline</v-icon>
          Vorschläge
        </v-btn>
        <v-btn v-if="apiKey" small flat icon @click="showApiKeyInput = true" title="API Key ändern">
          <v-icon small color="grey lighten-1">settings</v-icon>
        </v-btn>
      </template>
    </v-flex>

    <v-flex v-if="suggestions.length" class="mt-2">
      <p class="caption grey--text mb-1">Tippe auf einen Vorschlag, um ihn zu übernehmen:</p>
      <div class="suggestions">
        <v-chip
          v-for="(s, i) in suggestions"
          :key="i"
          small
          class="suggestion-chip"
          @click="acceptSuggestion(s)"
        >{{ s }}</v-chip>
      </div>
    </v-flex>

    <v-flex v-if="errorMsg" class="mt-1">
      <p class="caption red--text">{{ errorMsg }}</p>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  name: 'resentment-add-name',
  props: {
    resentment: { type: String, default: '' },
    parents: { type: String, default: '' },
    initialValue: { type: String, default: '' },
  },
  data() {
    return {
      text: this.initialValue,
      suggestions: [],
      isLoading: false,
      errorMsg: '',
      showApiKeyInput: false,
      apiKeyInput: '',
      apiKey: localStorage.getItem('nvc.apiKey') || '',
    };
  },
  watch: {
    text(val) { this.$emit('changed', val); },
  },
  methods: {
    saveApiKey() {
      this.apiKey = this.apiKeyInput;
      localStorage.setItem('nvc.apiKey', this.apiKey);
      this.apiKeyInput = '';
      this.showApiKeyInput = false;
      this.generateSuggestions();
    },
    async generateSuggestions() {
      if (!this.apiKey) {
        this.showApiKeyInput = true;
        return;
      }
      this.isLoading = true;
      this.errorMsg = '';
      this.suggestions = [];
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
            max_tokens: 200,
            messages: [{
              role: 'user',
              content: 'Jemand hat diesen Groll beschrieben: "' + this.resentment + '"\n\nUnd diesen Bezug zum Elternhaus: "' + this.parents + '"\n\nGeneriere genau 5 kurze, treffende Namen für diesen Groll (je max. 5 Wörter). Die Namen sollen das Wesentliche des Grolls verdichten.\n\nAntworte ausschließlich mit den 5 Namen, einer pro Zeile, ohne Nummerierung und ohne Aufzählungszeichen.',
            }],
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(function() { return {}; });
          throw new Error((err.error && err.error.message) || ('Fehler ' + res.status));
        }
        const data = await res.json();
        this.suggestions = data.content[0].text
          .split('\n')
          .map(function(s) { return s.trim(); })
          .filter(function(s) { return s.length > 0; })
          .slice(0, 5);
      } catch (e) {
        this.errorMsg = e.message || 'Vorschläge konnten nicht geladen werden.';
      } finally {
        this.isLoading = false;
      }
    },
    acceptSuggestion(s) {
      this.text = s;
    },
  },
};
</script>

<style scoped lang="scss">
.resentment-quote {
  font-style: italic;
}
.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.suggestion-chip {
  cursor: pointer;
  white-space: normal;
  height: auto !important;
  padding: 4px 10px !important;
}
</style>
