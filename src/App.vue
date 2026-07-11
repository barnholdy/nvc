<template>
  <v-app>
    <router-view/>
  </v-app>
</template>

<script>
export default {
  name: 'app',
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
  font-size: 1.25rem !important;
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
</style>
