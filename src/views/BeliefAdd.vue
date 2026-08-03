<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn v-if="step === 1" icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-btn v-else icon @click="prevStep">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-toolbar-title>{{ isEditMode ? 'Überzeugung verstehen' : 'Neue Überzeugung' }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="grey--text body-1">{{ step }} / {{ totalSteps }}</span>
      <!-- The way out of the origin phase: keeps steps 1-4, drops what was
           entered here. It sits here rather than on the left so that going back
           a step stays possible on every screen. -->
      <v-btn v-if="isOriginPhase" icon @click="leaveOriginPhase">
        <v-icon>close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <belief-add-belief
          v-show="step === 1"
          :initialValue="belief"
          @beliefChanged="belief = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </belief-add-belief>

        <belief-add-reaction
          v-show="step === 2"
          :belief="belief"
          :initialValue="withBelief"
          @changed="withBelief = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </belief-add-reaction>

        <belief-add-arrive
          v-show="step === 3"
          :belief="belief"
          :reaction="withBelief">
        </belief-add-arrive>

        <belief-add-feeling-need
          v-show="step === 4"
          mode="feelings"
          :belief="belief"
          :reaction="withBelief"
          :taxonomy="taxonomy"
          :initialFeelings="selectedFeelings"
          :maxSelections="MAX_FEELINGS"
          @change="selectedFeelings = $event">
        </belief-add-feeling-need>

        <belief-add-readiness v-show="step === 5"></belief-add-readiness>

        <belief-add-origin
          v-show="step === 6"
          :belief="belief"
          :reaction="withBelief"
          :feelings="selectedFeelings"
          :initialValue="origin"
          @changed="origin = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </belief-add-origin>

        <!-- The need and the reframe are one screen now: mounted when the user
             opts in, so the list is built from the feelings as they stand. -->
        <belief-add-gift
          v-if="hasEnteredOriginPhase"
          v-show="step === 7"
          :belief="belief"
          :reaction="withBelief"
          :taxonomy="taxonomy"
          :feelings="selectedFeelings"
          :origin="origin"
          :initialNeeds="selectedNeeds"
          @change="selectedNeeds = $event">
        </belief-add-gift>

        <belief-add-grounding v-show="step === 8"></belief-add-grounding>

        <belief-add-check
          v-show="step === 9"
          :initialValue="mood"
          @changed="mood = $event">
        </belief-add-check>
      </v-container>

      <v-footer :fixed="isFooterFixed" color="white elevation-3" :height="footerHeight">
        <div v-if="step === READINESS_STEP" class="gate-actions">
          <v-btn @click="nextStep" block large color="primary">Jetzt anschauen</v-btn>
          <button type="button" class="later-btn" @click="saveWithoutOrigin">später</button>
        </div>
        <div v-else class="footer-single">
          <v-btn
            v-if="step < totalSteps"
            :disabled="!isStepComplete"
            @click="nextStep"
            block large color="primary">
            {{ nextLabel }}
          </v-btn>
          <v-btn
            v-else
            :disabled="!isStepComplete"
            @click="saveWithOrigin"
            block large color="primary">
            Speichern
          </v-btn>
        </div>
      </v-footer>

      <v-dialog v-model="isDiscardDialogShowing" width="300">
        <v-card class="confirm-dialog">
          <v-card-title class="confirm-title">Ursprung verwerfen?</v-card-title>
          <v-divider></v-divider>
          <v-card-text class="confirm-text">
            Was du hier eingetragen hast, geht verloren. Die Überzeugung selbst bleibt gespeichert.
          </v-card-text>
          <v-card-actions class="confirm-actions">
            <v-btn flat @click="isDiscardDialogShowing = false" class="confirm-cancel">Abbrechen</v-btn>
            <v-btn flat @click="confirmDiscard" class="confirm-delete">Verwerfen</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-content>
  </div>
</template>

<script>
import BeliefAddBelief from '@/views/BeliefAddBelief.vue';
import BeliefAddReaction from '@/views/BeliefAddReaction.vue';
import BeliefAddArrive from '@/views/BeliefAddArrive.vue';
import BeliefAddFeelingNeed from '@/views/BeliefAddFeelingNeed.vue';
import BeliefAddReadiness from '@/views/BeliefAddReadiness.vue';
import BeliefAddOrigin from '@/views/BeliefAddOrigin.vue';
import BeliefAddGift from '@/views/BeliefAddGift.vue';
import BeliefAddGrounding from '@/views/BeliefAddGrounding.vue';
import BeliefAddCheck from '@/views/BeliefAddCheck.vue';
import { beliefStatus } from '@/utils/beliefStatus';
import { normalizeOriginArc } from '@/utils/originArc';
import taxonomy from '../assets/taxonomy.json';

const FEELINGS_STEP = 4;
const READINESS_STEP = 5;
const TOTAL_STEPS = 9;
const MAX_FEELINGS = 5;

export default {
  name: 'belief-add',
  components: {
    BeliefAddBelief,
    BeliefAddReaction,
    BeliefAddArrive,
    BeliefAddFeelingNeed,
    BeliefAddReadiness,
    BeliefAddOrigin,
    BeliefAddGift,
    BeliefAddGrounding,
    BeliefAddCheck,
  },
  data() {
    const editEntry = this.$store.getters.beliefs
      .find(function(b) { return b.time === parseInt(this.$route.params.time, 10); }, this);
    const reflection = (editEntry && editEntry.reflection) || {};
    const arc = normalizeOriginArc(reflection.originArc);
    return {
      step: 1,
      totalSteps: TOTAL_STEPS,
      READINESS_STEP: READINESS_STEP,
      MAX_FEELINGS: MAX_FEELINGS,
      taxonomy: taxonomy,
      editEntry: editEntry || null,
      belief: editEntry ? editEntry.belief : '',
      selectedFeelings: editEntry ? editEntry.feelings || [] : [],
      selectedNeeds: editEntry ? editEntry.needs || [] : [],
      withBelief: editEntry ? editEntry.withBelief || '' : '',
      origin: reflection.origin || '',
      grounding: arc.grounding,
      mood: arc.mood,
      storedArc: arc,
      storedOrigin: reflection.origin || '',
      // The need is picked inside the origin phase now, so leaving the phase
      // has to be able to put back what was saved before.
      storedNeeds: editEntry ? editEntry.needs || [] : [],
      hasEnteredOriginPhase: false,
      savedTab: 'open',
      isDiscardDialogShowing: false,
      isFooterFixed: true,
    };
  },
  computed: {
    isEditMode() {
      return !!this.editEntry;
    },
    isOriginPhase() {
      return this.step >= READINESS_STEP;
    },
    isStepComplete() {
      if (this.step === 1) return this.belief.trim() !== '';
      // Beliefs saved before the limit existed can carry more than five
      // feelings; the way forward opens once they are back within it.
      if (this.step === FEELINGS_STEP) return this.selectedFeelings.length <= MAX_FEELINGS;
      // The only hard gate in the whole wizard: saving needs an answer to the
      // check, because that answer decides whether the signpost was shown.
      if (this.step === TOTAL_STEPS) return !!this.mood;
      return true;
    },
    // Steps 1-4 kept their lower-case label; the origin phase uses the spec's.
    nextLabel() {
      return this.step < READINESS_STEP ? 'weiter' : 'Weiter';
    },
    footerHeight() {
      return this.step === READINESS_STEP ? 96 : 44;
    },
    // The chosen need is the gift: one answer to the question of what this
    // belief once did for you.
    gift() {
      const last = this.selectedNeeds[this.selectedNeeds.length - 1];
      return last ? last.name : null;
    },
    // Nothing to warn about when this session added nothing beyond what is
    // already stored.
    hasUnsavedOriginInput() {
      if (this.origin.trim() !== this.storedOrigin.trim()) return true;
      if (this.mood !== this.storedArc.mood) return true;
      if (this.needsKey(this.selectedNeeds) !== this.needsKey(this.storedNeeds)) return true;
      return this.grounding.join(' ') !== this.storedArc.grounding.join(' ');
    },
  },
  methods: {
    needsKey(list) {
      return (list || []).map(n => n.name + '/' + n.emotionId).join('|');
    },
    nextStep() {
      if (this.step === READINESS_STEP) this.hasEnteredOriginPhase = true;
      this.step += 1;
      this.$vuetify.goTo(0, { duration: 0 });
    },
    prevStep() {
      this.step -= 1;
      this.$vuetify.goTo(0, { duration: 0 });
    },
    leaveOriginPhase() {
      if (this.hasUnsavedOriginInput) {
        this.isDiscardDialogShowing = true;
        return;
      }
      this.saveWithoutOrigin();
    },
    confirmDiscard() {
      this.isDiscardDialogShowing = false;
      this.saveWithoutOrigin();
    },
    saveWithOrigin() { this.persist(true); },
    saveWithoutOrigin() { this.persist(false); },
    buildReflection(withOrigin) {
      const existing = this.editEntry ? (this.editEntry.reflection || {}) : {};
      const base = Object.assign({ withoutBelief: '', turnarounds: [] }, existing);
      if (withOrigin) {
        return Object.assign(base, {
          origin: this.origin,
          originArc: {
            gift: this.gift,
            grounding: this.grounding,
            mood: this.mood,
            completedAt: new Date().toISOString(),
          },
        });
      }
      // Leaving the phase writes none of this session's origin input — but it
      // must not erase what an earlier run already saved either.
      return Object.assign(base, {
        origin: this.storedOrigin,
        originArc: this.storedArc,
      });
    },
    persist(withOrigin) {
      const payload = {
        belief: this.belief,
        feelings: this.selectedFeelings,
        withBelief: this.withBelief,
        // The need belongs to the origin phase now and is dropped with it.
        needs: withOrigin ? this.selectedNeeds : this.storedNeeds,
        reflection: this.buildReflection(withOrigin),
      };
      const saved = this.isEditMode ? Object.assign({}, this.editEntry, payload) : payload;
      if (this.isEditMode) {
        this.$store.dispatch('updateBelief', saved);
      } else {
        this.$store.dispatch('saveBelief', saved);
      }
      // Editing can move the belief to another tab — land on the one it is in now.
      // Both ways out land in the list, on the tab the belief now belongs to.
      this.savedTab = beliefStatus(saved);
      this.finish();
    },
    finish() {
      this.$router.push({ path: '/beliefs', query: { tab: this.savedTab } });
    },
    close() {
      this.$router.push('/beliefs');
    },
  },
};
</script>

<style scoped lang="scss">
.footer-single { width: 100%; }
.gate-actions {
  width: 100%;
  padding: 4px 0 6px;
}
.later-btn {
  display: block;
  width: 100%;
  background: none;
  border: none;
  color: #8e8e93;
  font-size: 0.9rem;
  padding: 8px 0 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:focus-visible {
    outline: 2px solid #4ade80;
    outline-offset: 2px;
  }
}

.confirm-dialog { background: #2c2c2e !important; border-radius: 14px; }
.confirm-title {
  font-size: 1rem !important;
  color: #fff;
  justify-content: center;
  padding: 16px 16px 10px;
}
.confirm-text {
  font-size: 0.85rem;
  color: #8e8e93;
  text-align: center;
  padding: 12px 16px;
}
.confirm-actions { padding: 0; }
.confirm-cancel, .confirm-delete {
  flex: 1;
  margin: 0 !important;
  border-radius: 0 !important;
}
.confirm-cancel { color: #4ade80 !important; }
.confirm-delete { color: #ff453a !important; }
</style>
