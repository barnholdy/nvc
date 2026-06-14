<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn icon @click="$router.back()">
        <v-icon>arrow_back</v-icon>
      </v-btn>
      <v-toolbar-title>Einstellungen</v-toolbar-title>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <v-layout column>

          <v-flex class="mt-3 mb-2">
            <p class="subheading font-weight-medium">Anthropic API Key</p>
            <p class="body-1 grey--text mb-2">Wird für die KI-gestützte Empathie und Vorschläge benötigt.</p>
            <v-text-field
              v-model="apiKey"
              label="API Key"
              type="password"
              single-line
              outline
              hide-details
              class="mb-2"
            ></v-text-field>
            <v-btn flat color="primary" :disabled="!apiKeyChanged" @click="saveApiKey">Speichern</v-btn>
          </v-flex>

          <v-divider class="my-3"></v-divider>

          <v-flex class="mb-2">
            <p class="subheading font-weight-medium">Daten exportieren</p>
            <p class="body-1 grey--text mb-2">Alle Trigger, Überzeugungen und zugehörige Daten als JSON-Datei herunterladen.</p>
            <v-btn flat color="primary" @click="exportData">
              <v-icon left>file_download</v-icon>
              Exportieren
            </v-btn>
          </v-flex>

          <v-divider class="my-3"></v-divider>

          <v-flex class="mb-2">
            <p class="subheading font-weight-medium">Daten importieren</p>
            <p class="body-1 grey--text mb-2">Eine zuvor exportierte JSON-Datei laden. Bestehende Daten werden überschrieben.</p>
            <v-btn flat color="primary" @click="triggerImport">
              <v-icon left>file_upload</v-icon>
              Importieren
            </v-btn>
            <input ref="fileInput" type="file" accept=".json" style="display:none" @change="importData">
            <p v-if="importError" class="caption red--text mt-1">{{ importError }}</p>
            <p v-if="importSuccess" class="caption green--text mt-1">Daten erfolgreich importiert.</p>
          </v-flex>

          <v-divider class="my-3"></v-divider>

          <v-flex class="mb-2">
            <p class="subheading font-weight-medium">Alle Daten zurücksetzen</p>
            <p class="body-1 grey--text mb-2">Löscht alle Trigger, Überzeugungen und zugehörige Daten unwiderruflich.</p>
            <v-btn flat color="red" @click="showResetDialog = true">
              <v-icon left>delete_forever</v-icon>
              Zurücksetzen
            </v-btn>
          </v-flex>

        </v-layout>
      </v-container>
    </v-content>

    <v-dialog v-model="showResetDialog" width="500">
      <v-card>
        <v-card-title class="subheading" primary-title>
          Alle Daten wirklich löschen?
        </v-card-title>
        <v-card-text class="body-1 grey--text">
          Diese Aktion kann nicht rückgängig gemacht werden. Exportiere deine Daten vorher, wenn du sie sichern möchtest.
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" flat @click="showResetDialog = false">Abbrechen</v-btn>
          <v-btn color="red" flat @click="resetData">Löschen</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'settings-view',
  data() {
    return {
      apiKey: localStorage.getItem('nvc.apiKey') || '',
      savedApiKey: localStorage.getItem('nvc.apiKey') || '',
      showResetDialog: false,
      importError: '',
      importSuccess: false,
    };
  },
  computed: {
    apiKeyChanged() {
      return this.apiKey !== this.savedApiKey;
    },
  },
  methods: {
    saveApiKey() {
      localStorage.setItem('nvc.apiKey', this.apiKey);
      this.savedApiKey = this.apiKey;
    },
    exportData() {
      var data = {
        patterns: this.$store.getters.patterns,
        beliefs: this.$store.getters.beliefs,
      };
      var json = JSON.stringify(data, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      var date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = 'checkin-export-' + date + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    triggerImport() {
      this.importError = '';
      this.importSuccess = false;
      this.$refs.fileInput.value = '';
      this.$refs.fileInput.click();
    },
    importData(event) {
      var file = event.target.files[0];
      if (!file) return;
      var self = this;
      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          var data = JSON.parse(e.target.result);
          if (!data.patterns || !data.beliefs) {
            self.importError = 'Ungültiges Format: patterns oder beliefs fehlen.';
            return;
          }
          self.$store.commit('setPatterns', data.patterns);
          self.$store.commit('setBeliefs', data.beliefs);
          localStorage.setItem('nvc.patterns', JSON.stringify(data.patterns));
          localStorage.setItem('nvc.beliefs', JSON.stringify(data.beliefs));
          self.importSuccess = true;
        } catch (err) {
          self.importError = 'Datei konnte nicht gelesen werden.';
        }
      };
      reader.readAsText(file);
    },
    resetData() {
      this.showResetDialog = false;
      this.$store.commit('setPatterns', []);
      this.$store.commit('setBeliefs', []);
      localStorage.removeItem('nvc.patterns');
      localStorage.removeItem('nvc.beliefs');
      localStorage.removeItem('nvc.globalEmpathy');
    },
  },
};
</script>

<style scoped lang="scss">
</style>
