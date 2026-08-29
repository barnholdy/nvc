<template>
  <div>
    <p class="wizard-question">Was willst du erfassen?</p>
    <p class="wizard-body">
      Alles gehört ins selbe Buch: das eine hält fest, wann eine Überzeugung
      zugeschlagen hat, das andere, wann sie danebenlag — und das dritte
      stellt sie auf die Probe.
    </p>

    <div
      v-for="t in types"
      :key="t.key"
      class="card type-card"
      :class="{ selected: t.key === selected }"
      @click="pick(t.key)"
    >
      <svg class="type-icon" viewBox="0 0 24 24" width="26" height="26">
        <path :d="t.icon" fill="currentColor"></path>
      </svg>
      <div class="type-main">
        <p class="card-title">{{ t.label }}</p>
        <p class="type-desc">{{ t.desc }}</p>
      </div>
    </div>
  </div>
</template>

<script>
// The fork in the wizard. A Trigger records a moment that set a belief off, a
// Reflexion one that spoke against it — the questions after this differ
// because the two ask about opposite kinds of evidence. A Handlung is not a
// moment that happened but one you intend, so it is planned in the wizard
// that owns it; picking it hands over to that one.
import { mdiLightningBolt, mdiBookOpenPageVariant, mdiFlaskOutline } from '@mdi/js';
import { TRIGGER, REFLECTION, ACTION } from '@/utils/journalBeliefs';

export default {
  name: 'journal-add-type',
  props: {
    initialValue: { type: String, default: null },
  },
  data() {
    return { selected: this.initialValue };
  },
  computed: {
    types() {
      return [
        {
          key: TRIGGER,
          label: 'Trigger',
          desc: 'Ein Moment, in dem eine Überzeugung zugeschlagen hat.',
          icon: mdiLightningBolt,
        },
        {
          key: REFLECTION,
          label: 'Reflexion',
          desc: 'Ein Gegenbeispiel — etwas, das gegen eine Überzeugung spricht.',
          icon: mdiBookOpenPageVariant,
        },
        {
          key: ACTION,
          label: 'Handlung',
          desc: 'Etwas, das du vorhast, um eine Überzeugung auf die Probe zu stellen.',
          icon: mdiFlaskOutline,
        },
      ];
    },
  },
  methods: {
    pick(key) {
      this.selected = key;
      this.$emit('changed', key);
    },
  },
};
</script>

<style scoped lang="scss">
.type-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  cursor: pointer;
  border: 1px solid transparent;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.7; }
  &.selected {
    border-color: var(--accent);
    .card-title,
    .type-icon { color: var(--accent-light); }
  }
}
.type-icon {
  flex-shrink: 0;
  color: var(--text-muted);
  margin-top: 2px;
}
.type-main { flex: 1; min-width: 0; }
.type-desc {
  font-size: 0.88rem;
  color: var(--text-muted);
  margin: 6px 0 0;
  line-height: 1.4;
}
</style>
