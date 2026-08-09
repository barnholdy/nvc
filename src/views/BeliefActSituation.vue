<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Situation</h1>
      <!-- Both ends of what this action tests, each with the standing it has
           right now — the question below asks you to act as if the second one
           held instead of the first. -->
      <template v-if="entry">
        <p class="step-label mt-3">Überzeugung</p>
        <p class="quote">„{{ entry.belief }}“</p>
        <template v-if="beliefTruth !== null">
          <p class="step-label mt-2">Glaubwürdigkeit</p>
          <div class="slider-row">
            <span class="slider-end-label">0</span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              :value="beliefTruth"
              class="readonly-slider"
              disabled
            />
            <span class="slider-end-label">10</span>
          </div>
        </template>
      </template>

      <template v-if="affirmationText">
        <p class="step-label mt-3">Affirmation</p>
        <p class="quote">„{{ affirmationText }}“</p>
        <template v-if="affirmationTruth !== null">
          <p class="step-label mt-2">Glaubwürdigkeit</p>
          <div class="slider-row">
            <span class="slider-end-label">0</span>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              :value="affirmationTruth"
              class="readonly-slider"
              disabled
            />
            <span class="slider-end-label">10</span>
          </div>
        </template>
      </template>

      <action-prompt :belief="entry" class="mt-4"></action-prompt>
    </v-flex>
    <v-flex>
      <v-text-field
        placeholder="..."
        v-model="text"
        multi-line
        rows="6"
        hide-details
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
    </v-flex>

    <!-- Right under the field: writing is still the way in, and a suggestion is
         a starting point for the field, not a replacement for thinking. -->
    <v-flex class="mt-2">
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
        <v-btn small flat color="primary" :disabled="!apiKeyInput" @click="saveKey">
          Speichern &amp; generieren
        </v-btn>
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

    <v-flex v-if="suggestions.length" class="mt-1">
      <p class="caption grey--text mb-1">Tippe auf einen Vorschlag, um ihn zu übernehmen:</p>
      <div class="suggestions">
        <div
          v-for="(s, i) in suggestions"
          :key="i"
          class="suggestion-row"
          @click="use(s)"
        >{{ s }}</div>
      </div>
    </v-flex>

    <v-flex v-if="errorMsg" class="mt-1">
      <p class="caption red--text">{{ errorMsg }}</p>
    </v-flex>

    <!-- Under the field, where it is a reference rather than a question. -->
    <v-flex v-if="situations.length" class="mt-3">
      <p class="body-1 white--text mb-2">Hier sind vergangene Situationen zur Referenz:</p>
      <situation-rows :situations="situations"></situation-rows>
    </v-flex>
  </v-layout>
</template>

<script>
import ActionPrompt from '@/components/ActionPrompt.vue';
import SituationRows from '@/components/SituationRows.vue';
import { askClaude, loadApiKey, saveApiKey, parseLines } from '@/utils/ai';
import { buildActionPrompt, SUGGESTION_COUNT } from '@/utils/actionSuggestions';
import { beliefCredibility, affirmationCredibility } from '@/utils/credibility';

export default {
  name: 'belief-act-situation',
  components: { ActionPrompt, SituationRows },
  props: {
    // The whole belief, because the prompt names its need, its new feelings and
    // its affirmation.
    entry: { type: Object, default: null },
    situations: { type: Array, default: function() { return []; } },
    // Every situation in the app, so the credibility recorded for this belief
    // can be read off them.
    patterns: { type: Array, default: function() { return []; } },
    // Every belief, so actions already planned elsewhere are not suggested again.
    allBeliefs: { type: Array, default: function() { return []; } },
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
      apiKey: loadApiKey(),
    };
  },
  computed: {
    affirmationText() {
      const list = (this.entry && this.entry.affirmations) || [];
      return list.map(a => a && a.text).filter(Boolean).join(' · ');
    },
    // The same two numbers their own lists show: everything each has been rated
    // at so far, not a reading taken here.
    beliefTruth() {
      return beliefCredibility(this.patterns, this.entry);
    },
    affirmationTruth() {
      const list = (this.entry && this.entry.affirmations) || [];
      const first = list.find(a => a && a.text);
      if (!first) return null;
      return affirmationCredibility(this.allBeliefs, first.text);
    },
  },
  watch: {
    text(val) { this.$emit('changed', val); },
  },
  methods: {
    // A suggestion lands in the field, where it can still be reworded — the
    // same way the affirmation step treats its suggestions.
    use(suggestion) {
      this.text = suggestion;
    },
    saveKey() {
      this.apiKey = this.apiKeyInput;
      saveApiKey(this.apiKey);
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
        const prompt = buildActionPrompt(
          this.entry, this.situations, this.patterns, this.allBeliefs,
        );
        const reply = await askClaude(this.apiKey, prompt, { maxTokens: 600 });
        this.suggestions = parseLines(reply, SUGGESTION_COUNT);
        if (!this.suggestions.length) this.errorMsg = 'Keine Vorschläge erhalten.';
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
.step-label {
  font-size: 0.68rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 4px;
  font-weight: 600;
}
.quote {
  font-size: 0.95rem;
  color: #ebebf5;
  font-style: italic;
  line-height: 1.45;
  margin: 0;
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
/* Shows a recorded value — deliberately not interactive. */
.readonly-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #3a3a3c;
  outline: none;
  opacity: 1;
  pointer-events: none;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4ade80;
  }
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: #4ade80;
  }
}
/* Full-width rows rather than chips: a suggestion is a whole sentence, and a
   chip would either wrap badly or push the line off the screen. */
.suggestion-row {
  font-size: 0.9rem;
  line-height: 1.45;
  color: #ebebf5;
  background: #1c1c1e;
  border: 1px solid #2c2c2e;
  border-radius: 12px;
  padding: 10px 14px;
  margin-bottom: 8px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
</style>
