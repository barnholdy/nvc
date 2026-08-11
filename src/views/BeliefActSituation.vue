<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Situation</h1>
      <!-- Both ends of what this action tests, each with the standing it has
           right now — the question below asks you to act as if the second one
           held instead of the first. Same treatment the lists give them: a
           quote with its score, an affirmation in its box. -->
      <belief-quote
        v-if="entry"
        label="Überzeugung"
        :text="entry.belief"
        :credibility="beliefTruth"
        class="mt-3"
      ></belief-quote>

      <div v-if="affirmationText" class="aff-box mt-3">
        <p class="aff-label">Affirmation</p>
        <p class="aff-text">„{{ affirmationText }}“</p>
        <div v-if="affirmationTruth !== null" class="aff-foot">
          <span class="aff-score">
            <span class="aff-value">{{ round(affirmationTruth) }}</span>
            <span class="aff-max">/10</span>
            <span class="aff-word">Glaubwürdigkeit</span>
          </span>
        </div>
      </div>

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
import BeliefQuote from '@/components/BeliefQuote.vue';
import { askClaude, loadApiKey, saveApiKey, parseLines } from '@/utils/ai';
import { buildActionPrompt, SUGGESTION_COUNT } from '@/utils/actionSuggestions';
import { beliefCredibility, affirmationCredibility } from '@/utils/credibility';

export default {
  name: 'belief-act-situation',
  components: { ActionPrompt, SituationRows, BeliefQuote },
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
    // One decimal, German comma — the same rounding the list cards use.
    round(v) { return String(Math.round(v * 10) / 10).replace('.', ','); },
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
