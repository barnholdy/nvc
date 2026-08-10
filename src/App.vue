<template>
  <v-app>
    <!-- Every view reads its route params in data(), so each route must get a
         fresh instance. Without the key, navigating between two routes that
         share a component would keep the old params. -->
    <router-view :key="$route.fullPath"/>

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
                <div class="ob-step-row"><span class="ob-step-icon">✨</span><span><strong>Affirmationen</strong> — Formuliere neue, kraftvolle Perspektiven im Präsens.</span></div>
                <div class="ob-step-row"><span class="ob-step-icon">🎯</span><span><strong>Handlungen</strong> — Setze konkrete Schritte um und verankere die Veränderung.</span></div>
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
                <p class="ob-contact-row">📞 <strong>{{ support.name }}</strong><br><span class="ob-contact-detail">{{ support.phone }} — {{ support.availability }}</span></p>
                <p class="ob-contact-row">🌐 <strong>Online-Beratung</strong><br><span class="ob-contact-detail">{{ support.online }}</span></p>
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
import { SUPPORT_RESOURCE } from '@/utils/support';

const ONBOARDING_KEY = 'nvc.onboarded';

export default {
  name: 'app',
  data() {
    return {
      support: SUPPORT_RESOURCE,
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
    this.$root.$on('show-onboarding', () => { this.showOnboarding = true; this.obStep = 1; });
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

/* The question a wizard step asks, wherever it is asked. */
.wizard-prompt { font-weight: 600 !important; }

/* ─── Text inputs ─── */
/* One field everywhere: a filled surface with a hairline border and a green
   ring on focus. Colours and radius are the app's own — #1c1c1e like the cards,
   #2c2c2e for the hairline, #4ade80 for the accent. */
.v-text-field .v-input__slot {
  background: #1c1c1e !important;
  border: 1px solid #2c2c2e;
  border-radius: 12px;
  padding: 12px 16px;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    background-color 180ms ease;
}
/* Vuetify's underline has no job left on a bordered box. */
.v-text-field > .v-input__control > .v-input__slot:before,
.v-text-field > .v-input__control > .v-input__slot:after {
  display: none !important;
}
.v-text-field.v-input--is-focused .v-input__slot {
  border-color: #4ade80;
  box-shadow:
    0 0 0 1px rgba(74, 222, 128, 0.2),
    0 0 20px rgba(74, 222, 128, 0.08);
}
.v-input input, .v-input textarea {
  color: #ebebf5 !important;
  caret-color: #4ade80 !important;
  /* Back to the app's own 16px — 17px sat larger than the prompts above it. */
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: -0.02em;
}
/* Auto-grow makes a field follow its text, but a long answer would otherwise
   push the question off the screen. It grows to about half the viewport and
   scrolls inside itself from there. */
.v-input textarea {
  resize: none;
  max-height: 40vh;
  overflow-y: auto !important;
}
.v-input input::placeholder,
.v-input textarea::placeholder {
  color: #8e8e93 !important;
  opacity: 1;
}
.v-input .v-label { color: #8e8e93 !important; }
.v-text-field__slot { background: transparent !important; }
/* The API key fields sit on a card of the same colour, so they take the next
   surface up to stay visible against it. */
.v-text-field.dark-input .v-input__slot {
  background: #2c2c2e !important;
}

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

/* ─── Cards ───
   One visual language for the four lists. Every screen is a stack of cards on
   black: a filter row at the top, then one card per thing, each card a title
   with its state and its number, then labelled rows of what was written. */
.screen-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px 4px;
}
.screen-title {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  letter-spacing: -0.02em;
}
.screen-actions { display: flex; gap: 8px; flex-shrink: 0; }
.screen-add {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #1c1c1e;
  border: none;
  color: #4ade80;
  font-size: 1.5rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}

/* Filter pills. They scroll sideways rather than shrinking, so a long label
   stays readable instead of being squeezed to fit. */
.pill-row {
  display: flex;
  gap: 8px;
  padding: 10px 20px 14px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
.pill {
  flex-shrink: 0;
  background: none;
  border: 1px solid #2c2c2e;
  border-radius: 999px;
  padding: 9px 16px;
  font-size: 0.9rem;
  font-family: inherit;
  color: #8e8e93;
  cursor: pointer;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
  &.active {
    color: #fff;
    background: #1c1c1e;
    border-color: #3a3a3c;
  }
}
.pill-count { color: #636366; margin-left: 4px; }
.pill.active .pill-count { color: #8e8e93; }

.card {
  background: #1c1c1e;
  border-radius: 18px;
  margin: 0 16px 14px;
  padding: 18px 20px;
}
.card-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.card-title {
  flex: 1;
  min-width: 0;
  font-size: 1.15rem;
  line-height: 1.35;
  color: #fff;
  margin: 0;
  font-weight: 500;
}
.card-btn {
  flex-shrink: 0;
  background: none;
  border: 1px solid #4ade80;
  border-radius: 999px;
  color: #4ade80;
  font-size: 0.95rem;
  font-family: inherit;
  padding: 9px 20px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
.card-icon-btn {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: none;
  border: 1px solid #2c2c2e;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
.card-pill {
  display: inline-block;
  margin-top: 10px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #8e8e93;
  background: #2c2c2e;
  border-radius: 8px;
  padding: 4px 10px;
}

/* The number first, then what it measures — the value is what the eye is
   looking for. */
.score-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 14px;
}
.score-value { font-size: 2.1rem; font-weight: 700; color: #fff; line-height: 1; }
.score-max { font-size: 0.95rem; color: #636366; }
.score-label { font-size: 0.95rem; color: #8e8e93; }

.card-sep { height: 1px; background: #2c2c2e; margin: 16px 0 0; }

/* A written answer, folded to one line until it is asked for. */
.detail-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid #2c2c2e;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
  &:last-child { border-bottom: none; }
}
.detail-label {
  flex-shrink: 0;
  font-size: 1rem;
  color: #fff;
}
.detail-value {
  flex: 1;
  min-width: 0;
  font-size: 1rem;
  color: #8e8e93;
  text-align: right;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.detail-value.open {
  text-align: left;
  white-space: normal;
  overflow: visible;
  line-height: 1.5;
}
.detail-chevron {
  flex-shrink: 0;
  color: #48484a !important;
  font-size: 1.1rem !important;
}
/* Once open the answer needs the full width, so the label sits above it. */
.detail-row.open {
  display: block;
  cursor: pointer;
}
.detail-row.open .detail-label { display: block; margin-bottom: 6px; }

/* The affirmation, set apart by a green edge: it is the one sentence on the
   card that is meant to be true rather than merely recorded. */
.aff-box {
  border-left: 3px solid #4ade80;
  background: #232325;
  border-radius: 0 12px 12px 0;
  padding: 14px 16px;
  margin-top: 16px;
}
.aff-label {
  font-size: 0.68rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
  margin: 0 0 8px;
}
.aff-text {
  font-size: 1.05rem;
  color: #fff;
  line-height: 1.4;
  margin: 0;
}
.aff-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}
.aff-score { display: flex; align-items: baseline; gap: 5px; flex: 1; min-width: 0; }
.aff-value { font-size: 1.5rem; font-weight: 700; color: #fff; line-height: 1; }
.aff-max { font-size: 0.85rem; color: #636366; }
.aff-word { font-size: 0.9rem; color: #8e8e93; }

/* Links out of the card, to the lists that own the detail. */
.card-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 0;
  border-top: 1px solid #2c2c2e;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
.card-link-text { flex: 1; font-size: 1rem; color: #8e8e93; }

.list-empty {
  text-align: center;
  padding: 4rem 2rem;
}
.list-empty-icon { font-size: 2.6rem; display: block; margin-bottom: 14px; opacity: 0.5; }
.list-empty-title { font-size: 1.05rem; color: #fff; font-weight: 600; margin: 0 0 6px; }
.list-empty-sub { font-size: 0.9rem; color: #8e8e93; margin: 0; line-height: 1.5; }

.list-bottom-space { height: 90px; }
</style>
