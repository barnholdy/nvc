<template>
  <v-app>
    <router-view/>

    <transition name="ob-fade">
      <div v-if="showOnboarding" class="ob-overlay" @click.self="null">
        <div class="ob-card">
          <div class="ob-slides">

            <!-- Slide 1: Wie es funktioniert -->
            <div v-show="obStep === 1" class="ob-slide">
              <span class="ob-icon">🧭</span>
              <h2 class="ob-title">Wie die App funktioniert</h2>
              <p class="ob-text">
                Diese App begleitet dich dabei, dein inneres Betriebssystem zu verstehen und zu verändern — in vier Schritten:
              </p>
              <div class="ob-steps">
                <div class="ob-step-row"><span class="ob-step-icon">⚡</span><span><strong>Situationen</strong> — Erkenne Auslöser und Muster in deinem Alltag.</span></div>
                <div class="ob-step-row"><span class="ob-step-icon">💡</span><span><strong>Überzeugungen</strong> — Benenne die Glaubenssätze dahinter und wie sie sich anfühlen.</span></div>
                <div class="ob-step-row"><span class="ob-step-icon">✨</span><span><strong>Affirmationen &amp; Handlungen</strong> — Formuliere neue Perspektiven und setze kleine Schritte um.</span></div>
                <div class="ob-step-row"><span class="ob-step-icon">❤️</span><span><strong>Empathie</strong> — Lass dich einfühlsam spiegeln, was du gerade erlebst.</span></div>
              </div>
            </div>

            <!-- Slide 2: Sicherheitshinweis -->
            <div v-show="obStep === 2" class="ob-slide">
              <span class="ob-icon">💙</span>
              <h2 class="ob-title">Ein ehrlicher Hinweis</h2>
              <p class="ob-text">
                Diese App berührt persönliche Überzeugungen, Gefühle und Selbstbild. Das kann heilsam sein — manchmal aber auch Belastendes aufwühlen.
              </p>
              <p class="ob-text">
                <strong>Sie ersetzt keine Therapie oder professionelle Begleitung.</strong> Wenn du in einer Krise bist oder professionelle Unterstützung brauchst:
              </p>
              <div class="ob-contact-box">
                <p class="ob-contact-row">📞 <strong>Telefonseelsorge</strong><br><span class="ob-contact-detail">0800 111 0 111 — kostenlos, 24 h</span></p>
                <p class="ob-contact-row">🌐 <strong>Online-Beratung</strong><br><span class="ob-contact-detail">online.telefonseelsorge.de</span></p>
              </div>
            </div>

            <!-- Slide 3: Datenschutz & KI -->
            <div v-show="obStep === 3" class="ob-slide">
              <span class="ob-icon">🔒</span>
              <h2 class="ob-title">Deine Daten &amp; KI</h2>
              <p class="ob-text">
                Alle deine Einträge werden <strong>ausschließlich lokal</strong> in deinem Browser gespeichert — kein Server, kein Konto, keine Synchronisation.
              </p>
              <div class="ob-privacy-box">
                <div class="ob-privacy-row">
                  <span class="ob-priv-label">Lokal gespeichert</span>
                  <span class="ob-priv-val">Überzeugungen, Affirmationen, Handlungen, Situationen</span>
                </div>
                <div class="ob-privacy-divider"></div>
                <div class="ob-privacy-row">
                  <span class="ob-priv-label">KI-Verarbeitung</span>
                  <span class="ob-priv-val">Wenn du die Empathie-Funktion nutzt, werden deine Eingaben zur Verarbeitung an die Anthropic API übertragen. Es gelten <strong>Anthropics Datenschutzrichtlinien</strong>. Du kannst die Funktion jederzeit weglassen.</span>
                </div>
                <div class="ob-privacy-divider"></div>
                <div class="ob-privacy-row">
                  <span class="ob-priv-label">API Key</span>
                  <span class="ob-priv-val">Wird nur lokal auf deinem Gerät gespeichert.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Dots -->
          <div class="ob-dots">
            <span v-for="n in 3" :key="n" class="ob-dot" :class="{ active: obStep === n }"></span>
          </div>

          <!-- Actions -->
          <div class="ob-actions">
            <button v-if="obStep < 3" class="ob-btn-ghost" @click="obStep++">Überspringen</button>
            <button v-if="obStep < 3" class="ob-btn-primary" @click="obStep++">Weiter</button>
            <button v-if="obStep === 3" class="ob-btn-primary ob-btn-full" @click="finishOnboarding">Los geht's</button>
          </div>
        </div>
      </div>
    </transition>
  </v-app>
</template>

<script>
const ONBOARDING_KEY = 'nvc.onboarded';

export default {
  name: 'app',
  data() {
    return {
      showOnboarding: !localStorage.getItem(ONBOARDING_KEY),
      obStep: 1,
    };
  },
  methods: {
    finishOnboarding() {
      localStorage.setItem(ONBOARDING_KEY, '1');
      this.showOnboarding = false;
    },
  },
  created() {
    this.$store.dispatch('loadPatterns');
    this.$store.dispatch('loadBeliefs');
  },
  mounted() {
    document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
    document.addEventListener('touchmove', e => { if (e.scale !== 1) e.preventDefault(); }, { passive: false });
  },
};
</script>

<style lang="scss">
/* ─── Dark theme base ─── */
html, body {
  background: #000 !important;
  touch-action: manipulation;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

.application, .v-application {
  background: #000 !important;
  color: #fff !important;
}

.v-content, main.v-content {
  background: #000 !important;
}

/* ─── Toolbar ─── */
.v-toolbar, .v-toolbar.theme--light {
  background-color: #000 !important;
  color: #fff !important;
  box-shadow: none !important;
  border-bottom: 1px solid #2c2c2e !important;
}
.v-toolbar__title {
  color: #fff !important;
  font-weight: 700 !important;
  font-size: 1.45rem !important;
  letter-spacing: -0.3px;
}

/* ─── Shared intro card ─── */
.intro-card {
  background: #1c1c1e;
  border-radius: 16px;
  margin: 16px 16px 16px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.intro-icon {
  font-size: 2.4rem;
  line-height: 1.3;
  margin-bottom: 10px;
}
.intro-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px;
}
.intro-text {
  font-size: 0.875rem;
  color: #8e8e93;
  line-height: 1.65;
  margin: 0;
}
.v-toolbar .v-btn .v-icon {
  color: #4ade80 !important;
}
.v-toolbar .v-btn {
  color: #4ade80 !important;
}

/* ─── Bottom nav ─── */
.v-bottom-nav {
  background: #1c1c1e !important;
  border-top: 1px solid #2c2c2e !important;
  box-shadow: none !important;
}
.v-bottom-nav .v-btn {
  color: #636366 !important;
  opacity: 1 !important;
}
.v-bottom-nav .v-btn .v-icon {
  color: inherit !important;
  font-size: 28px !important;
}
.v-bottom-nav .v-btn span {
  color: inherit !important;
}
.v-bottom-nav .v-btn.primary--text {
  color: #4ade80 !important;
}

/* ─── Cards ─── */
.v-card {
  background: #1c1c1e !important;
  color: #fff !important;
  box-shadow: none !important;
}
.v-card__title { color: #fff !important; }
.v-card__text { color: #ebebf5 !important; }
.v-card__actions .v-btn { color: #4ade80 !important; }
.v-card__actions .v-btn.red--text { color: #ff453a !important; }

/* ─── Dividers ─── */
.v-divider {
  border-color: #2c2c2e !important;
}

/* ─── Dialogs ─── */
.v-overlay {
  background: rgba(0,0,0,0.7) !important;
}
.v-dialog .v-card {
  background: #2c2c2e !important;
  border-radius: 14px !important;
  overflow: hidden;
}
.v-dialog .v-card__title {
  color: #fff !important;
  font-size: 1rem !important;
  font-weight: 600 !important;
}
.v-dialog .v-card__text { color: #ebebf5 !important; }

/* ─── Chips ─── */
.v-chip {
  height: auto !important;
  white-space: normal !important;
  max-width: 100% !important;
  background: #3a3a3c !important;
  color: #fff !important;
  border: none !important;
}
.v-chip .v-chip__content {
  white-space: normal !important;
  word-break: break-word;
  height: auto !important;
  min-height: 28px;
  padding-top: 4px;
  padding-bottom: 4px;
  color: #fff !important;
}
.v-chip .v-icon { color: #8e8e93 !important; }

/* ─── Text inputs ─── */
.v-input input, .v-input textarea {
  color: #fff !important;
  caret-color: #4ade80 !important;
}
.v-input .v-label { color: #8e8e93 !important; }
.v-text-field .v-input__slot {
  background: #1c1c1e !important;
}
.v-text-field--outline .v-input__slot {
  border-color: #3a3a3c !important;
}
.v-textarea textarea { color: #fff !important; }
.v-text-field__slot { background: transparent !important; }

/* ─── Buttons ─── */
.v-btn.primary {
  background-color: #4ade80 !important;
  color: #000 !important;
  font-weight: 600 !important;
}
.v-btn.primary--text { color: #4ade80 !important; }
.v-btn.secondary--text { color: #3dcc70 !important; }
.v-btn.grey--text { color: #636366 !important; }
.v-btn.red--text { color: #ff453a !important; }
.v-btn.red { background-color: #ff453a !important; color: #fff !important; }
.v-btn[disabled] { opacity: 0.35 !important; }
.v-btn:not(.primary):not(.red) { color: #4ade80 !important; }

/* ─── Typography ─── */
.grey--text, .grey--text.text--darken-2 { color: #8e8e93 !important; }
.white--text { color: #fff !important; }
.subheading { color: #fff !important; }
.headline { color: #fff !important; }
.caption { color: #8e8e93 !important; }
.body-1 { color: #ebebf5 !important; }

/* ─── List ─── */
.v-list { background: #1c1c1e !important; }
.v-list__tile__title { color: #fff !important; }
.v-list__tile__sub-title { color: #8e8e93 !important; }
.v-list__tile { color: #fff !important; }

/* ─── Menu ─── */
.v-menu__content {
  background: #2c2c2e !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
}
.v-menu__content .v-list { background: #2c2c2e !important; }

/* ─── Footer / wizard ─── */
.v-footer {
  background: #1c1c1e !important;
  border-top: 1px solid #2c2c2e !important;
  box-shadow: none !important;
}
.v-footer .v-btn { color: #4ade80 !important; }
.v-footer .v-btn.primary {
  background-color: #4ade80 !important;
  color: #000 !important;
  border-radius: 12px !important;
}

/* ─── Slider ─── */
.v-slider__thumb { background: #4ade80 !important; border-color: #4ade80 !important; }
.v-slider__track__fill { background: #4ade80 !important; }
.v-slider__track { background: #3a3a3c !important; }

/* ─── Container ─── */
.v-container { background: transparent !important; }
.v-content__wrap { background: #000 !important; }

/* ─── Onboarding overlay ─── */
.ob-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.82);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: env(safe-area-inset-bottom, 0);
}
@media (min-height: 600px) {
  .ob-overlay { align-items: center; }
}
.ob-card {
  background: #1c1c1e;
  border-radius: 24px 24px 16px 16px;
  width: 100%;
  max-width: 480px;
  padding: 28px 24px 20px;
  box-shadow: 0 -8px 40px rgba(0,0,0,0.6);
  display: flex;
  flex-direction: column;
}
@media (min-height: 600px) {
  .ob-card { border-radius: 24px; }
}
.ob-slides { min-height: 340px; }
.ob-slide { display: flex; flex-direction: column; }
.ob-icon { font-size: 2.6rem; margin-bottom: 12px; line-height: 1; }
.ob-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 12px;
  letter-spacing: -0.3px;
}
.ob-text {
  font-size: 0.9rem;
  color: #ebebf5;
  line-height: 1.65;
  margin: 0 0 10px;
}
.ob-steps { margin-top: 8px; display: flex; flex-direction: column; gap: 10px; }
.ob-step-row {
  display: flex;
  gap: 10px;
  font-size: 0.875rem;
  color: #ebebf5;
  line-height: 1.5;
  align-items: flex-start;
}
.ob-step-icon { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }
.ob-contact-box {
  background: #2c2c2e;
  border-radius: 12px;
  padding: 14px 16px;
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ob-contact-row {
  margin: 0;
  font-size: 0.875rem;
  color: #ebebf5;
  line-height: 1.5;
}
.ob-contact-detail { color: #8e8e93; font-size: 0.82rem; }
.ob-privacy-box {
  background: #2c2c2e;
  border-radius: 12px;
  padding: 4px 0;
  margin-top: 10px;
}
.ob-privacy-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 11px 16px;
}
.ob-privacy-divider { height: 1px; background: #3a3a3c; margin: 0; }
.ob-priv-label {
  font-size: 0.72rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}
.ob-priv-val { font-size: 0.85rem; color: #ebebf5; line-height: 1.5; }
.ob-dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin: 20px 0 16px;
}
.ob-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #3a3a3c;
  transition: background 0.2s;
  &.active { background: #4ade80; }
}
.ob-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.ob-btn-primary {
  background: #4ade80;
  color: #000;
  border: none;
  border-radius: 12px;
  padding: 13px 24px;
  font-size: 1rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  margin-left: auto;
  -webkit-tap-highlight-color: transparent;
  &:active { background: #3dcc70; transform: scale(0.98); }
}
.ob-btn-full { width: 100%; margin-left: 0; }
.ob-btn-ghost {
  background: none;
  border: none;
  color: #636366;
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;
  padding: 13px 0;
  -webkit-tap-highlight-color: transparent;
}
.ob-fade-enter-active, .ob-fade-leave-active { transition: opacity 0.25s; }
.ob-fade-enter, .ob-fade-leave-to { opacity: 0; }
</style>
