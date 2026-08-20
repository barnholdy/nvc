<template>
  <div class="wizard-page">
    <v-content>
      <wizard-header
        :title="isEditMode ? 'Eintrag bearbeiten' : 'Neuer Eintrag'"
        :step="step"
        :total="totalSteps"
      ></wizard-header>
      <div>
        <journal-add-fact
          v-show="step === 1"
          :initialValue="fact"
          @changed="fact = $event">
        </journal-add-fact>

        <journal-add-feelings
          v-show="step === 2"
          :fact="fact"
          :initialValue="feelings"
          @changed="feelings = $event">
        </journal-add-feelings>

        <journal-add-meaning
          v-show="step === 3"
          :fact="fact"
          :feelings="feelings"
          :initialValue="meaning"
          @changed="meaning = $event">
        </journal-add-meaning>

        <journal-add-fit
          v-show="step === 4"
          :fact="fact"
          :feelings="feelings"
          :meaning="meaning"
          :allBeliefs="allBeliefs"
          :patterns="allPatterns"
          :journal="allJournal"
          :initialSelected="beliefTimes"
          :initialTruths="beliefTruths"
          @changed="beliefTimes = $event"
          @truthsChanged="beliefTruths = $event">
        </journal-add-fit>

        <journal-add-note
          v-show="step === 5"
          :fact="fact"
          :feelings="feelings"
          :meaning="meaning"
          :beliefs="chosenBeliefs"
          :initialValue="note"
          @changed="note = $event">
        </journal-add-note>
      </div>
      <div class="wizard-bottom-space"></div>
    </v-content>

    <wizard-footer
      :disabled="!isStepComplete"
      :nextLabel="step < totalSteps ? 'Weiter' : 'Speichern'"
      @back="back"
      @next="step < totalSteps ? nextStep() : save()"
    ></wizard-footer>
  </div>
</template>

<script>
import JournalAddFact from '@/views/JournalAddFact.vue';
import JournalAddFeelings from '@/views/JournalAddFeelings.vue';
import JournalAddMeaning from '@/views/JournalAddMeaning.vue';
import JournalAddFit from '@/views/JournalAddFit.vue';
import JournalAddNote from '@/views/JournalAddNote.vue';
import WizardHeader from '@/components/WizardHeader.vue';
import WizardFooter from '@/components/WizardFooter.vue';
import { MAX_FEELINGS } from '@/utils/emotions';
import { journalBeliefTimes, journalBeliefTruths } from '@/utils/journalBeliefs';

const TOTAL_STEPS = 5;
const BELIEF_STEP = 4;

export default {
  name: 'journal-add',
  components: {
    JournalAddFact, JournalAddFeelings, JournalAddMeaning, JournalAddFit, JournalAddNote,
    WizardHeader, WizardFooter,
  },
  data() {
    const isEdit = this.$route.name === 'edit-journal';
    const editEntry = isEdit
      ? this.$store.getters.journal
        .find(function(e) { return e.time === parseInt(this.$route.params.time, 10); }, this)
      : null;
    // Opened from a belief's own card: that belief starts out chosen, and the
    // belief step is reached like any other rather than being skipped.
    const isPreselect = this.$route.name === 'journal-belief';
    const preselected = isPreselect ? [parseInt(this.$route.params.time, 10)] : [];
    return {
      step: 1,
      totalSteps: TOTAL_STEPS,
      editEntry: editEntry || null,
      beliefTimes: editEntry ? journalBeliefTimes(editEntry) : preselected,
      beliefTruths: editEntry ? Object.assign({}, journalBeliefTruths(editEntry)) : {},
      fact: editEntry ? editEntry.fact || '' : '',
      feelings: editEntry ? editEntry.feelings || [] : [],
      meaning: editEntry ? editEntry.meaning || '' : '',
      note: editEntry ? editEntry.note || '' : '',
    };
  },
  computed: {
    isEditMode() {
      return !!this.editEntry;
    },
    // Every belief that can be weakened this way — the belief step narrows
    // this down further to the ones with an affirmation of their own.
    allBeliefs() {
      return this.$store.getters.beliefs;
    },
    allPatterns() {
      return this.$store.getters.patterns;
    },
    allJournal() {
      return this.$store.getters.journal;
    },
    // What the belief step settled on, resolved for the steps after it.
    chosenBeliefs() {
      return this.beliefTimes
        .map((time) => {
          const belief = this.allBeliefs.find(b => b.time === time);
          if (!belief) return null;
          return {
            time: time,
            text: belief.belief,
            credibility: this.beliefTruths[time],
          };
        })
        .filter(Boolean);
    },
    isStepComplete() {
      if (this.step === 1) return this.fact.trim() !== '';
      if (this.step === 2) return this.feelings.length <= MAX_FEELINGS;
      if (this.step === 3) return this.meaning.trim() !== '';
      // An entry is evidence against something: without a belief there is
      // nothing for it to be evidence against.
      if (this.step === BELIEF_STEP) return this.beliefTimes.length > 0;
      return true;
    },
  },
  methods: {
    nextStep() {
      this.step += 1;
      this.$vuetify.goTo(0, { duration: 0 });
    },
    prevStep() {
      this.step -= 1;
      this.$vuetify.goTo(0, { duration: 0 });
    },
    // On the first step there is nothing to go back to but the way out.
    back() {
      if (this.step === 1) this.close();
      else this.prevStep();
    },
    save() {
      // Only the ratings of beliefs that are actually named — one deselected
      // again must not leave its number behind.
      const truths = {};
      this.beliefTimes.forEach((time) => {
        if (typeof this.beliefTruths[time] === 'number') truths[time] = this.beliefTruths[time];
      });
      const payload = {
        beliefTimes: this.beliefTimes.slice(),
        beliefTruths: truths,
        fact: this.fact.trim(),
        feelings: this.feelings,
        meaning: this.meaning.trim(),
        note: this.note.trim(),
      };
      if (this.isEditMode) {
        // The old single-belief fields would otherwise survive the edit and
        // be read in preference to what was just chosen.
        const kept = Object.assign({}, this.editEntry, payload);
        delete kept.beliefTime;
        delete kept.credibility;
        this.$store.dispatch('updateJournalEntry', kept);
      } else {
        this.$store.dispatch('saveJournalEntry', payload);
      }
      this.$router.push('/journal');
    },
    close() {
      this.$router.push('/journal');
    },
  },
};
</script>
