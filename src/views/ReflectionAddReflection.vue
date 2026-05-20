<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Reflexion</h1>
      <p class="subheading grey--text fear-quote mt-1">„{{ fear }}"</p>
      <p class="body-1 grey--text mt-2">Lass dir einfühlsam zurückspiegeln, wie dieser Glaubenssatz wirken könnte.</p>
    </v-flex>

    <v-flex class="mt-1">
      <template v-if="showApiKeyInput">
        <p class="caption grey--text mb-1">Anthropic API Key eingeben, um eine Reflexion zu generieren:</p>
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
        <v-btn flat color="primary" :loading="isLoading" @click="generate">
          <v-icon left>lightbulb_outline</v-icon>
          Reflexion generieren
        </v-btn>
        <v-btn v-if="apiKey" small flat icon @click="showApiKeyInput = true" title="API Key ändern">
          <v-icon small color="grey lighten-1">settings</v-icon>
        </v-btn>
      </template>
    </v-flex>

    <v-flex v-if="errorMsg" class="mt-1">
      <p class="caption red--text">{{ errorMsg }}</p>
    </v-flex>

    <v-flex v-if="text" class="mt-3">
      <v-text-field
        v-model="text"
        multi-line
        auto-grow
        hide-details
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  name: 'reflection-add-reflection',
  props: {
    fear: { type: String, default: '' },
    belief: { type: String, default: '' },
    initialValue: { type: String, default: '' },
  },
  data() {
    return {
      text: this.initialValue,
      isLoading: false,
      errorMsg: '',
      showApiKeyInput: false,
      apiKeyInput: '',
      apiKey: localStorage.getItem('nvc.apiKey') || '',
    };
  },
  watch: {
    text(val) { this.$emit('changed', val); },
  },
  methods: {
    saveApiKey() {
      this.apiKey = this.apiKeyInput;
      localStorage.setItem('nvc.apiKey', this.apiKey);
      this.apiKeyInput = '';
      this.showApiKeyInput = false;
      this.generate();
    },
    async generate() {
      if (!this.apiKey) {
        this.showApiKeyInput = true;
        return;
      }
      this.isLoading = true;
      this.errorMsg = '';
      const prompt = [
        'Du bist ein einfühlsamer Selbstreflexions-Begleiter.',
        '',
        'Eine Person hat folgendes geteilt:',
        'Was sie fürchtet, wie andere sie sehen: "' + this.fear + '"',
        'Zugrundeliegender Glaubenssatz: "' + this.belief + '"',
        '',
        'Reflektiere empathisch zurück:',
        '1. Wie diese Angst, so gesehen zu werden, zu unterdrückten Bedürfnissen führen könnte',
        '2. Welche Schutzmechanismen oder Verhaltensänderungen sie auslösen könnte',
        '',
        'Halte dich dabei an folgende Prinzipien:',
        '- Spiegle zurück, ohne zu bewerten oder Ratschläge zu geben',
        '- Benenne das Muster warmherzig und direkt',
        '- Die Person soll sich gesehen fühlen, nicht analysiert',
        '- Ton: warm, ruhig, präsent',
        '',
        'Antworte auf Deutsch.',
      ].join('\n');
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
            max_tokens: 500,
            messages: [{ role: 'user', content: prompt }],
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(function() { return {}; });
          throw new Error((err.error && err.error.message) || ('Fehler ' + res.status));
        }
        const data = await res.json();
        this.text = data.content[0].text.trim();
      } catch (e) {
        this.errorMsg = e.message || 'Reflexion konnte nicht geladen werden.';
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.fear-quote {
  font-style: italic;
}
</style>
