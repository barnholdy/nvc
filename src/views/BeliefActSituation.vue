<template>
  <div>
    <!-- Both ends of what this action tests, each with the standing it has
         right now — the question below asks you to act as if the second one
         held instead of the first. -->
    <wizard-context
      v-if="entry"
      :quote="entry.belief"
      :credibility="beliefTruth"
    ></wizard-context>

    <div v-if="affirmationText" class="aff-box">
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

    <p class="wizard-question">Was tust du konkret?</p>
    <action-prompt :belief="entry"></action-prompt>

    <input-card
      v-model="text"
      label="Deine Handlung"
      :rows="3"
      @focussed="$emit('focussed')"
      @blurred="$emit('blurred')"
    ></input-card>

    <!-- Right under the field: writing is still the way in, and a suggestion is
         a starting point for the field, not a replacement for thinking. -->
    <div class="suggest-block">
      <template v-if="showApiKeyInput">
        <p class="wizard-note">Anthropic API Key eingeben, um Vorschläge zu generieren:</p>
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
        <div class="action-row">
          <v-progress-circular
            v-if="isLoading"
            indeterminate
            color="#4ade80"
            size="20"
            width="2"
          ></v-progress-circular>
          <button v-else class="card-btn" @click="generateSuggestions">Vorschläge bekommen</button>
          <v-btn v-if="apiKey" small flat icon @click="showApiKeyInput = true" title="API Key ändern">
            <v-icon small color="grey lighten-1">settings</v-icon>
          </v-btn>
        </div>
      </template>

      <p v-if="errorMsg" class="wizard-note error-text">{{ errorMsg }}</p>
    </div>

    <template v-if="suggestions.length">
      <p class="wizard-note">Tippe auf einen Vorschlag, um ihn zu übernehmen:</p>
      <div
        v-for="(s, i) in suggestions"
        :key="i"
        class="card suggestion-card"
        @click="use(s)"
      >{{ s }}</div>
    </template>

    <!-- Under the field, where it is a reference rather than a question. -->
    <template v-if="situations.length">
      <p class="wizard-question">Vergangene Situationen</p>
      <situation-rows :situations="situations"></situation-rows>
    </template>
  </div>
</template>

<script>
import ActionPrompt from '@/components/ActionPrompt.vue';
import SituationRows from '@/components/SituationRows.vue';
import WizardContext from '@/components/WizardContext.vue';
import InputCard from '@/components/InputCard.vue';
import { askClaude, loadApiKey, saveApiKey, parseLines } from '@/utils/ai';
import { buildActionPrompt, SUGGESTION_COUNT } from '@/utils/actionSuggestions';
import { beliefCredibility, affirmationCredibility } from '@/utils/credibility';

export default {
  name: 'belief-act-situation',
  components: { ActionPrompt, SituationRows, WizardContext, InputCard },
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
/* .aff-box carries no side margin of its own — everywhere else it appears
   nested inside a .card, which already indents it. Here it stands alone at
   the top level, so it needs the same side margin every other block on this
   page has. */
.aff-box { margin: 0 14px 12px; }
.suggest-block { margin: 0 16px; }
.action-row { display: flex; align-items: center; gap: 8px; }
.error-text { color: #ff453a !important; }

/* Full-width cards rather than chips: a suggestion is a whole sentence, and a
   chip would either wrap badly or push the line off the screen. */
.suggestion-card {
  font-size: 0.95rem;
  line-height: 1.45;
  color: #ebebf5;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
</style>
