<template>
  <div class="affirmation-list">
    <v-toolbar color="white" app>
      <v-toolbar-title>Affirmationen</v-toolbar-title>
    </v-toolbar>
    <v-content>
      <template v-if="affirmations.length">
        <v-card
          class="affirmation-card"
          v-for="(item, i) in affirmations"
          :key="item.patternTime + '-' + item.affirmationIndex"
        >
          <v-card-title class="affirmation-header" @click="toggle(i)">
            <p class="body-1 affirmation-text mb-0">{{ item.text }}</p>
            <div class="counter-tap" @click.stop="handleTap(item)">
              <span class="count-badge">{{ item.count }}</span>
              <span class="count-plus">+</span>
            </div>
          </v-card-title>
          <template v-if="openIndex === i">
            <v-divider></v-divider>
            <v-card-text>
              <p class="caption grey--text mb-1 section-label">Glaube / Urteil</p>
              <p class="body-1 belief-quote">„{{ item.belief }}"</p>
              <p class="caption grey--text mt-1">{{ item.patternName }}</p>
            </v-card-text>
          </template>
        </v-card>
      </template>

      <div v-else class="empty-state">
        <v-icon large color="grey lighten-2">stars</v-icon>
        <p class="body-1 grey--text mt-2">Noch keine Affirmationen vorhanden.</p>
        <p class="caption grey--text">Füge Affirmationen zu deinen Mustern hinzu.</p>
      </div>
    </v-content>

    <v-bottom-nav :value="true" fixed app color="white" class="elevation-3">
      <v-btn flat color="grey" to="/check-ins">
        <span>Check-Ins</span>
        <v-icon>favorite_border</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/patterns">
        <span>Muster</span>
        <v-icon>repeat</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/affirmations">
        <span>Affirmationen</span>
        <v-icon>stars</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
export default {
  name: 'affirmation-list',
  data() {
    return {
      openIndex: null,
      tapTimeouts: {},
    };
  },
  computed: {
    affirmations() {
      const result = [];
      this.$store.getters.patterns.forEach(pattern => {
        if (!pattern.affirmations || !pattern.affirmations.length) return;
        pattern.affirmations.forEach((a, idx) => {
          result.push({
            text: a.text,
            count: a.count || 1,
            belief: pattern.belief,
            patternName: pattern.name || pattern.belief,
            patternTime: pattern.time,
            affirmationIndex: idx,
          });
        });
      });
      return result.sort((a, b) => (b.count || 1) - (a.count || 1));
    },
  },
  methods: {
    toggle(i) {
      this.openIndex = this.openIndex === i ? null : i;
    },
    handleTap(item) {
      const key = item.patternTime + '-' + item.affirmationIndex;
      if (this.tapTimeouts[key]) {
        clearTimeout(this.tapTimeouts[key]);
        this.$delete(this.tapTimeouts, key);
        if (item.count > 1) this.updateCount(item, -1);
      } else {
        this.$set(this.tapTimeouts, key, setTimeout(() => {
          this.$delete(this.tapTimeouts, key);
          this.updateCount(item, 1);
        }, 300));
      }
    },
    updateCount(item, delta) {
      const pattern = this.$store.getters.patterns.find(p => p.time === item.patternTime);
      if (!pattern) return;
      const affirmations = pattern.affirmations.map((a, i) =>
        i === item.affirmationIndex
          ? Object.assign({}, a, { count: Math.max(1, (a.count || 1) + delta) })
          : a
      );
      this.$store.dispatch('updatePattern', Object.assign({}, pattern, { affirmations: affirmations }));
    },
  },
};
</script>

<style scoped lang="scss">
.affirmation-card {
  margin: 1rem;
}
.affirmation-header {
  cursor: pointer;
  user-select: none;
  position: relative;
  align-items: flex-start !important;
  padding: 12px 16px 12px 16px !important;
  padding-right: 72px !important;
}
.affirmation-text {
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
  width: 100%;
}
.counter-tap {
  position: absolute;
  top: 12px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  border-radius: 20px;
  border: 1.5px solid #00838f;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  &:active {
    background: #e0f7fa;
  }
}
.belief-quote {
  font-style: italic;
}
.section-label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.count-badge {
  color: #00838f;
  font-size: 0.85rem;
  font-weight: bold;
  min-width: 14px;
  text-align: center;
}
.count-plus {
  color: #00838f;
  font-size: 0.8rem;
  font-weight: bold;
  line-height: 1;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  text-align: center;
}
</style>
