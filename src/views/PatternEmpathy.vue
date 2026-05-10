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
            <h1 class="headline font-weight-regular">Empathie bekommen</h1>
            <p class="subheading grey--text belief-quote mt-1">„{{ entry ? entry.belief : '' }}"</p>
            <p class="body-1 grey--text mt-2">Lass dir einfühlsam spiegeln, was du gerade erlebst.</p>
          </v-flex>

          <v-flex class="mt-1">
            <template v-if="showApiKeyInput">
              <p class="caption grey--text mb-1">Anthropic API Key eingeben, um Empathie zu generieren:</p>
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
                <v-icon left>favorite_border</v-icon>
                Empathie generieren
              </v-btn>
              <v-btn v-if="apiKey" small flat icon @click="showApiKeyInput = true" title="API Key ändern">
                <v-icon small color="grey lighten-1">settings</v-icon>
              </v-btn>
            </template>
          </v-flex>

          <v-flex v-if="errorMsg" class="mt-1">
            <p class="caption red--text">{{ errorMsg }}</p>
          </v-flex>

          <v-flex v-if="text !== null" class="mt-3">
            <v-textarea
              v-model="text"
              auto-grow
              hide-details
              @focus="isFooterFixed = false"
              @blur="isFooterFixed = true"
            ></v-textarea>
          </v-flex>
        </v-layout>
      </v-container>

      <v-footer v-if="text !== null" :fixed="isFooterFixed" color="white elevation-3" height="44">
        <v-btn @click="save" block large color="primary">speichern</v-btn>
      </v-footer>
    </v-content>
  </div>
</template>

<script>
export default {
  name: 'pattern-empathy',
  data() {
    const entry = this.$store.getters.patterns
      .find(p => p.time === parseInt(this.$route.params.time, 10));
    return {
      entry: entry || null,
      text: entry && entry.empathy ? entry.empathy : null,
      isLoading: false,
      errorMsg: '',
      showApiKeyInput: false,
      apiKeyInput: '',
      apiKey: localStorage.getItem('nvc.apiKey') || '',
      isFooterFixed: true,
    };
  },
  methods: {
    buildPrompt() {
      const e = this.entry;
      const system = `Du bist ein einfühlsamer Gesprächsbegleiter. Eine Person teilt dir eine persönliche Situation in strukturierter Form mit – bestehend aus:

- Situation: Was ist passiert?
- Glaube: Welche Überzeugung oder Interpretation hat die Person darüber?
- Gefühl: Welche Emotion(en) entstehen dadurch?
- Reaktion: Wie hat die Person reagiert (innerlich oder äußerlich)?
- Bedürfnis: Welches unerfüllte Bedürfnis steckt dahinter?
- Ursprungshypothese: Woher könnte dieser Glaube oder dieses Muster stammen?

Deine Aufgabe ist es, empathisch zu antworten. Halte dich dabei an folgende Prinzipien:

1. Erst spiegeln, dann würdigen – Fasse zusammen, was du gehört hast, ohne zu interpretieren oder zu bewerten. Zeige, dass du wirklich zugehört hast.
2. Den Kern berühren – Benenne das Gefühl und das Bedürfnis direkt und warmherzig. Die Person soll sich gesehen fühlen, nicht analysiert.
3. Die Ursprungshypothese würdigen – Anerkenne, wie viel Selbstreflexion darin steckt, ohne sie zu bestätigen oder zu widerlegen.
4. Keine Ratschläge, keine Lösungen – Außer die Person fragt explizit danach.
5. Offene Einladung zum Ende – Schließe mit einer offenen Frage oder einem Raumangebot, kein Druck.

Ton: warm, ruhig, präsent. Nicht therapeutisch-distanziert, nicht überschwänglich. Sprich die Person direkt an (du/Sie je nach Input). Antworte auf Deutsch, es sei denn, die Person schreibt auf Englisch.`;

      const lines = [system, ''];
      if (e.trigger) lines.push(`Situation: ${e.trigger}`);
      if (e.belief) lines.push(`Glaube: ${e.belief}`);
      const feelings = e.feelings && e.feelings.length ? e.feelings.map(function(f) { return f.name; }).join(', ') : '';
      if (feelings) lines.push(`Gefühl: ${feelings}`);
      if (e.withBelief) lines.push(`Reaktion: ${e.withBelief}`);
      const needs = e.needs && e.needs.length ? e.needs.map(function(n) { return n.name; }).join(', ') : '';
      if (needs) lines.push(`Bedürfnis: ${needs}`);
      if (e.origin) lines.push(`Ursprungshypothese: ${e.origin}`);
      return lines.join('\n');
    },
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
            max_tokens: 600,
            messages: [{ role: 'user', content: this.buildPrompt() }],
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(function() { return {}; });
          throw new Error((err.error && err.error.message) || ('Fehler ' + res.status));
        }
        const data = await res.json();
        this.text = data.content[0].text.trim();
      } catch (e) {
        this.errorMsg = e.message || 'Empathie konnte nicht geladen werden.';
      } finally {
        this.isLoading = false;
      }
    },
    save() {
      this.$store.dispatch('updatePattern', Object.assign({}, this.entry, { empathy: this.text }));
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
</style>
