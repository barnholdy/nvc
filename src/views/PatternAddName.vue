<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Name</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}"</p>
      <p class="body-1 grey--text mt-2">Wie möchtest du diesen Eintrag nennen?</p>
    </v-flex>
    <v-flex>
      <v-text-field

        placeholder="..."
        v-model="text"
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
  name: 'pattern-add-name',
  props: {
    belief: String,
    trigger: { type: String, default: '' },
    withBelief: { type: String, default: '' },
    origin: { type: String, default: '' },
    selectedFeelings: { type: Array, default: () => [] },
    selectedNeeds: { type: Array, default: () => [] },
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
            max_tokens: 150,
            messages: [{
              role: 'user',
              content: [
                'Du hilfst beim Benennen von Mustern (Glaubenssätzen) in einem Selbstreflexions-Tool.',
                `Glaubenssatz: "${this.belief}"`,
                this.trigger ? `Situation: "${this.trigger}"` : '',
                this.selectedFeelings.length ? `Gefühle: ${this.selectedFeelings.map(f => f.name).join(', ')}` : '',
                this.withBelief ? `Reaktion: "${this.withBelief}"` : '',
                this.selectedNeeds.length ? `Bedürfnisse: ${this.selectedNeeds.map(n => n.name).join(', ')}` : '',
                this.origin ? `Ursprungshypothese: "${this.origin}"` : '',
                'Generiere genau 5 kurze, prägnante Namen für dieses Muster (je 2–5 Wörter, Substantiv oder kurze Phrase). Keine Sätze, kein „Ich".',
                'Nur die 5 Namen, einer pro Zeile, ohne Nummerierung.',
              ].filter(Boolean).join('\n'),
            }],
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err.error && err.error.message) || `Fehler ${res.status}`);
        }
        const data = await res.json();
        this.suggestions = data.content[0].text
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 0)
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
.belief-quote {
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
