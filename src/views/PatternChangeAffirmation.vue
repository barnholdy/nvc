<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Affirmationen</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}"</p>
      <p class="body-1 grey--text mt-2">Forme deinen Glaubenssatz in positive, kraftvolle Ich-Aussagen im Präsens um.</p>
    </v-flex>

    <v-flex v-for="(item, i) in affirmations" :key="i" class="affirmation-row">
      <v-text-field
        v-model="item.text"
        placeholder="Ich bin..."
        single-line
        hide-details
        class="affirmation-field"
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
      <v-btn icon small class="remove-btn" @click="removeField(i)">
        <v-icon color="grey">remove_circle_outline</v-icon>
      </v-btn>
    </v-flex>

    <v-flex class="mt-2">
      <v-btn flat small color="primary" @click="addField">
        <v-icon left small>add</v-icon>
        Neue Affirmation
      </v-btn>
    </v-flex>

    <v-flex class="mt-3">
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
      <p class="caption grey--text mb-1">Tippe auf einen Vorschlag, um ihn hinzuzufügen:</p>
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
  name: 'pattern-change-affirmation',
  props: {
    belief: { type: String, default: '' },
    initialAffirmations: { type: Array, default: () => [] },
  },
  data() {
    const raw = this.initialAffirmations;
    return {
      affirmations: raw.length > 0
        ? raw.map(a => ({ text: a.text, count: a.count || 1 }))
        : [{ text: '', count: 1 }],
      suggestions: [],
      isLoading: false,
      errorMsg: '',
      showApiKeyInput: false,
      apiKeyInput: '',
      apiKey: localStorage.getItem('nvc.apiKey') || '',
    };
  },
  watch: {
    affirmations: {
      deep: true,
      handler(val) {
        this.$emit('changed', val
          .filter(a => a.text.trim())
          .map(a => ({ text: a.text.trim(), count: a.count || 1 })));
      },
    },
  },
  methods: {
    addField() {
      this.affirmations.push({ text: '', count: 1 });
    },
    removeField(i) {
      this.affirmations.splice(i, 1);
      if (this.affirmations.length === 0) {
        this.affirmations.push({ text: '', count: 1 });
      }
    },
    acceptSuggestion(s) {
      const last = this.affirmations[this.affirmations.length - 1];
      if (last && last.text.trim() === '') {
        this.$set(this.affirmations, this.affirmations.length - 1, { text: s, count: 1 });
      } else {
        this.affirmations.push({ text: s, count: 1 });
      }
    },
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
            max_tokens: 300,
            messages: [{
              role: 'user',
              content: `Du hilfst bei der Umformung negativer Glaubenssätze in positive Affirmationen.\nGlaubenssatz: "${this.belief}"\nGeneriere genau 5 kurze positive Affirmationen (je max. 12 Wörter) als Ich-Aussagen im Präsens. Inspirierend, konkret, auf den Glaubenssatz bezogen.\nNur die 5 Sätze, einer pro Zeile, ohne Nummerierung.`,
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
  },
};
</script>

<style scoped lang="scss">
.belief-quote {
  font-style: italic;
}
.affirmation-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}
.affirmation-field {
  flex: 1;
}
.remove-btn {
  flex-shrink: 0;
  margin-top: 8px;
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
