<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-toolbar-title>{{ entry ? (entry.name || entry.belief) : '' }}</v-toolbar-title>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <v-layout column>
          <v-flex class="mt-2 mb-3">
            <h1 class="headline font-weight-regular">Affirmationen</h1>
            <p class="subheading grey--text belief-quote mt-1">„{{ entry ? entry.belief : '' }}"</p>
            <p class="body-1 grey--text mt-2">Forme deinen Glaubenssatz in positive, kraftvolle Ich-Aussagen im Präsens um.</p>
          </v-flex>

          <v-flex>
            <v-text-field
              v-model="text"
              label="Meine Affirmationen..."
              placeholder="..."
              multi-line
              rows="5"
              @focus="isFooterFixed = false"
              @blur="isFooterFixed = true"
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
      </v-container>

      <v-footer :fixed="isFooterFixed" color="white elevation-3" height="44">
        <v-btn @click="save" block large color="primary">speichern</v-btn>
      </v-footer>
    </v-content>
  </div>
</template>

<script>
export default {
  name: 'pattern-affirmation',
  data() {
    const entry = this.$store.getters.patterns
      .find(p => p.time === parseInt(this.$route.params.time, 10));
    return {
      entry: entry || null,
      text: entry ? entry.affirmation || '' : '',
      suggestions: [],
      isLoading: false,
      errorMsg: '',
      showApiKeyInput: false,
      apiKeyInput: '',
      apiKey: localStorage.getItem('nvc.apiKey') || '',
      isFooterFixed: true,
    };
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
      const belief = this.entry ? this.entry.belief : '';
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
              content: `Du hilfst bei der Umformung negativer Glaubenssätze in positive Affirmationen.\nGlaubenssatz: "${belief}"\nGeneriere genau 5 kurze positive Affirmationen (je max. 12 Wörter) als Ich-Aussagen im Präsens. Inspirierend, konkret, auf den Glaubenssatz bezogen.\nNur die 5 Sätze, einer pro Zeile, ohne Nummerierung.`,
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
      this.text = this.text ? `${this.text}\n${s}` : s;
    },
    save() {
      this.$store.dispatch('updatePattern', {
        ...this.entry,
        affirmation: this.text,
      });
      this.$router.push('/patterns');
    },
    close() {
      this.$router.push('/patterns');
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
