<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn v-if="step === 1" icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-btn v-else icon @click="prevStep">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-toolbar-title>{{ isEditMode ? 'Überzeugung ergründen' : 'Neue Überzeugung' }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="grey--text body-1">{{ step }} / {{ totalSteps }}</span>
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
          :feelings="selectedFeelings"
          :origin="origin"
          :initialNeeds="selectedNeeds"
          @change="selectedNeeds = $event">
        </belief-add-gift>

        <!-- Mounted with the phase, so the request carries this run's answers. -->
        <belief-add-empathy
          v-if="hasEnteredOriginPhase"
          v-show="step === 8"
          :entry="editEntry"
          :belief="belief"
          :reaction="withBelief"
          :feelings="selectedFeelings"
          :needs="selectedNeeds"
          :origin="origin"
          :gift="gift || ''"
          :initialValue="empathy"
          @changed="empathy = $event">
        </belief-add-empathy>

        <belief-add-grounding v-show="step === 9"></belief-add-grounding>

        <belief-add-check
          v-show="step === 10"
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
import BeliefAddEmpathy from '@/views/BeliefAddEmpathy.vue';
import BeliefAddGrounding from '@/views/BeliefAddGrounding.vue';
import BeliefAddCheck from '@/views/BeliefAddCheck.vue';
import { beliefStatus } from '@/utils/beliefStatus';
import { normalizeOriginArc } from '@/utils/originArc';
import { MAX_FEELINGS, joinNames } from '@/utils/emotions';
import taxonomy from '../assets/taxonomy.json';

const FEELINGS_STEP = 4;
const READINESS_STEP = 5;
const TOTAL_STEPS = 10;

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
    BeliefAddEmpathy,
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
      empathy: editEntry ? editEntry.empathy || '' : '',
      // The need is picked inside the origin phase now, so leaving the phase
      // has to be able to put back what was saved before.
      storedNeeds: editEntry ? editEntry.needs || [] : [],
      hasEnteredOriginPhase: false,
      savedTab: 'open',
      isFooterFixed: true,
    };
  },
  computed: {
    isEditMode() {
      return !!this.editEntry;
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
    // The chosen needs are the gift: the answer to what this belief once did
    // for you, which can be more than one thing.
    gift() {
      return joinNames(this.selectedNeeds.map(n => n.name)) || null;
    },
  },
  methods: {
    nextStep() {
      if (this.step === READINESS_STEP) this.hasEnteredOriginPhase = true;
      this.step += 1;
      this.$vuetify.goTo(0, { duration: 0 });
    },
    prevStep() {
      this.step -= 1;
      this.$vuetify.goTo(0, { duration: 0 });
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
        // Generated inside the origin phase, so it is kept with it.
        empathy: withOrigin ? this.empathy : (this.editEntry ? this.editEntry.empathy || '' : ''),
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

</style>
