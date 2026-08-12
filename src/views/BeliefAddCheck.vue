<template>
  <div>
    <p class="wizard-question">Wie geht es dir gerade?</p>
    <p class="wizard-body">Kurz gespürt — dann bist du fertig.</p>

    <div class="mood-list">
      <button
        v-for="m in moods"
        :key="m.key"
        type="button"
        class="mood-btn"
        :class="{ selected: m.key === mood }"
        @click="select(m.key)"
      >{{ m.label }}</button>
    </div>

    <!-- Only for the loudest answer. A permanent disclaimer would be noise. -->
    <div v-if="showSignpost" class="signpost">
      <p class="signpost-text">
        Das darf sein — solche Erinnerungen können nachwirken. Wenn es viel wird, sprich mit
        jemandem, dem du vertraust, oder hol dir Unterstützung.
      </p>
      <a class="signpost-link" :href="support.phoneHref">
        <v-icon small color="#4ade80">phone</v-icon>
        <span>{{ supportLine }}</span>
      </a>
    </div>
  </div>
</template>

<script>
import { MOODS, needsSignpost } from '@/utils/originArc';
import { SUPPORT_RESOURCE, supportLine } from '@/utils/support';

// Three buttons instead of a scale: the answer only has to be good enough to
// decide whether the signpost belongs on screen.
export default {
  name: 'belief-add-check',
  props: {
    initialValue: { type: String, default: null },
  },
  data() {
    return {
      mood: this.initialValue || null,
      moods: MOODS,
      support: SUPPORT_RESOURCE,
      supportLine: supportLine(),
    };
  },
  computed: {
    showSignpost() {
      return needsSignpost(this.mood);
    },
  },
  methods: {
    select(key) {
      this.mood = key;
      this.$emit('changed', key);
    },
  },
};
</script>

<style scoped lang="scss">
/* The cards' own margin, so the answers line up with everything else. */
.mood-list { margin: 0 14px; }
.mood-btn {
  display: block;
  width: 100%;
  text-align: left;
  font-size: 1rem;
  color: #ebebf5;
  background: #141416;
  border: 1px solid transparent;
  border-radius: 18px;
  padding: 16px 18px;
  margin-bottom: 10px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:focus-visible {
    outline: 2px solid #4ade80;
    outline-offset: 2px;
  }
  &.selected {
    border-color: #4ade80;
    color: #4ade80;
    font-weight: 600;
  }
}

.signpost {
  background: #1c1c1e;
  border-radius: 18px;
  margin: 14px 14px 0;
  padding: 16px 18px;
}
.signpost-text {
  font-size: 0.9rem;
  color: #fff;
  line-height: 1.6;
  margin: 0 0 10px;
}
.signpost-link {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #4ade80;
  text-decoration: none;
  font-weight: 600;
  &:focus-visible {
    outline: 2px solid #4ade80;
    outline-offset: 2px;
  }
}
</style>
