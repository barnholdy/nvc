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

    <!-- Ordered from tentative to settled: the first ones claim least, and
         how far down the list you can go says where you actually stand. -->
    <template v-if="suggestions.length">
      <p class="wizard-note">Tippe auf einen Vorschlag, um ihn zu übernehmen:</p>
      <div
        v-for="(s, i) in suggestions"
        :key="i"
        class="aff-box aff-pick"
        @click="use(s.text)"
      >
        <p v-if="stageLabel(s.stage)" class="aff-label">{{ stageLabel(s.stage) }}</p>
        <p class="aff-text">„{{ s.text }}“</p>
      </div>
      <!-- How to tell which of them is yours — instruction, not a candidate,
           so it sits outside the list rather than in it. -->
      <p v-if="checkHint" class="wizard-note">{{ checkHint }}</p>
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

// Four ways to say the same thing, from tentative to settled. A sentence that
// claims more than someone can currently believe gets rejected on sight, so
// the mix is weighted by how hard the old belief is still held: the more
// credible it still is, the more the suggestions stay near the tentative end.
const STAGE_LABELS = {
  1: 'Tastend',
  2: 'Differenzierend',
  3: 'Erfahrungsnah',
  4: 'Fest',
};
const SUGGESTION_COUNT = 10;

// Each row sums to SUGGESTION_COUNT: stage 1, 2, 3, 4.
function stageMix(credibility) {
  if (credibility === null || credibility === undefined) return [1, 3, 4, 2];
  const c = Math.round(credibility);
  if (c >= 8) return [4, 4, 2, 0];
  if (c >= 6) return [2, 4, 3, 1];
  if (c >= 4) return [1, 3, 4, 2];
  return [0, 2, 4, 4];
}

// The closing line is instruction, not a sentence to adopt, so it is pulled
// out rather than offered as an eleventh suggestion.
const CHECK_LINE = /^["„]?Prüfung:\s*/i;

// "1. Ich merke, dass… (2)" → { text, stage }. A line the model numbered or
// annotated differently still yields its sentence rather than being dropped.
function parseSuggestions(reply) {
  const lines = String(reply || '')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
  const checkLine = lines.find(l => CHECK_LINE.test(l)) || '';
  return {
    check: checkLine.replace(CHECK_LINE, '').replace(/["“]$/, '').trim(),
    suggestions: lines
      .filter(l => !CHECK_LINE.test(l))
      .map((line) => {
        const m = line.match(/^\d+[.)]?\s*(.+?)\s*\((\d)\)$/);
        if (m) return { text: m[1].trim(), stage: Number(m[2]) };
        return { text: line.replace(/^\d+[.)]\s*/, '').trim(), stage: null };
      })
      .filter(s => s.text)
      .slice(0, SUGGESTION_COUNT),
  };
}

export default {
  name: 'pattern-change-affirmation',
  components: { WizardContext, FeelingWords, NeedWords, InputCard, MeterCard },
  props: {
    belief: { type: String, default: '' },
    // Everything the suggestion prompt reads the old belief from: how hard it
    // is still held, what it does, where it came from and what it felt like.
    // Null credibility means nothing was ever rated.
    credibility: { type: Number, default: null },
    reaction: { type: String, default: '' },
    origin: { type: String, default: '' },
    originFeelings: { type: Array, default: function() { return []; } },
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
      // The closing line the model returns after the list.
      checkHint: '',
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
    // Blank for a line the model annotated in some other way — the sentence
    // still stands on its own.
    stageLabel(stage) { return STAGE_LABELS[stage] || ''; },
    saveApiKey() {
      this.apiKey = this.apiKeyInput;
      localStorage.setItem('nvc.apiKey', this.apiKey);
      this.apiKeyInput = '';
      this.showApiKeyInput = false;
      this.generateSuggestions();
    },
    buildSuggestionsPrompt() {
      const names = list => (list || []).map(x => x && x.name).filter(Boolean).join(', ');
      const mix = stageMix(this.credibility);
      const lines = [
        'ROLLE',
        'Du generierst Alternativsätze zu einer Kernüberzeugung, nach dem Modell der',
        'Schematherapie (Young). Du bist kein Therapeut, diagnostizierst nicht und',
        'deutest nichts über das Eingegebene hinaus.',
        '',
        'INPUT',
        '- Überzeugung: "' + this.belief + '"',
      ];
      // Only what was actually filled in: an empty label invites the model to
      // invent something to fill it.
      if (this.credibility !== null && this.credibility !== undefined) {
        lines.push('- Glaubwürdigkeit: ' + Math.round(this.credibility) + ' von 10');
      }
      if (this.reaction) lines.push('- Reaktion: "' + this.reaction + '"');
      if (this.origin) lines.push('- Ursprung: "' + this.origin + '"');
      if (names(this.originFeelings)) lines.push('- Gefühle dabei: ' + names(this.originFeelings));
      if (names(this.needs)) lines.push('- Bedürfnisse: ' + names(this.needs));
      if (this.exceptions) lines.push('- Ausnahmen: "' + this.exceptions + '"');
      if (this.withoutBelief) lines.push('- Neue Reaktion: "' + this.withoutBelief + '"');
      if (names(this.withoutBeliefFeelings)) {
        lines.push('- Gefühle dabei: ' + names(this.withoutBeliefFeelings));
      }
      lines.push(
        '',
        'OUTPUT',
        'Genau ' + SUGGESTION_COUNT + ' Sätze in Ich-Form, nummeriert, mit Stufenangabe in Klammern.',
        '',
        'Die 4 Stufen:',
        '(1) Tastend – benennt das Muster, behauptet nichts. "Ich merke, dass…", "Ich prüfe, ob…"',
        '(2) Differenzierend – trennt die verkoppelten Konzepte voneinander',
        '(3) Erfahrungsnah – stützt sich direkt auf meine genannten Ausnahmen',
        '(4) Fest – die neue Überzeugung als klare Aussage',
        '',
        'GEWICHTUNG NACH GLAUBWÜRDIGKEIT',
        'Je höher die Glaubwürdigkeit des alten Satzes, desto mehr Sätze der',
        'niedrigen Stufen. Verteile die ' + SUGGESTION_COUNT + ' Sätze genau so: '
          + mix[0] + '× Stufe 1, ' + mix[1] + '× Stufe 2, '
          + mix[2] + '× Stufe 3, ' + mix[3] + '× Stufe 4.',
        '',
        'REGELN',
        '- Kurz. Maximal 10 Wörter pro Satz.',
        '- Keine Umkehrung ins Gegenteil, keine Superlative, keine Selbstlob-Formeln.',
        '- Mindestens 1 Satz greift das genannte Bedürfnis auf.',
        '- Kein konkreter Bezug auf den beschriebenen Ursprung, die Ausnahmen',
        '  oder die Reaktionen. Die Sätze stehen für sich.',
        '- Der Ursprung darf einordnen ("das war einmal nötig"), aber du deutest',
        '  nichts hinein, was ich nicht geschrieben habe.',
        '- Keine Wiederholungen und keine bloßen Umformulierungen desselben Satzes.',
        '- Keine Beschwichtigung, kein Zuspruch, keine Einleitung, kein Fazit.',
        '- Antworte auf Deutsch. Nur die Liste.',
        '',
        'FORMAT',
        'Eine Zeile pro Satz, exakt so: 1. <Satz> (<Stufe>)',
        '',
        'ABSCHLUSS',
        'Nach der Liste genau eine Zeile:',
        '"Prüfung: Sag den Satz laut. Kalt = zu abstrakt. Sofortiges Nein = eine',
        'Stufe tiefer. Leichtes Zögern = richtig."',
      );
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
      this.checkHint = '';
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
            // Ten German sentences plus their numbering and stage marks.
            max_tokens: 1000,
            messages: [{ role: 'user', content: this.buildSuggestionsPrompt() }],
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err.error && err.error.message) || `Fehler ${res.status}`);
        }
        const data = await res.json();
        const parsed = parseSuggestions(data.content[0].text);
        this.suggestions = parsed.suggestions;
        this.checkHint = parsed.check;
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
