<template>
  <v-app>
    <!-- Every view reads its route params in data(), so each route must get a
         fresh instance. Without the key, navigating between two routes that
         share a component would keep the old params. -->
    <router-view :key="$route.fullPath"/>

    <transition name="ob-fade">
      <div v-if="showOnboarding" class="ob-overlay wizard-page">
        <wizard-header title="Willkommen" :step="obStep" :total="3"></wizard-header>

        <div
          class="ob-slides"
          @touchstart="obTouchStart"
          @touchmove="obTouchMove"
          @touchend="obTouchEnd"
        >
          <!-- Slide 1: Wie es funktioniert -->
          <div v-show="obStep === 1">
            <p class="wizard-question">Wie die App funktioniert</p>
            <p class="wizard-body">
              Diese App begleitet dich dabei, dein inneres Betriebssystem zu verstehen und zu verändern — in drei Schritten:
            </p>
            <div class="card">
              <div class="ob-row">
                <div class="ob-row-head">
                  <nav-icon name="journal" class="ob-row-icon"></nav-icon>
                  <span class="ob-row-label">Tagebuch</span>
                </div>
                <p class="ob-row-text">Erfasse Trigger aus deinem Alltag, Reflexionen, die dagegensprechen — und Handlungen, in denen du eine Überzeugung auf die Probe stellst.</p>
              </div>
              <div class="ob-row">
                <div class="ob-row-head">
                  <nav-icon name="beliefs" class="ob-row-icon"></nav-icon>
                  <span class="ob-row-label">Überzeugungen</span>
                </div>
                <p class="ob-row-text">Ergründe die Überzeugungen hinter den Auslösern und wandle sie in positive Affirmationen.</p>
              </div>
            </div>
          </div>

          <!-- Slide 2: Sicherheitshinweis -->
          <div v-show="obStep === 2">
            <p class="wizard-question">Ein ehrlicher Hinweis</p>
            <p class="wizard-body">
              Diese App berührt persönliche Überzeugungen, Gefühle und Selbstbild. Das kann heilsam sein — manchmal aber auch Belastendes aufwühlen.
            </p>
            <p class="wizard-body">
              <strong>Sie ersetzt keine Therapie oder professionelle Begleitung.</strong> Wenn du in einer Krise bist oder professionelle Unterstützung brauchst:
            </p>
            <div class="card">
              <div class="ob-row"><span class="ob-row-label">{{ support.name }}</span><p class="ob-row-text">{{ support.phone }} — {{ support.availability }}</p></div>
              <div class="ob-row"><span class="ob-row-label">Online-Beratung</span><p class="ob-row-text">{{ support.online }}</p></div>
            </div>
          </div>

          <!-- Slide 3: Datenschutz & KI -->
          <div v-show="obStep === 3">
            <p class="wizard-question">Deine Daten &amp; KI</p>
            <p class="wizard-body">
              Alle deine Einträge werden <strong>ausschließlich lokal</strong> in deinem Browser gespeichert — kein Server, kein Konto, keine Synchronisation.
            </p>
            <div class="card">
              <div class="ob-row"><span class="ob-row-label">Lokal gespeichert</span><p class="ob-row-text">Überzeugungen, Affirmationen, Handlungen, Situationen</p></div>
              <div class="ob-row"><span class="ob-row-label">KI-Verarbeitung</span><p class="ob-row-text">Wenn du die Empathie-Funktion nutzt, werden deine Eingaben zur Verarbeitung an die Anthropic API übertragen. Es gelten <strong>Anthropics Datenschutzrichtlinien</strong>. Du kannst die Funktion jederzeit weglassen.</p></div>
              <div class="ob-row"><span class="ob-row-label">API Key</span><p class="ob-row-text">Wird nur lokal auf deinem Gerät gespeichert.</p></div>
            </div>
          </div>
        </div>

        <div class="wizard-bottom-space"></div>
        <wizard-footer
          :nextLabel="obStep < 3 ? 'Weiter' : 'Los geht\'s'"
          @back="obBack"
          @next="obNext"
        ></wizard-footer>
      </div>
    </transition>
  </v-app>
</template>

<script>
import { SUPPORT_RESOURCE } from '@/utils/support';
import WizardHeader from '@/components/WizardHeader.vue';
import WizardFooter from '@/components/WizardFooter.vue';
import NavIcon from '@/components/NavIcon.vue';

const ONBOARDING_KEY = 'nvc.onboarded';

export default {
  name: 'app',
  components: { WizardHeader, WizardFooter, NavIcon },
  data() {
    return {
      support: SUPPORT_RESOURCE,
      showOnboarding: !localStorage.getItem(ONBOARDING_KEY),
      obStep: 1,
      obSw: { startX: 0, startY: 0, dx: 0, isH: null, drag: false },
    };
  },
  methods: {
    finishOnboarding() {
      localStorage.setItem(ONBOARDING_KEY, '1');
      this.showOnboarding = false;
    },
    // On the last slide, on is the same "done" the primary button reaches.
    obNext() {
      if (this.obStep < 3) this.obStep += 1;
      else this.finishOnboarding();
    },
    // Nothing precedes the first slide but the way out — the same rule
    // every other wizard's own back button follows.
    obBack() {
      if (this.obStep > 1) this.obStep -= 1;
      else this.finishOnboarding();
    },
    obTouchStart(e) {
      const t = e.touches[0];
      this.obSw.startX = t.clientX; this.obSw.startY = t.clientY;
      this.obSw.dx = 0; this.obSw.isH = null; this.obSw.drag = false;
    },
    obTouchMove(e) {
      const t = e.touches[0];
      const dx = t.clientX - this.obSw.startX, dy = t.clientY - this.obSw.startY;
      if (this.obSw.isH === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        this.obSw.isH = Math.abs(dx) > Math.abs(dy) * 1.5;
      }
      if (!this.obSw.isH) return;
      this.obSw.dx = dx; this.obSw.drag = true;
    },
    obTouchEnd() {
      if (this.obSw.drag) {
        if (this.obSw.dx < -50) this.obNext();
        else if (this.obSw.dx > 50) this.obBack();
      }
      this.obSw.dx = 0; this.obSw.drag = false; this.obSw.isH = null;
    },
  },
  created() {
    this.$store.dispatch('loadPatterns');
    this.$store.dispatch('loadBeliefs');
    this.$store.dispatch('loadJournal');
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
  -webkit-font-smoothing: antialiased;
}
/* Only on html: set on body as well it turns body into a scroll container of
   its own, and everything sticky inside it stops sticking. On html the rule
   propagates to the viewport, which is what it was for. */
html { overflow-x: hidden; }

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
/* Vuetify gives a fullscreen dialog its own overflow-y, but iOS Safari only
   hands it real touch scrolling with this — the same fix the sideways pill
   row already needed. Without it a wizard run inside a dialog renders fine
   but the finger never moves it. */
.v-dialog--fullscreen {
  -webkit-overflow-scrolling: touch;
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

/* ─── Wizards ───
   The steps borrow the list screens' language: a dark page, cards with the
   same radius and fill, the same detail rows, the same outline buttons. What
   is particular to a wizard is the frame — a title with a progress bar above,
   two ways on below — and the shape of a question. */
.wizard-page {
  background: #000;
  min-height: 100vh;
}
/* Holds its place while the step scrolls under it, like the list headers. */
.wizard-head {
  position: sticky;
  top: 0;
  z-index: 4;
  background: #000;
  padding: 6px 16px 12px;
}
.wizard-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}
/* One segment per step: how far along is a shape, not a fraction to read. */
.wizard-steps {
  display: flex;
  gap: 6px;
}
.wizard-step {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: #2c2c2e;
  transition: background 0.25s ease;
  &.done { background: #4ade80; }
}

/* What the step asks. Large and white — it is the one thing on the screen
   that has to be read before anything else can be answered. */
/* Same left/right inset as the cards' own text (14px margin + 16-18px
   padding) — the question, its body and its notes read as one column with
   the cards around them, not a narrower strip bleeding closer to the edge. */
.wizard-question {
  font-size: 1.35rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.3;
  margin: 22px 32px 10px;
}
/* The elaboration under the question. */
.wizard-body {
  font-size: 1rem;
  color: #8e8e93;
  line-height: 1.55;
  margin: 0 32px 16px;
}
/* Quieter still: a rule of thumb, a count, a caveat. */
.wizard-note {
  font-size: 0.85rem;
  color: #636366;
  line-height: 1.5;
  margin: 0 32px 14px;
}
.wizard-note strong, .wizard-body strong { color: #fff; font-weight: 600; }
/* Clears the fixed footer. */
.wizard-bottom-space { height: 96px; }

/* Two ways on, always in the same place. */
.wizard-footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  /* Not calc(12px + env(...)): the build's cssnano cannot parse env() inside
     calc(). The bare fallback covers phones without an inset. */
  padding-bottom: env(safe-area-inset-bottom, 12px);
  background: #000;
  border-top: 1px solid #1c1c1e;
}
.wizard-back {
  flex: 0 0 auto;
  background: none;
  border: 1px solid #3a3a3c;
  border-radius: 999px;
  color: #8e8e93;
  font-family: inherit;
  font-size: 1rem;
  padding: 13px 28px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
.wizard-next {
  flex: 1;
  background: #4ade80;
  border: none;
  border-radius: 999px;
  color: #000;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  padding: 13px 20px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.8; }
  &:disabled { background: #2c2c2e; color: #636366; cursor: default; }
}

/* The answer field, set apart by a green edge the way a saved affirmation is:
   this is the part of the screen that is yours to write. */
.input-card {
  background: #0e0e0f;
  border: 1px solid #4ade80;
  border-radius: 18px;
  margin: 0 14px 12px;
  padding: 14px 16px;
}
.input-card-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  color: #4ade80;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  margin: 0 0 8px;
  .v-icon { color: #4ade80 !important; font-size: 0.95rem !important; }
}
.input-card-field {
  display: block;
  width: 100%;
  background: none;
  border: none;
  outline: none;
  resize: none;
  color: #fff;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  padding: 0;
  &::placeholder { color: #48484a; }
}

/* A recorded number and the scale it sits on. */
.meter-card { padding: 16px 18px 14px; }
.meter-head {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-bottom: 12px;
}
.meter-value { font-size: 2rem; font-weight: 700; color: #fff; line-height: 1; }
.meter-max { font-size: 0.9rem; color: #636366; }
.meter-label { font-size: 0.9rem; color: #8e8e93; margin-left: auto; }
.meter-ends {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: #636366;
  margin-top: 8px;
}
.meter-hint {
  font-size: 0.82rem;
  color: #8e8e93;
  line-height: 1.5;
  margin: 12px 0 0;
  text-align: center;
}
.meter-slider {
  display: block;
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #2c2c2e;
  outline: none;
  cursor: pointer;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #4ade80;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }
  &::-moz-range-thumb {
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 50%;
    background: #4ade80;
    cursor: pointer;
  }
  &:disabled {
    cursor: default;
    &::-webkit-slider-thumb { cursor: default; }
  }
}

/* A group to open and pick from — feelings, needs. Same card as everywhere;
   the colour lives in a dot and in what is already chosen, not in a border. */
.pick-card {
  background: #141416;
  border-radius: 18px;
  margin: 0 14px 10px;
  overflow: hidden;
}
.pick-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.pick-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.pick-name {
  flex: 1;
  min-width: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #fff;
}
.pick-count { font-size: 0.9rem; color: #8e8e93; flex-shrink: 0; }
.pick-desc {
  font-size: 0.88rem;
  color: #8e8e93;
  line-height: 1.45;
  margin: 0 16px 12px;
}
.pick-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 16px 14px;
}
/* Outline, like every other chip in the app since the redesign. */
.pick-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid currentColor;
  border-radius: 999px;
  padding: 6px 13px;
  font-size: 0.92rem;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
.pick-chip-x { opacity: 0.7; font-size: 0.95rem; line-height: 1; }
.pick-body { border-top: 1px solid #2c2c2e; }
.pick-cluster {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #2c2c2e;
  cursor: pointer;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}
/* Each cluster sits in its own wrapper (its open chip list is a sibling, not
   a child), so `.pick-cluster:last-child` would always match — it is always
   the only element of that class in its own wrapper. The true last cluster
   is found through the wrapper instead. */
.pick-body > div:last-child > .pick-cluster { border-bottom: none; }
.pick-body > div:last-child > .pick-chips-open { border-bottom: none; }
.pick-cluster-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  opacity: 0.16;
}
.pick-cluster-label {
  position: relative;
  flex: 1;
  font-size: 0.95rem;
  color: #ebebf5;
}
.pick-cluster-count {
  position: relative;
  font-size: 0.8rem;
  color: #8e8e93;
  flex-shrink: 0;
  margin-left: 8px;
}
/* An open cluster's words are their own block between two rows, not a strip
   floating between them — a rule under it holds it apart from the next
   cluster the same way every closed row already holds itself apart. */
.pick-chips-open {
  padding-top: 12px;
  border-bottom: 1px solid #2c2c2e;
}

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

/* ─── Onboarding overlay ───
   Same frame every wizard uses — a title with a progress bar, cards on
   black, two ways on below — so the first thing anyone sees already looks
   like the app they are about to use. */
.ob-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.ob-row {
  padding: 12px 0;
  border-top: 1px solid #2c2c2e;
  &:first-child { border-top: none; }
}
.ob-row-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
/* Same 24px box the bottom bar's own icons use — recognisable as the same
   icon, not a shrunken copy of it. */
.ob-row-icon { color: #4ade80; flex-shrink: 0; }
.ob-row-label {
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
}
.ob-row-text {
  color: #8e8e93;
  font-size: 0.88rem;
  line-height: 1.5;
  margin: 0;
}
.ob-fade-enter-active, .ob-fade-leave-active { transition: opacity 0.25s; }
.ob-fade-enter, .ob-fade-leave-to { opacity: 0; }

/* ─── Cards ───
   One visual language for the four lists. Every screen is a stack of cards on
   black: a filter row at the top, then one card per thing, each card a title
   with its state and its number, then labelled rows of what was written. */
/* Heading, the buttons beside it and the filters stay put while the list
   moves under them: the filters are how you steer the list, and steering
   should not require scrolling back up. */
.screen-header {
  position: sticky;
  top: 0;
  z-index: 4;
  background: #000;
}
.screen-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px 2px;
}
.screen-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
  letter-spacing: -0.02em;
}
/* Lifted 2px: the title's cap height sits above its box, so centring on the
   box leaves the round buttons looking low next to it. */
.screen-actions { display: flex; gap: 8px; flex-shrink: 0; position: relative; top: -2px; }
/* Reserve the glyph box: until the icon font arrives the ligature renders as
   its own word, which is wider than the icon and shoves the header sideways
   for the first paint. */
.screen-add .v-icon {
  width: 24px;
  overflow: hidden;
  justify-content: center;
}
.screen-add {
  /* Grey: adding and settings are always-there controls, not the step the
     screen is inviting. */
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #1c1c1e;
  border: none;
  color: #8e8e93;
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
  padding: 8px 14px 10px;
  overflow-x: auto;
  /* Sideways only: a sub-pixel of height must not become a second scrollbar. */
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
/* Stacked filter rows sit as close together as the last row sits to the
   card: they are one control, not two separate blocks. */
.pill-row + .pill-row { padding-top: 0; }
.pill {
  flex-shrink: 0;
  background: none;
  border: 1px solid #2c2c2e;
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 0.88rem;
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
/* Square-ish, because it holds an icon rather than a word. */
.pill-icon {
  padding: 8px 10px;
  display: flex;
  align-items: center;
  .v-icon { color: #8e8e93 !important; }
  &.active .v-icon { color: #fff !important; }
}
.pill.active .pill-count { color: #8e8e93; }

.card {
  background: #141416;
  border-radius: 18px;
  margin: 0 14px 12px;
  padding: 16px 18px;
}
.card-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.card-title {
  flex: 1;
  min-width: 0;
  font-size: 1.1rem;
  line-height: 1.35;
  color: #fff;
  margin: 0;
  font-weight: 400;
}
.card-btn {
  flex-shrink: 0;
  background: none;
  border: 1px solid #4ade80;
  border-radius: 999px;
  color: #4ade80;
  font-size: 0.9rem;
  font-family: inherit;
  padding: 7px 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
/* A second step offered right beside the first — split the same pill the
   swipe menu uses for its own grouped actions, instead of two separate
   buttons. */
/* Swipe actions look like the button they sit beside: outlined, the same size.
   Several of them share one outline and are divided by a hairline, so two or
   three actions cost barely more width than one. */
.swipe-group {
  display: inline-flex;
  align-items: stretch;
  border: 1px solid #4ade80;
  border-radius: 999px;
  overflow: hidden;
}
.swipe-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: 0.9rem;
  font-family: inherit;
  padding: 7px 14px;
  cursor: pointer;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
  & + & { border-left: 1px solid #4ade80; }
}
/* On its own it carries its own outline in its own colour. */
.swipe-group.single {
  border-color: currentColor;
}
.swipe-btn-edit { color: #4ade80; }
.swipe-btn-change { color: #4ade80; }
.swipe-btn-act { color: #4ade80; }
.swipe-btn-evaluate { color: #4ade80; }
.swipe-btn-delete { color: #ff453a; }

/* The head slides on its own; the rest of the card stays put. */
.head-swipe {
  position: relative;
  overflow: hidden;
}
.head-swipe .swipe-panel {
  position: absolute;
  top: 0;
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.head-swipe .swipe-panel.left { left: 0; }
.head-swipe .swipe-panel.right { right: 0; }
.swipe-handle {
  position: relative;
  background: #141416;
  touch-action: pan-y;
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
  font-size: 0.78rem;
  font-weight: 500;
  color: #8e8e93;
  background: #2c2c2e;
  border-radius: 8px;
  padding: 4px 10px;
}

/* The number first, then what it measures — the value is what the eye is
   looking for. */
.score-row {
  position: relative;
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-top: 12px;
}
.score-value { font-size: 2rem; font-weight: 700; color: #fff; line-height: 1; }
.score-max { font-size: 0.9rem; color: #636366; }
.score-label { font-size: 0.9rem; color: #8e8e93; }

.card-sep { height: 1px; background: #2c2c2e; margin: 14px 0 0; }

/* One track, two fills: the fear laid over what reality turned out to be, so
   the difference is the part of the bar that is only orange. Shared by the
   Handlungen list's own rows and the result wizard's recap card. */
.gap-bar {
  display: flex;
  gap: 3px;
  margin-top: 16px;
}
/* The same ten blocks the credibility bar is drawn in, so both read the
   same way: a whole point per block, with the gaps saying so. */
.gap-seg {
  flex: 1;
  height: 10px;
  border-radius: 2px;
  background: #3a3a3c;
}
.gap-seg.expected { background: #fd9927; }
.gap-seg.real { background: #6aaef7; }
.gap-legend {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 10px;
  font-size: 0.85rem;
  color: #8e8e93;
}
.gap-key { display: flex; align-items: center; gap: 6px; }
.gap-dot { width: 9px; height: 9px; border-radius: 3px; display: inline-block; }
.gap-dot-expected { background: #fd9927; }
.gap-dot-real { background: #6aaef7; }
.gap-delta { margin-left: auto; font-weight: 600; }

/* A written answer, folded to one line until it is asked for. */
.detail-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #2c2c2e;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
  &:last-child { border-bottom: none; }
}
.detail-label {
  flex: 0 0 34%;
  font-size: 0.95rem;
  color: #fff;
}
.detail-value {
  flex: 1;
  min-width: 0;
  font-size: 0.95rem;
  color: #8e8e93;
  text-align: left;
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
  font-size: 1.05rem !important;
  /* Reserve the glyph box: until the icon font arrives, the ligature renders
     as its own word — wide enough to blow out a grid column that has no
     min-width to fall back on. */
  width: 1.05rem;
  overflow: hidden;
}
/* Once open the answer needs the full width, so the label sits above it. */
.detail-row.open {
  display: block;
  cursor: pointer;
}
.detail-row.open .detail-label { display: block; margin-bottom: 6px; }

/* The affirmation, set apart by a green edge: it is the one sentence on the
   card that is meant to be true rather than merely recorded. */
/* Butted straight against the line above it: the affirmation is the end of
   that list, not a separate card floating under it. */
/* A belief and the sentence meant to replace it, read as a pair: each marked
   down its left in the colour the credibility bar gives it — red for what is
   still held, green for what is being grown into. Compact on purpose; only
   the Überzeugungen list, where the belief is the subject, spells it out. */
/* No bar down the side any more: the two are told apart by how bright they
   are, which is enough where they always stand one above the other. */
.quote-belief,
.quote-affirmation {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.quote-belief {
  color: #8e8e93;
}
/* The brighter of the two: it is the sentence being grown into, and the one
   the eye should land on. */
.quote-affirmation {
  color: #ebebf5;
  margin-top: 6px;
}

.aff-box {
  border-left: 3px solid #4ade80;
  background: #1c1c1e;
  border-radius: 0;
  padding: 14px 16px;
  margin-top: 0;
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
  font-size: 1rem;
  color: #fff;
  line-height: 1.4;
  margin: 0;
}

/* Links out of the card, to the lists that own the detail. */
.card-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 0;
  border-top: 1px solid #2c2c2e;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
.card-link-text { flex: 1; font-size: 0.95rem; color: #8e8e93; }

.list-empty {
  text-align: center;
  padding: 4rem 2rem;
}
.list-empty-title { font-size: 1.05rem; color: #fff; font-weight: 600; margin: 0 0 6px; }
.list-empty-sub { font-size: 0.9rem; color: #8e8e93; margin: 0; line-height: 1.5; }

.list-bottom-space { height: 90px; }
</style>
