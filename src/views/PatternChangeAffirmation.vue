<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Affirmationen</h1>
      <p v-if="belief" class="subheading grey--text belief-quote mt-1">„{{ belief }}“</p>
      <belief-context :perspective="withoutBelief"></belief-context>

      <!-- The feelings are named in the question now, not listed above it. -->
      <feeling-words
        class="body-1 grey--text mt-3 wizard-prompt"
        :feelings="withoutBeliefFeelings"
        prefix="Diese neue Perspektive lässt dich "
        :suffix="' fühlen. ' + ASK"
        :fallback="ASK">
      </feeling-words>

    </v-flex>

    <!-- Writing is the way in; the lists below only fill this field. -->
    <v-flex class="mb-2">
      <p class="caption grey--text mb-1">Deine Affirmation:</p>
      <v-textarea
        v-model="text"
        placeholder="Ich bin..."
        auto-grow
        rows="4"
        hide-details
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-textarea>
    </v-flex>

    <!-- Only meaningful once there is a sentence to read aloud -->
    <v-flex v-if="hasText" class="mb-4">
      <p class="body-1 grey--text mb-2">Lies dir den Satz laut vor. Wie wahr fühlt er sich an?</p>
      <div class="slider-row">
        <span class="slider-end-label">0</span>
        <input type="range" min="0" max="10" v-model.number="truth" class="truth-slider" />
        <span class="slider-end-label">10</span>
      </div>
      <p class="slider-value-label" :style="{ color: truthHint.color }">{{ truth }}</p>
      <p class="truth-target">Ziel: 6–8</p>
      <div class="truth-hint" :style="{ borderColor: truthHint.color }">
        <p class="truth-hint-title" :style="{ color: truthHint.color }">{{ truthHint.title }}</p>
        <p class="truth-hint-text">{{ truthHint.text }}</p>
      </div>
    </v-flex>

    <v-flex v-if="otherAffirmations.length" class="mt-1">
      <p class="caption grey--text mb-1">Aus deinen Affirmationen übernehmen:</p>
      <div class="chip-list">
        <v-chip
          v-for="a in otherAffirmations"
          :key="a.text"
          class="available-chip"
          @click="use(a.text)"
        >{{ a.text }}</v-chip>
      </div>
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
      <p class="caption grey--text mb-1">Tippe auf einen Vorschlag, um ihn zu übernehmen:</p>
      <div class="suggestions">
        <v-chip
          v-for="(s, i) in suggestions"
          :key="i"
          small
          class="suggestion-chip"
          @click="use(s)"
        >{{ s }}</v-chip>
      </div>
    </v-flex>

    <v-flex v-if="errorMsg" class="mt-1">
      <p class="caption red--text">{{ errorMsg }}</p>
    </v-flex>
  </v-layout>
</template>

<script>
import BeliefContext from '@/views/BeliefContext.vue';
import FeelingWords from '@/components/FeelingWords.vue';
import { normalizeTruth, truthHint } from '@/utils/affirmationTruth';

const ASK = 'Formuliere einen Satz, der zu dieser gefühlten neuen Perspektive passt. '
  + 'Er hilft dir, die alte Überzeugung in diese Richtung zu verschieben. '
  + 'Halte den Satz glaubwürdig: Der positivste Satz, den du gerade noch als wahr '
  + 'empfinden kannst.';

export default {
  name: 'pattern-change-affirmation',
  components: { BeliefContext, FeelingWords },
  props: {
    belief: { type: String, default: '' },
    withoutBelief: { type: String, default: '' },
    withoutBeliefFeelings: { type: Array, default: function() { return []; } },
    initialAffirmations: { type: Array, default: function() { return []; } },
    allAffirmations: { type: Array, default: function() { return []; } },
  },
  data() {
    // One affirmation per belief: anything beyond the first is dropped.
    var initial = this.initialAffirmations.slice(0, 1).map(function(a) {
      return { text: a.text, count: a.count || 1, resonance: a.resonance };
    });
    // Everything already written elsewhere, to offer as a starting point.
    var seen = {};
    var pool = [];
    initial.forEach(function(a) { seen[a.text] = true; });
    this.allAffirmations.forEach(function(a) {
      if (!a || !a.text || seen[a.text]) return;
      seen[a.text] = true;
      pool.push({ text: a.text, count: a.count || 1 });
    });
    return {
      pool: pool,
      // What the field holds — the affirmation itself, however it got there.
      text: initial.length ? initial[0].text : '',
      count: initial.length ? initial[0].count : 1,
      truth: normalizeTruth(initial.length ? initial[0].resonance : undefined),
      suggestions: [],
      isLoading: false,
      errorMsg: '',
      showApiKeyInput: false,
      apiKeyInput: '',
      apiKey: localStorage.getItem('nvc.apiKey') || '',
    };
  },
  computed: {
    ASK() { return ASK; },
    truthHint() { return truthHint(this.truth); },
    hasText() { return this.text.trim() !== ''; },
    // Whatever is in the field is already on screen; the list offers the rest.
    otherAffirmations() {
      var current = this.text.trim();
      return this.pool.filter(function(a) { return a.text !== current; });
    },
  },
  watch: {
    text: function() { this.emitChange(); },
    truth: function() { this.emitChange(); },
  },
  methods: {
    emitChange() {
      // An empty field means no affirmation, not one without words.
      var text = this.text.trim();
      this.$emit('changed', text
        ? [{ text: text, count: this.count || 1, resonance: this.truth }]
        : []);
    },
    // Existing affirmations and generated suggestions both land in the field,
    // where they can still be reworded.
    use(text) {
      this.text = text;
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
.belief-quote { font-style: italic; }
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
.truth-target {
  text-align: center;
  font-size: 0.72rem;
  font-weight: 600;
  color: #636366;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 2px 0 10px;
}
.truth-hint {
  padding: 10px 14px;
  border-radius: 12px;
  border: 1.5px solid;
  transition: border-color 0.2s ease;
}
.truth-hint-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 2px;
}
.truth-hint-text {
  font-size: 0.8rem;
  color: #8e8e93;
  line-height: 1.5;
  margin: 0;
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
