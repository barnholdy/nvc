<template>
  <div class="wizard-page">
    <v-content>
      <wizard-header
        :title="isEditMode ? 'Eintrag bearbeiten' : 'Neuer Eintrag'"
        :step="step"
        :total="totalSteps"
      ></wizard-header>
      <div>
        <journal-add-belief
          v-show="step === 1"
          :allBeliefs="allBeliefs"
          :patterns="allPatterns"
          :journal="allJournal"
          :initialValue="beliefTime"
          @changed="beliefTime = $event">
        </journal-add-belief>

        <journal-add-fact
          v-if="belief"
          v-show="step === 2"
          :belief="belief"
          :patterns="allPatterns"
          :journal="allJournal"
          :initialValue="fact"
          @changed="fact = $event">
        </journal-add-fact>

        <journal-add-feelings
          v-if="belief"
          v-show="step === 3"
          :fact="fact"
          :initialValue="feelings"
          @changed="feelings = $event">
        </journal-add-feelings>

        <journal-add-meaning
          v-if="belief"
          v-show="step === 4"
          :fact="fact"
          :initialValue="meaning"
          @changed="meaning = $event">
        </journal-add-meaning>

        <journal-add-fit
          v-if="belief"
          v-show="step === 5"
          :fact="fact"
          :meaning="meaning"
          :initialCredibility="credibility"
          @changed="credibility = $event">
        </journal-add-fit>

        <journal-add-note
          v-if="belief"
          v-show="step === 6"
          :fact="fact"
          :meaning="meaning"
          :credibility="credibility"
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
import JournalAddBelief from '@/views/JournalAddBelief.vue';
import JournalAddFact from '@/views/JournalAddFact.vue';
import JournalAddFeelings from '@/views/JournalAddFeelings.vue';
import JournalAddMeaning from '@/views/JournalAddMeaning.vue';
import JournalAddFit from '@/views/JournalAddFit.vue';
import JournalAddNote from '@/views/JournalAddNote.vue';
import WizardHeader from '@/components/WizardHeader.vue';
import WizardFooter from '@/components/WizardFooter.vue';
import { MAX_FEELINGS } from '@/utils/emotions';

const TOTAL_STEPS = 6;

export default {
  name: 'journal-add',
  components: {
    JournalAddBelief, JournalAddFact, JournalAddFeelings, JournalAddMeaning, JournalAddFit, JournalAddNote,
    WizardHeader, WizardFooter,
  },
  data() {
    const editEntry = this.$store.getters.journal
      .find(function(e) { return e.time === parseInt(this.$route.params.time, 10); }, this);
    return {
      step: 1,
      totalSteps: TOTAL_STEPS,
      editEntry: editEntry || null,
      beliefTime: editEntry ? editEntry.beliefTime : null,
      fact: editEntry ? editEntry.fact || '' : '',
      feelings: editEntry ? editEntry.feelings || [] : [],
      meaning: editEntry ? editEntry.meaning || '' : '',
      credibility: editEntry && typeof editEntry.credibility === 'number' ? editEntry.credibility : null,
      note: editEntry ? editEntry.note || '' : '',
    };
  },
  computed: {
    isEditMode() {
      return !!this.editEntry;
    },
    // Every belief that can be weakened this way — the picker step narrows
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
    // Resolved on demand: the belief only exists once one has been chosen.
    belief() {
      if (this.beliefTime === null) return null;
      return this.allBeliefs.find(b => b.time === this.beliefTime) || null;
    },
    isStepComplete() {
      if (this.step === 1) return this.beliefTime !== null;
      if (this.step === 2) return this.fact.trim() !== '';
      if (this.step === 3) return this.feelings.length <= MAX_FEELINGS;
      if (this.step === 4) return this.meaning.trim() !== '';
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
      const payload = {
        beliefTime: this.beliefTime,
        fact: this.fact.trim(),
        feelings: this.feelings,
        meaning: this.meaning.trim(),
        credibility: this.credibility,
        note: this.note.trim(),
      };
      if (this.isEditMode) {
        this.$store.dispatch('updateJournalEntry', Object.assign({}, this.editEntry, payload));
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
