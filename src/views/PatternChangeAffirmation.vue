<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Affirmationen</h1>
      <p v-if="belief" class="subheading grey--text belief-quote mt-1">„{{ belief }}"</p>
      <template v-if="withoutBelief">
        <p class="subheading grey--text belief-quote mt-1">„{{ withoutBelief }}"</p>
        <div v-if="withoutBeliefFeelings && withoutBeliefFeelings.length" class="mb-2">
          <feeling-chips :items="withoutBeliefFeelings" type="feelings"></feeling-chips>
        </div>
      </template>
      <p class="body-1 grey--text mt-2 prompt-lines">Formuliere einen Satz, der zu dem passt, was du gerade gespürt hast.
Er hilft dir, die alte Überzeugung in Richtung der neuen Perspektive zu verschieben.
Halte den Satz glaubwürdig: Der positivste Satz, den du gerade noch als wahr empfinden kannst.</p>

      <div class="mt-4">
        <p class="body-1 grey--text mb-2">Lies dir den Satz laut vor. Wie wahr fühlt er sich an?</p>
        <div class="slider-row">
          <span class="slider-end-label">0</span>
          <input type="range" min="0" max="10" v-model.number="truth" class="truth-slider" />
          <span class="slider-end-label">10</span>
        </div>
        <p class="slider-value-label">{{ truth }}</p>
        <p class="truth-guidance">Ziel: 6–8. Bei 9–10 ist er meist zu brav und trägt nicht durch echte Belastung. Unter 5 ist er noch zu weit weg — dann kleiner formulieren.</p>
      </div>
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
      <div v-if="unselectedAffirmations.length" class="available-chips mt-2">
        <p class="caption grey--text mb-1">Hinzufügen:</p>
        <div class="chip-list">
          <v-chip
            v-for="a in unselectedAffirmations"
            :key="a.text"
            class="available-chip"
            @click="addAffirmation(a.text)"
          >{{ a.text }}</v-chip>
        </div>
      </div>

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
import FeelingChips from '@/components/FeelingChips.vue';

export default {
  name: 'pattern-change-affirmation',
  components: { FeelingChips },
  props: {
    belief: { type: String, default: '' },
    withoutBelief: { type: String, default: '' },
    withoutBeliefFeelings: { type: Array, default: function() { return []; } },
    initialAffirmations: { type: Array, default: function() { return []; } },
    allAffirmations: { type: Array, default: function() { return []; } },
    initialTruth: { type: Number, default: 5 },
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
      truth: this.initialTruth,
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
    truth: function(val) {
      this.$emit('truthChanged', val);
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
.prompt-lines {
  white-space: pre-line;
}
.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px;
}
.slider-end-label {
  font-size: 0.78rem;
  color: #8e8e93;
  flex-shrink: 0;
}
.truth-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #3a3a3c;
  outline: none;
  cursor: pointer;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #4ade80;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }
  &::-moz-range-thumb {
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 50%;
    background: #4ade80;
    cursor: pointer;
  }
}
.slider-value-label {
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 8px 0 0;
}
.truth-guidance {
  font-size: 0.8rem;
  color: #8e8e93;
  line-height: 1.5;
  margin: 6px 0 0;
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
.available-chips { margin-top: 8px; }
.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.available-chip {
  cursor: pointer;
  white-space: normal;
  height: auto !important;
  padding: 4px 10px !important;
}
</style>
