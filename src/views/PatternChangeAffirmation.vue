<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Affirmationen</h1>
      <template v-if="withoutBelief">
        <p class="body-1 belief-quote mt-1">„{{ withoutBelief }}"</p>
        <div v-if="withoutBeliefFeelings && withoutBeliefFeelings.length" class="mb-2">
          <tag-list :items="withoutBeliefFeelings"></tag-list>
        </div>
      </template>
      <p class="body-1 grey--text mt-2">Manifestiere deine neue Perspektive und Gefühle in positive, kraftvolle Affirmationen.</p>
    </v-flex>

    <v-flex v-if="selectedAffirmations.length" class="mb-2">
      <div class="selected-chips">
        <v-chip
          v-for="a in selectedAffirmations"
          :key="a.text"
          close
          class="selected-chip"
          @input="removeSelected(a.text)"
        >{{ a.text }}</v-chip>
      </div>
    </v-flex>

    <v-flex class="mt-1">
      <v-menu v-if="unselectedAffirmations.length" :close-on-content-click="true">
        <v-btn slot="activator" flat color="primary">
          <v-icon left small>arrow_drop_down</v-icon>
          Bestehende hinzufügen
        </v-btn>
        <v-list>
          <v-list-tile
            v-for="a in unselectedAffirmations"
            :key="a.text"
            @click="addAffirmation(a.text)"
          >
            <v-list-tile-title>{{ a.text }}</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-menu>

      <template v-if="showNewInput">
        <v-text-field
          v-model="newAffirmationText"
          label="Neue Affirmation"
          placeholder="Ich bin..."
          single-line
          hide-details
          class="mb-2"
          @keyup.enter="createAffirmation"
          @focus="$emit('focussed')"
          @blur="$emit('blurred')"
        ></v-text-field>
        <v-btn small flat color="primary" :disabled="!newAffirmationText.trim()" @click="createAffirmation">Hinzufügen</v-btn>
        <v-btn small flat color="grey" @click="cancelNew">Abbrechen</v-btn>
      </template>
      <template v-else>
        <v-btn small flat color="primary" @click="showNewInput = true">
          <v-icon small left>add</v-icon>
          Neue Affirmation
        </v-btn>
      </template>
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
import TagList from '@/components/TagList.vue';

export default {
  name: 'pattern-change-affirmation',
  components: { TagList },
  props: {
    belief: { type: String, default: '' },
    withoutBelief: { type: String, default: '' },
    withoutBeliefFeelings: { type: Array, default: function() { return []; } },
    initialAffirmations: { type: Array, default: function() { return []; } },
    allAffirmations: { type: Array, default: function() { return []; } },
  },
  data() {
    var initial = this.initialAffirmations.map(function(a) { return { text: a.text, count: a.count || 1 }; });
    var selectedTexts = initial.map(function(a) { return a.text; });
    // merge allAffirmations with initial, deduplicating by text
    var seen = {};
    var merged = initial.slice();
    selectedTexts.forEach(function(t) { seen[t] = true; });
    this.allAffirmations.forEach(function(a) {
      if (!seen[a.text]) {
        seen[a.text] = true;
        merged.push({ text: a.text, count: a.count || 1 });
      }
    });
    return {
      pool: merged,
      selectedTexts: selectedTexts,
      showNewInput: false,
      newAffirmationText: '',
      suggestions: [],
      isLoading: false,
      errorMsg: '',
      showApiKeyInput: false,
      apiKeyInput: '',
      apiKey: localStorage.getItem('nvc.apiKey') || '',
    };
  },
  computed: {
    selectedAffirmations() {
      var selectedTexts = this.selectedTexts;
      return this.pool.filter(function(a) { return selectedTexts.indexOf(a.text) !== -1; });
    },
    unselectedAffirmations() {
      var selectedTexts = this.selectedTexts;
      return this.pool.filter(function(a) { return selectedTexts.indexOf(a.text) === -1; });
    },
  },
  watch: {
    selectedTexts: function() {
      this.$emit('changed', this.selectedAffirmations.slice());
    },
  },
  methods: {
    addAffirmation(text) {
      if (this.selectedTexts.indexOf(text) === -1) {
        this.selectedTexts = this.selectedTexts.concat([text]);
      }
    },
    removeSelected(text) {
      this.selectedTexts = this.selectedTexts.filter(function(t) { return t !== text; });
    },
    cancelNew() {
      this.showNewInput = false;
      this.newAffirmationText = '';
    },
    createAffirmation() {
      var text = this.newAffirmationText.trim();
      if (!text) return;
      if (this.pool.every(function(a) { return a.text !== text; })) {
        this.pool = this.pool.concat([{ text: text, count: 1 }]);
      }
      this.selectedTexts = this.selectedTexts.concat([text]);
      this.newAffirmationText = '';
      this.showNewInput = false;
    },
    acceptSuggestion(s) {
      if (this.pool.every(function(a) { return a.text !== s; })) {
        this.pool = this.pool.concat([{ text: s, count: 1 }]);
      }
      if (this.selectedTexts.indexOf(s) === -1) {
        this.selectedTexts = this.selectedTexts.concat([s]);
      }
    },
    saveApiKey() {
      this.apiKey = this.apiKeyInput;
      localStorage.setItem('nvc.apiKey', this.apiKey);
      this.apiKeyInput = '';
      this.showApiKeyInput = false;
      this.generateSuggestions();
    },
    buildSuggestionsPrompt() {
      var lines = ['Du hilfst dabei, positive Affirmationen zu formulieren.'];
      if (this.withoutBelief) {
        lines.push('Neue Perspektive: "' + this.withoutBelief + '"');
      } else {
        lines.push('Glaubenssatz: "' + this.belief + '"');
      }
      var feelingNames = (this.withoutBeliefFeelings || []).map(function(f) { return f.name; }).join(', ');
      if (feelingNames) lines.push('Gefühle dabei: ' + feelingNames);
      lines.push('Generiere genau 5 kurze positive Affirmationen (je max. 12 Wörter) als Ich-Aussagen im Präsens. Inspirierend, konkret, auf die neue Perspektive bezogen.\nNur die 5 Sätze, einer pro Zeile, ohne Nummerierung.');
      return lines.join('\n');
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
            messages: [{ role: 'user', content: this.buildSuggestionsPrompt() }],
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
.selected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.selected-chip {
  white-space: normal;
  height: auto !important;
  padding: 4px 10px !important;
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
