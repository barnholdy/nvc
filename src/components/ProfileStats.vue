<template>
  <div v-if="beliefs.length">
    <p class="section-head">Bedürfnisprofil</p>
    <div class="card">
      <template v-if="topNeeds.length">
        <div v-for="n in topNeeds" :key="n.name" class="stat-item">
          <div class="stat-header-row">
            <span class="stat-name">{{ n.name }}</span>
            <span class="stat-count">{{ n.count }}×</span>
          </div>
          <div class="stat-bar-bg">
            <div
              class="stat-bar-fill"
              :style="{ width: pct(n.count, topNeeds[0].count), background: needColor(n.name) }"
            ></div>
          </div>
        </div>
      </template>
      <p v-else class="stat-empty">Noch keine Bedürfnisse in Überzeugungen erfasst.</p>
    </div>

    <!-- The two sides of the same question: what the belief does to you, and
         what stands there instead once it is gone. -->
    <p class="section-head">Gefühle</p>
    <div class="affect-grid">
      <div v-for="col in columns" :key="col.label" class="card affect-card">
        <p class="col-label">{{ col.label }}</p>
        <template v-if="col.items.length">
          <div v-for="f in col.items" :key="f.name" class="stat-item stat-item-sm">
            <div class="stat-header-row">
              <span class="stat-name stat-name-sm">{{ f.name }}</span>
              <span class="stat-count">{{ f.count }}×</span>
            </div>
            <div class="stat-bar-bg">
              <div
                class="stat-bar-fill"
                :style="{ width: pct(f.count, col.items[0].count), background: feelingColor(f.name) }"
              ></div>
            </div>
          </div>
        </template>
        <p v-else class="stat-empty">–</p>
      </div>
    </div>
  </div>
</template>

<script>
import { colorForFeeling } from '@/utils/emotions';
import { colorForNeed } from '@/utils/needs';

// Five is what fits on a phone without becoming a table.
const TOP = 5;

export default {
  name: 'profile-stats',
  computed: {
    beliefs() { return this.$store.getters.beliefs; },
    topNeeds() {
      const counts = {};
      this.beliefs.forEach((b) => {
        // A need may be stored once per Grundemotion — count it once per belief.
        const seen = {};
        (b.needs || []).forEach((n) => {
          if (n && n.name && !seen[n.name]) {
            seen[n.name] = true;
            counts[n.name] = (counts[n.name] || 0) + 1;
          }
        });
      });
      return Object.keys(counts)
        .map(name => ({ name, count: counts[name] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, TOP);
    },
    columns() {
      return [
        { label: 'Reaktion', items: this.countFeelings(b => b.feelings || []) },
        {
          label: 'Neue Reaktion',
          items: this.countFeelings(b => (b.reflection && b.reflection.withoutBeliefFeelings) || []),
        },
      ];
    },
  },
  methods: {
    countFeelings(getFeelings) {
      const counts = {};
      this.beliefs.forEach((b) => {
        const seen = {};
        getFeelings(b).forEach((f) => {
          if (f && f.name && !seen[f.name]) {
            seen[f.name] = true;
            counts[f.name] = (counts[f.name] || 0) + 1;
          }
        });
      });
      return Object.keys(counts)
        .map(name => ({ name, count: counts[name] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, TOP);
    },
    pct(count, max) {
      if (!max) return '0%';
      return `${Math.round((count / max) * 100)}%`;
    },
    feelingColor(name) { return colorForFeeling(name); },
    needColor(name) { return colorForNeed(name); },
  },
};
</script>

<style scoped lang="scss">
.section-head {
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8e8e93;
  margin: 18px 20px 8px;
}

.affect-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  /* The cards carry their own side margin, which a grid cell must not repeat. */
  margin: 0 14px 12px;
  .card { margin: 0; }
}
.affect-card { padding: 14px; }
.col-label {
  font-size: 0.7rem;
  color: #8e8e93;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 10px;
}

.stat-item + .stat-item { margin-top: 14px; }
.stat-item-sm .stat-name { font-size: 0.82rem; }
.stat-header-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 7px;
  min-width: 0;
}
.stat-name {
  font-size: 0.95rem;
  color: #fff;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.stat-count {
  font-size: 0.78rem;
  color: #8e8e93;
  flex-shrink: 0;
  margin-left: 8px;
}
.stat-bar-bg {
  height: 14px;
  background: #2c2c2e;
  border-radius: 7px;
  overflow: hidden;
}
.stat-bar-fill {
  height: 100%;
  border-radius: 7px;
  transition: width 0.5s ease;
  min-width: 8px;
}
.stat-empty {
  font-size: 0.9rem;
  color: #8e8e93;
  margin: 0;
}
</style>
