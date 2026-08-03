<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Wie geht's dir gerade?</h1>
      <p class="body-1 white--text mt-3">Kurz gespürt — dann bist du fertig.</p>
    </v-flex>

    <v-flex>
      <button
        v-for="m in moods"
        :key="m.key"
        type="button"
        class="mood-btn"
        :class="{ selected: m.key === mood }"
        @click="select(m.key)"
      >{{ m.label }}</button>
    </v-flex>

    <!-- Only for the loudest answer. A permanent disclaimer would be noise. -->
    <v-flex v-if="showSignpost" class="mt-4">
      <div class="signpost">
        <p class="signpost-text">
          Das darf sein — solche Erinnerungen können nachwirken. Wenn es viel wird, sprich mit
          jemandem, dem du vertraust, oder hol dir Unterstützung.
        </p>
        <a class="signpost-link" :href="support.phoneHref">
          <v-icon small color="#4ade80">phone</v-icon>
          <span>{{ supportLine }}</span>
        </a>
      </div>
    </v-flex>
  </v-layout>
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
.mood-btn {
  display: block;
  width: 100%;
  text-align: left;
  font-size: 0.95rem;
  color: #ebebf5;
  background: #1c1c1e;
  border: 1.5px solid transparent;
  border-radius: 12px;
  padding: 15px 16px;
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
  border-radius: 12px;
  padding: 14px 16px;
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
