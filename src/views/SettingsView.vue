<template>
  <div class="dark-page">
    <v-toolbar color="#000" dark flat app>
      <v-btn icon @click="$router.back()">
        <v-icon color="#4ade80">arrow_back</v-icon>
      </v-btn>
      <v-toolbar-title>Einstellungen</v-toolbar-title>
    </v-toolbar>

    <v-content>
      <!-- Profil -->
      <p class="section-header">Profil</p>
      <div class="settings-group">
        <div class="settings-row tappable" @click="$router.push('/profile')">
          <div class="settings-row-body">
            <p class="settings-label">Dein Profil</p>
            <p class="settings-sub">Kernmuster, Bedürfnis- und Affektprofil</p>
          </div>
          <v-icon color="#4ade80">person_outline</v-icon>
        </div>
      </div>

      <!-- KI -->
      <p class="section-header">KI</p>
      <div class="settings-group">
        <div class="settings-row tappable" @click="$router.push('/empathy')">
          <div class="settings-row-body">
            <p class="settings-label">Empathie generieren</p>
            <p class="settings-sub">Einfühlsame Spiegelung deiner Muster</p>
          </div>
          <v-icon color="#4ade80">favorite_border</v-icon>
        </div>
        <div class="settings-sep"></div>
        <div class="settings-row">
          <div class="settings-row-body">
            <p class="settings-label">Anthropic API Key</p>
            <p class="settings-sub">Für KI-gestützte Empathie und Vorschläge</p>
          </div>
        </div>
        <div class="settings-input-row">
          <v-text-field
            v-model="apiKey"
            placeholder="sk-ant-..."
            type="password"
            single-line
            hide-details
            class="dark-input"
          ></v-text-field>
          <button class="save-btn" :disabled="!apiKeyChanged" @click="saveApiKey">
            Speichern
          </button>
        </div>
      </div>

      <!-- Data -->
      <p class="section-header">Daten</p>
      <div class="settings-group">
        <div class="settings-row tappable" @click="exportData">
          <div class="settings-row-body">
            <p class="settings-label">Exportieren</p>
            <p class="settings-sub">Alle Daten als JSON herunterladen</p>
          </div>
          <v-icon color="#4ade80">file_download</v-icon>
        </div>
        <div class="settings-sep"></div>
        <div class="settings-row tappable" @click="triggerImport">
          <div class="settings-row-body">
            <p class="settings-label">Importieren</p>
            <p class="settings-sub">JSON-Datei laden (überschreibt bestehende Daten)</p>
          </div>
          <v-icon color="#4ade80">file_upload</v-icon>
        </div>
        <input ref="fileInput" type="file" accept=".json" style="display:none" @change="importData">
        <p v-if="importError" class="feedback-text error-text">{{ importError }}</p>
        <p v-if="importSuccess" class="feedback-text success-text">Daten erfolgreich importiert.</p>
      </div>

      <!-- Onboarding -->
      <p class="section-header">Über die App</p>
      <div class="settings-group">
        <div class="settings-row tappable" @click="showOnboarding">
          <div class="settings-row-body">
            <p class="settings-label">Einführung anzeigen</p>
            <p class="settings-sub">Intro-Slideshow erneut öffnen</p>
          </div>
          <v-icon color="#4ade80">info_outline</v-icon>
        </div>
        <div class="settings-sep"></div>
        <div class="settings-row tappable" @click="reloadApp">
          <div class="settings-row-body">
            <p class="settings-label">App aktualisieren</p>
            <p class="settings-sub">Neueste Version laden</p>
          </div>
          <v-icon color="#4ade80">refresh</v-icon>
        </div>
      </div>

      <!-- Danger zone -->
      <p class="section-header danger-header">Gefahrenzone</p>
      <div class="settings-group">
        <div class="settings-row tappable danger-row" @click="showResetDialog = true">
          <div class="settings-row-body">
            <p class="settings-label danger-label">Alle Daten löschen</p>
            <p class="settings-sub">Unwiderruflich — exportiere vorher</p>
          </div>
          <v-icon color="#ff453a">delete_forever</v-icon>
        </div>
      </div>

      <v-dialog v-model="showResetDialog" width="300">
        <v-card class="confirm-dialog">
          <v-card-title class="confirm-title">Alle Daten löschen?</v-card-title>
          <v-divider></v-divider>
          <v-card-text class="confirm-body">Diese Aktion kann nicht rückgängig gemacht werden.</v-card-text>
          <v-divider></v-divider>
          <v-card-actions class="confirm-actions">
            <v-btn flat @click="showResetDialog = false" class="confirm-cancel">Abbrechen</v-btn>
            <v-btn flat @click="resetData" class="confirm-delete">Löschen</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-content>
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
    apiKeyChanged() { return this.apiKey !== this.savedApiKey; },
  },
  methods: {
    saveApiKey() {
      localStorage.setItem('nvc.apiKey', this.apiKey);
      this.savedApiKey = this.apiKey;
    },
    exportData() {
      function tryParse(key) {
        try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
      }
      const data = {
        patterns: this.$store.getters.patterns,
        beliefs: this.$store.getters.beliefs,
        amen: tryParse('nvc.amen') || {},
        check: tryParse('nvc.check') || {},
        progress: tryParse('nvc.progress') || {},
        globalEmpathy: tryParse('nvc.globalEmpathy'),
        affirmationStatus: tryParse('nvc.affirmationStatus') || {},
        actionStatus: tryParse('nvc.actionStatus') || {},
      };
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `beliefs-export-${date}.json`;
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
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.patterns || !data.beliefs) { this.importError = 'Ungültiges Format.'; return; }
          this.$store.commit('setPatterns', data.patterns);
          this.$store.commit('setBeliefs', data.beliefs);
          localStorage.setItem('nvc.patterns', JSON.stringify(data.patterns));
          localStorage.setItem('nvc.beliefs', JSON.stringify(data.beliefs));
          if (data.amen) localStorage.setItem('nvc.amen', JSON.stringify(data.amen));
          if (data.check) localStorage.setItem('nvc.check', JSON.stringify(data.check));
          if (data.progress) localStorage.setItem('nvc.progress', JSON.stringify(data.progress));
          if (data.globalEmpathy) localStorage.setItem('nvc.globalEmpathy', JSON.stringify(data.globalEmpathy));
          if (data.affirmationStatus) localStorage.setItem('nvc.affirmationStatus', JSON.stringify(data.affirmationStatus));
          if (data.actionStatus) localStorage.setItem('nvc.actionStatus', JSON.stringify(data.actionStatus));
          this.importSuccess = true;
        } catch (err) {
          this.importError = 'Datei konnte nicht gelesen werden.';
        }
      };
      reader.readAsText(file);
    },
    showOnboarding() {
      localStorage.removeItem('nvc.onboarded');
      this.$root.$emit('show-onboarding');
    },
    reloadApp() {
      window.location.reload(true);
    },
    resetData() {
      this.showResetDialog = false;
      this.$store.commit('setPatterns', []);
      this.$store.commit('setBeliefs', []);
      localStorage.removeItem('nvc.patterns');
      localStorage.removeItem('nvc.beliefs');
      localStorage.removeItem('nvc.globalEmpathy');
      localStorage.removeItem('nvc.amen');
      localStorage.removeItem('nvc.check');
      localStorage.removeItem('nvc.progress');
      localStorage.removeItem('nvc.onboarded');
      localStorage.removeItem('nvc.kernmuster');
      localStorage.removeItem('nvc.kernmusterSnapshot');
      localStorage.removeItem('nvc.affirmationStatus');
      localStorage.removeItem('nvc.actionStatus');
    },
  },
};
</script>

<style scoped lang="scss">
.dark-page {
  background: #000;
  min-height: 100vh;
}
.page-title-area {
  padding: 8px 20px 8px;
}
.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
  margin: 0;
}
.section-header {
  font-size: 0.75rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: 600;
  margin: 20px 20px 6px;
}
.danger-header { color: #ff453a !important; }

.settings-group {
  background: #1c1c1e;
  border-radius: 12px;
  margin: 0 16px;
  overflow: hidden;
}
.settings-row {
  display: flex;
  align-items: center;
  padding: 13px 16px;
  &.tappable {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    &:active { background: #2c2c2e; }
  }
}
.settings-row-body { flex: 1; min-width: 0; }
.settings-label {
  font-size: 0.95rem;
  color: #fff;
  margin: 0 0 2px;
  font-weight: 500;
}
.danger-label { color: #ff453a !important; }
.settings-sub {
  font-size: 0.78rem;
  color: #8e8e93;
  margin: 0;
}
.settings-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 16px 12px;
  border-top: 1px solid #2c2c2e;
}
.settings-sep {
  height: 1px;
  background: #2c2c2e;
  margin: 0 0 0 16px;
}
.save-btn {
  background: #4ade80;
  color: #000;
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 0.875rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  &:disabled { opacity: 0.35; cursor: not-allowed; }
}
.feedback-text {
  font-size: 0.8rem;
  padding: 0 16px 10px;
  margin: 0;
}
.error-text { color: #ff453a; }
.success-text { color: #4ade80; }

.confirm-dialog { border-radius: 14px !important; overflow: hidden; }
.confirm-title {
  font-size: 1rem !important;
  font-weight: 600 !important;
  color: #fff !important;
  justify-content: center !important;
  padding: 16px !important;
}
.confirm-body {
  font-size: 0.875rem !important;
  color: #8e8e93 !important;
  text-align: center;
  padding: 8px 16px 16px !important;
}
.confirm-actions { padding: 0 !important; display: flex; }
.confirm-cancel { flex: 1; color: #4ade80 !important; border-right: 1px solid #3a3a3c; }
.confirm-delete { flex: 1; color: #ff453a !important; font-weight: 600 !important; }
</style>
