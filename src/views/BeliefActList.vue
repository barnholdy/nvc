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
            <div v-for="p in situations" :key="p.time" class="situation-row">
              <p class="situation-text">{{ p.trigger || p.name }}</p>
            </div>
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
            <!-- Assembled in JS so the coloured words sit inside the sentence
                 without the template's whitespace handling eating the spaces. -->
            <p class="body-1 grey--text mb-2"><span v-for="(seg, i) in promptSegments" :key="i" :style="seg.color ? { color: seg.color, fontWeight: 600 } : null">{{ seg.text }}</span></p>
            <p v-if="affirmationText" class="affirmation-line mb-2">
              Denke an deine Affirmation: <span class="affirmation-text">{{ affirmationText }}</span>
            </p>
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
import { beliefStatus } from '@/utils/beliefStatus';
import { colorForFeeling, dedupeByName, joinNames, NEED_COLOR } from '@/utils/emotions';
import {
  createExperiment,
  experimentsOf,
  experimentStateLabel,
  experimentStateColor,
} from '@/utils/experiment';

export default {
  name: 'belief-act-list',
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
    // The need this belief was a strategy for, and the feelings the new
    // perspective brought — the two things a different strategy has to deliver.
    needPhrase() {
      const names = dedupeByName((this.entry && this.entry.needs) || []).map(n => n.name);
      return joinNames(names);
    },
    changeFeelings() {
      const r = (this.entry && this.entry.reflection) || {};
      const list = Array.isArray(r.withoutBeliefFeelings) ? r.withoutBeliefFeelings : [];
      return dedupeByName(list);
    },
    affirmationText() {
      const list = (this.entry && this.entry.affirmations) || [];
      return list.map(a => a && a.text).filter(Boolean).join(' · ');
    },
    promptSegments() {
      const parts = [{
        text: 'In welcher konkreten Situation in den nächsten Tagen könntest du dich so '
          + 'verhalten, als würde diese Überzeugung nicht gelten? ',
      }];

      const need = this.needPhrase;
      const feelings = this.changeFeelings;
      // Without either of them there is nothing to name, so the question is left out.
      if (need || feelings.length) {
        parts.push({ text: 'Welche andere Strategie findest du, um ' });
        if (need) {
          parts.push({ text: 'dein Bedürfnis nach ' });
          parts.push({ text: need, color: NEED_COLOR });
          parts.push({ text: ' zu erfüllen' });
        }
        if (need && feelings.length) parts.push({ text: ' und ' });
        if (feelings.length) {
          parts.push({ text: 'dich ' });
          feelings.forEach((f, i) => {
            parts.push({ text: f.name, color: colorForFeeling(f.name) });
            if (i < feelings.length - 2) parts.push({ text: ', ' });
            else if (i === feelings.length - 2) parts.push({ text: ' und ' });
          });
          parts.push({ text: ' zu fühlen' });
        }
        parts.push({ text: '? ' });
      }

      parts.push({
        text: 'Wo, mit wem, wann? Klein, konkret, überprüfbar — ein Moment, kein Lebensthema.',
      });
      return parts;
    },
    situations() {
      if (!this.entry) return [];
      const time = this.entry.time;
      return this.$store.getters.patterns
        .filter(p => (p.beliefs || []).indexOf(time) !== -1);
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
// Set apart from each other the same way the belief detail view separates its
// linked situations.
.situation-row {
  padding: 8px 0;
  border-top: 1px solid #2c2c2e;
  &:first-of-type { border-top: none; }
}
.situation-text {
  font-size: 0.95rem;
  color: #ebebf5;
  line-height: 1.5;
  margin: 0;
}
.affirmation-line {
  font-size: 0.875rem;
  color: #8e8e93;
  line-height: 1.5;
  margin-top: 0;
}
.affirmation-text { color: #4ade80; font-weight: 600; }
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
