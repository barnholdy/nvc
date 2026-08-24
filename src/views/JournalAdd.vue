<template>
  <div class="wizard-page">
    <v-content>
      <wizard-header
        :title="headerTitle"
        :step="step"
        :total="totalSteps"
      ></wizard-header>
      <div>
        <journal-add-type
          v-show="step === 1"
          :initialValue="type"
          @changed="onTypeChanged">
        </journal-add-type>

        <journal-add-fact
          v-show="step === factStep"
          :isTrigger="isTriggerEntry"
          :initialValue="fact"
          @changed="fact = $event">
        </journal-add-fact>

        <!-- A Trigger names whatever belief struck, and may have to write it
             down first; a Reflexion can only speak against one already
             wandelt, so the two pick from different lists. -->
        <pattern-add-beliefs
          v-if="isTriggerEntry"
          v-show="step === beliefStep"
          :allBeliefs="allBeliefs"
          :patterns="allPatterns"
          :journal="allJournal"
          :selectedBeliefIds="beliefTimes"
          :initialTruths="beliefTruths"
          :fact="fact"
          @changed="beliefTimes = $event"
          @truthsChanged="beliefTruths = $event">
        </pattern-add-beliefs>

        <template v-if="!isTriggerEntry">
          <journal-add-feelings
            v-show="step === feelingsStep"
            :fact="fact"
            :initialValue="feelings"
            @changed="feelings = $event">
          </journal-add-feelings>

          <journal-add-meaning
            v-show="step === meaningStep"
            :fact="fact"
            :feelings="feelings"
            :initialValue="meaning"
            @changed="meaning = $event">
          </journal-add-meaning>

          <journal-add-fit
            v-show="step === beliefStep"
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
            v-show="step === noteStep"
            :fact="fact"
            :feelings="feelings"
            :meaning="meaning"
            :beliefs="chosenBeliefs"
            :initialValue="note"
            @changed="note = $event">
          </journal-add-note>
        </template>
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
import JournalAddType from '@/views/JournalAddType.vue';
import JournalAddFact from '@/views/JournalAddFact.vue';
import JournalAddFeelings from '@/views/JournalAddFeelings.vue';
import JournalAddMeaning from '@/views/JournalAddMeaning.vue';
import JournalAddFit from '@/views/JournalAddFit.vue';
import JournalAddNote from '@/views/JournalAddNote.vue';
import PatternAddBeliefs from '@/views/PatternAddBeliefs.vue';
import WizardHeader from '@/components/WizardHeader.vue';
import WizardFooter from '@/components/WizardFooter.vue';
import { MAX_FEELINGS } from '@/utils/emotions';
import {
  TRIGGER, REFLECTION, ACTION, entryType, journalBeliefTimes, journalBeliefTruths,
} from '@/utils/journalBeliefs';

// A Trigger is done after naming what happened and what it set off; a
// Reflexion works through feelings and meaning before it gets there, and
// leaves room for the objection afterwards.
const TRIGGER_STEPS = 3;
const REFLECTION_STEPS = 6;

export default {
  name: 'journal-add',
  components: {
    JournalAddType, JournalAddFact, JournalAddFeelings, JournalAddMeaning,
    JournalAddFit, JournalAddNote, PatternAddBeliefs, WizardHeader, WizardFooter,
  },
  data() {
    const isEdit = this.$route.name === 'edit-journal';
    const editEntry = isEdit
      ? this.$store.getters.journal
        .find(function(e) { return e.time === parseInt(this.$route.params.time, 10); }, this)
      : null;
    // Opened from a belief's own card: that belief starts out chosen, and it
    // is always a Reflexion — that button only appears on a wandelte belief.
    const isPreselect = this.$route.name === 'journal-belief';
    const preselected = isPreselect ? [parseInt(this.$route.params.time, 10)] : [];
    return {
      step: 1,
      type: editEntry ? entryType(editEntry) : (isPreselect ? REFLECTION : null),
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
    isTriggerEntry() {
      return this.type === TRIGGER;
    },
    headerTitle() {
      if (!this.isEditMode) return 'Neuer Eintrag';
      return this.isTriggerEntry ? 'Trigger bearbeiten' : 'Reflexion bearbeiten';
    },
    // Until the fork is answered the wizard cannot know how long it is; the
    // longer of the two keeps the bar from jumping backwards once it is.
    totalSteps() {
      if (this.type === null) return REFLECTION_STEPS;
      return this.isTriggerEntry ? TRIGGER_STEPS : REFLECTION_STEPS;
    },
    factStep() { return 2; },
    feelingsStep() { return 3; },
    meaningStep() { return 4; },
    // A Trigger reaches its beliefs right after the facts; a Reflexion has
    // two more questions to answer first.
    beliefStep() { return this.isTriggerEntry ? 3 : 5; },
    noteStep() { return 6; },
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
          return { time: time, text: belief.belief, credibility: this.beliefTruths[time] };
        })
        .filter(Boolean);
    },
    isStepComplete() {
      if (this.step === 1) return this.type !== null;
      if (this.step === this.factStep) return this.fact.trim() !== '';
      // An entry is about something: without a belief there is nothing for it
      // to be evidence for or against.
      if (this.step === this.beliefStep) return this.beliefTimes.length > 0;
      if (this.step === this.feelingsStep) return this.feelings.length <= MAX_FEELINGS;
      if (this.step === this.meaningStep) return this.meaning.trim() !== '';
      return true;
    },
  },
  methods: {
    // A Handlung is planned rather than recorded, so it hands straight over to
    // the wizard that plans one instead of carrying on here.
    onTypeChanged(value) {
      if (value === ACTION) {
        this.$router.push('/add-action');
        return;
      }
      this.type = value;
    },
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
        type: this.type,
        beliefTimes: this.beliefTimes.slice(),
        beliefTruths: truths,
        fact: this.fact.trim(),
        // A Trigger never asks these, so it must not carry an older answer
        // from before it was one.
        feelings: this.isTriggerEntry ? [] : this.feelings,
        meaning: this.isTriggerEntry ? '' : this.meaning.trim(),
        note: this.isTriggerEntry ? '' : this.note.trim(),
      };
      if (this.isEditMode) {
        // The single-belief fields the Tagebuch used before, and the situation
        // fields the Verlauf used, would otherwise survive the edit and be
        // read in preference to what was just chosen.
        const kept = Object.assign({}, this.editEntry, payload);
        delete kept.beliefTime;
        delete kept.credibility;
        delete kept.trigger;
        delete kept.beliefs;
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
