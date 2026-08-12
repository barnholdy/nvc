<template>
  <div>
    <wizard-context
      :quote="belief"
      :exceptions="exceptions"
      :perspective="withoutBelief"
      :perspective-feelings="withoutBeliefFeelings"
    ></wizard-context>

    <p class="wizard-question">Formuliere deinen Satz.</p>

    <!-- Needs and feelings are named inside the sentence, not listed above it.
         Both halves render as spans so they read as one sentence; they sit
         flush against each other because any whitespace between them would
         show up as a second space before "lässt". -->
    <p class="wizard-body"><need-words
      tag="span"
      :needs="needs"
      prefix="Die neue Reaktion auf "
      fallback="Diese neue Reaktion"></need-words><feeling-words
      tag="span"
      :feelings="withoutBeliefFeelings"
      prefix=" lässt dich "
      suffix=" fühlen. Er soll die alte Überzeugung in diese Richtung verschieben."
      fallback=" fühlt sich neu an. Er soll die alte Überzeugung in diese Richtung verschieben."></feeling-words></p>

    <p class="wizard-note">
      Der positivste Satz, den du gerade noch als <strong>wahr</strong> empfinden kannst.
    </p>

    <input-card
      v-model="text"
      label="Dein Satz"
      placeholder="Ich bin..."
      :rows="3"
      @focussed="$emit('focussed')"
      @blurred="$emit('blurred')"
    ></input-card>

    <!-- Getting a suggestion is the next thing to try once the field is
         empty or stuck — directly under it, not after the rating below. -->
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
        <v-btn small flat color="primary" :disabled="!apiKeyInput" @click="saveApiKey">Speichern & generieren</v-btn>
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
        class="aff-box aff-pick"
        @click="use(s)"
      >
        <p class="aff-text">„{{ s }}“</p>
      </div>
    </template>

    <!-- Only meaningful once there is a sentence to read aloud -->
    <template v-if="hasText">
      <p class="wizard-question">Wie glaubwürdig fühlt er sich an?</p>
      <p class="wizard-body">Lies dir den Satz laut vor.</p>
      <meter-card
        :value="truth"
        label="Glaubwürdigkeit"
        :color="truthHint.color"
        @input="truth = $event"
      >
        <template slot="hint">
          Zielbereich <strong :style="{ color: truthHint.color }">6–8</strong> —
          {{ truthHint.title.toLowerCase() }}: {{ truthHint.text }}
        </template>
      </meter-card>
    </template>

    <!-- Same box the belief and action cards use for a saved affirmation —
         minus the label (these are candidates, not "the" affirmation yet)
         and minus Üben (there is nothing recorded here to practise). -->
    <template v-if="otherAffirmations.length">
      <p class="wizard-question">Aus deinen Affirmationen übernehmen</p>
      <div
        v-for="a in otherAffirmations"
        :key="a.text"
        class="aff-box aff-pick"
        @click="use(a.text)"
      >
        <p class="aff-text">„{{ a.text }}“</p>
      </div>
    </template>
  </div>
</template>

<script>
import WizardContext from '@/components/WizardContext.vue';
import FeelingWords from '@/components/FeelingWords.vue';
import NeedWords from '@/components/NeedWords.vue';
import InputCard from '@/components/InputCard.vue';
import MeterCard from '@/components/MeterCard.vue';
import { normalizeTruth, truthHint } from '@/utils/affirmationTruth';

export default {
  name: 'pattern-change-affirmation',
  components: { WizardContext, FeelingWords, NeedWords, InputCard, MeterCard },
  props: {
    belief: { type: String, default: '' },
    // Written in the wizard's first step, carried forward as context.
    exceptions: { type: String, default: '' },
    withoutBelief: { type: String, default: '' },
    withoutBeliefFeelings: { type: Array, default: function() { return []; } },
    // The belief's needs, named in the question so the new reaction is tied
    // back to what it is actually for.
    needs: { type: Array, default: function() { return []; } },
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
        // Stamped so the credibility history knows when this reading was taken.
        ? [{ text: text, count: this.count || 1, resonance: this.truth, ratedAt: Date.now() }]
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
        lines.push('Neue Reaktion: "' + this.withoutBelief + '"');
      } else {
        lines.push('Glaubenssatz: "' + this.belief + '"');
      }
      var feelingNames = (this.withoutBeliefFeelings || []).map(function(f) { return f.name; }).join(', ');
      if (feelingNames) lines.push('Gefühle dabei: ' + feelingNames);
      lines.push('Generiere genau 5 kurze positive Affirmationen (je max. 12 Wörter) als Ich-Aussagen im Präsens. Inspirierend, konkret, auf die neue Reaktion bezogen.\nNur die 5 Sätze, einer pro Zeile, ohne Nummerierung.');
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
.suggest-block { margin: 0 16px; }
.action-row { display: flex; align-items: center; gap: 8px; }
.error-text { color: #ff453a !important; }

.aff-pick {
  cursor: pointer;
  margin-bottom: 10px;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
</style>
