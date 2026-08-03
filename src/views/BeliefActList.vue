<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-toolbar-title>Handeln</v-toolbar-title>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <v-layout column>
          <v-flex class="mt-2 mb-3">
            <h1 class="headline font-weight-regular">Handeln</h1>
            <p class="subheading grey--text belief-quote mt-1">„{{ belief }}“</p>
          </v-flex>

          <!-- Where this belief has already shown up, so the next step is taken
               from what happened rather than from a blank page. -->
          <v-flex v-if="situations.length" class="mb-3">
            <p class="body-1 white--text mb-2">
              Schaue auf die Überzeugung und vergangene Situationen:
            </p>
            <situation-rows :situations="situations"></situation-rows>
          </v-flex>

          <v-flex class="mb-4">
            <p class="body-1 grey--text">
              Welche neuen Situationen willst du nutzen, um deine Überzeugung an der Realität
              zu testen? Die Befürchtung trägst du später ein, wenn du die Handlung planst.
            </p>
          </v-flex>

          <!-- Existing experiments -->
          <v-flex class="mb-4">
            <p class="section-label">Deine Handlungen</p>
            <p v-if="!experiments.length" class="empty-text">
              Noch keine Handlung angelegt.
            </p>
            <div v-for="x in experiments" :key="x.id" class="exp-row">
              <div class="exp-body">
                <p class="exp-text">{{ x.situation || 'Ohne Situation' }}</p>
                <span class="status-pill" :style="{ color: stateColor(x) }">{{ stateLabel(x) }}</span>
              </div>
              <button class="exp-delete" @click.stop="remove(x)">
                <v-icon small color="#ff453a">delete</v-icon>
              </button>
            </div>
          </v-flex>

          <!-- Add a new one: situation only, so it lands under "Offen" -->
          <v-flex>
            <p class="section-label">Neue Handlung</p>
            <action-prompt :belief="entry" class="mb-2"></action-prompt>
            <v-text-field
              placeholder="..."
              v-model="newSituation"
              multi-line
              rows="4"
              hide-details
              @focus="isFooterFixed = false"
              @blur="isFooterFixed = true"
            ></v-text-field>
            <v-btn
              small
              flat
              color="primary"
              class="ml-0 mt-2"
              :disabled="!newSituation.trim()"
              @click="add"
            >
              <v-icon small left>add</v-icon>
              Hinzufügen
            </v-btn>
          </v-flex>
        </v-layout>
      </v-container>

      <v-footer :fixed="isFooterFixed" color="white elevation-3" height="44">
        <v-btn @click="save" block large color="primary">speichern</v-btn>
      </v-footer>
    </v-content>
  </div>
</template>

<script>
import ActionPrompt from '@/components/ActionPrompt.vue';
import SituationRows from '@/components/SituationRows.vue';
import { beliefStatus } from '@/utils/beliefStatus';
import { situationsForBelief } from '@/utils/patterns';
import {
  createExperiment,
  experimentsOf,
  experimentStateLabel,
  experimentStateColor,
} from '@/utils/experiment';

export default {
  name: 'belief-act-list',
  components: { ActionPrompt, SituationRows },
  data() {
    const entry = this.$store.getters.beliefs
      .find(function(b) { return b.time === parseInt(this.$route.params.time, 10); }, this);
    return {
      entry: entry || null,
      experiments: experimentsOf(entry).map(x => Object.assign({}, x)),
      newSituation: '',
      isFooterFixed: true,
    };
  },
  computed: {
    belief() {
      return this.entry ? this.entry.belief : '';
    },
    situations() {
      return situationsForBelief(this.$store.getters.patterns, this.entry && this.entry.time);
    },
  },
  methods: {
    stateLabel(x) { return experimentStateLabel(x); },
    stateColor(x) { return experimentStateColor(x); },
    // Only the situation is captured here, so the experiment has no anchor yet
    // and lands under "Offen" until it is planned.
    add() {
      const text = this.newSituation.trim();
      if (!text) return;
      const x = createExperiment(Date.now());
      x.situation = text;
      this.experiments.push(x);
      this.newSituation = '';
    },
    remove(x) {
      const i = this.experiments.findIndex(e => e.id === x.id);
      if (i >= 0) this.experiments.splice(i, 1);
    },
    save() {
      if (!this.entry) { this.$router.push('/beliefs'); return; }
      const r = this.entry.reflection || {};
      const saved = Object.assign({}, this.entry, {
        reflection: Object.assign({}, r, { experiments: this.experiments }),
      });
      this.$store.dispatch('updateBelief', saved);
      this.$router.push({ path: '/beliefs', query: { tab: beliefStatus(saved) } });
    },
    close() {
      this.$router.push('/beliefs');
    },
  },
};
</script>

<style scoped lang="scss">
.belief-quote { font-style: italic; }

.section-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #636366;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 6px;
}
.empty-text {
  font-size: 0.875rem;
  color: #8e8e93;
  margin: 0;
}

.exp-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid #2c2c2e;
  &:first-of-type { border-top: none; }
}
.exp-body { flex: 1; min-width: 0; }
.exp-text {
  font-size: 0.95rem;
  color: #ebebf5;
  margin: 0;
  line-height: 1.4;
  word-break: break-word;
}
.status-pill {
  display: inline-block;
  margin-top: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  background: #2c2c2e;
  border-radius: 20px;
  padding: 1px 8px;
}
.exp-delete {
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 8px;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}

</style>
