<template>
  <div>
    <v-toolbar color="white" app>
      <v-btn v-if="step === 1" icon @click="close">
        <v-icon>close</v-icon>
      </v-btn>
      <v-btn v-else icon @click="prevStep">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-toolbar-title>{{ entry ? entry.name : '' }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <span class="grey--text body-1">{{ step }} / {{ totalSteps }}</span>
    </v-toolbar>
    <v-content>
      <v-container class="mb-5">
        <pattern-add-without-belief
          v-show="step === 1"
          :belief="entry ? entry.belief : ''"
          :initialValue="withoutBelief"
          @changed="withoutBelief = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-without-belief>

        <pattern-add-turnaround
          v-show="step === 2"
          :belief="entry ? entry.belief : ''"
          :initialValue="turnaround"
          @changed="turnaround = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-add-turnaround>

        <pattern-change-announce
          v-show="step === 3"
          :belief="entry ? entry.belief : ''"
          :initialValue="announce"
          @changed="announce = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-change-announce>

        <pattern-change-apologize
          v-show="step === 4"
          :belief="entry ? entry.belief : ''"
          :initialValue="apologize"
          @changed="apologize = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-change-apologize>

        <pattern-change-ask
          v-show="step === 5"
          :belief="entry ? entry.belief : ''"
          :initialValue="ask"
          @changed="ask = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-change-ask>

        <pattern-change-act
          v-show="step === 6"
          :belief="entry ? entry.belief : ''"
          :initialValue="act"
          @changed="act = $event"
          @focussed="isFooterFixed = false"
          @blurred="isFooterFixed = true">
        </pattern-change-act>
      </v-container>

      <v-footer :fixed="isFooterFixed" color="white elevation-3" height="44">
        <v-btn
          v-if="step < totalSteps"
          :disabled="!isStepComplete"
          @click="nextStep"
          block large color="primary">
          weiter
        </v-btn>
        <v-btn
          v-else
          :disabled="!isStepComplete"
          @click="save"
          block large color="primary">
          speichern
        </v-btn>
      </v-footer>
    </v-content>
  </div>
</template>

<script>
import PatternAddWithoutBelief from '@/views/PatternAddWithoutBelief.vue';
import PatternAddTurnaround from '@/views/PatternAddTurnaround.vue';
import PatternChangeAnnounce from '@/views/PatternChangeAnnounce.vue';
import PatternChangeApologize from '@/views/PatternChangeApologize.vue';
import PatternChangeAsk from '@/views/PatternChangeAsk.vue';
import PatternChangeAct from '@/views/PatternChangeAct.vue';

export default {
  name: 'pattern-change',
  components: {
    PatternAddWithoutBelief,
    PatternAddTurnaround,
    PatternChangeAnnounce,
    PatternChangeApologize,
    PatternChangeAsk,
    PatternChangeAct,
  },
  data() {
    const entry = this.$store.getters.patterns
      .find(p => p.time === parseInt(this.$route.params.time, 10));
    return {
      entry: entry || null,
      step: 1,
      totalSteps: 6,
      withoutBelief: entry ? entry.withoutBelief || '' : '',
      turnaround: entry ? entry.turnaround || '' : '',
      announce: entry ? entry.changeAnnounce || '' : '',
      apologize: entry ? entry.changeApologize || '' : '',
      ask: entry ? entry.changeAsk || '' : '',
      act: entry ? entry.changeAct || '' : '',
      isFooterFixed: true,
    };
  },
  computed: {
    isStepComplete() {
      if (this.step === 1) return this.withoutBelief.trim() !== '';
      if (this.step === 2) return this.turnaround.trim() !== '';
      if (this.step === 3) return this.announce.trim() !== '';
      if (this.step === 4) return this.apologize.trim() !== '';
      if (this.step === 5) return this.ask.trim() !== '';
      if (this.step === 6) return this.act.trim() !== '';
      return false;
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
    save() {
      this.$store.dispatch('updatePattern', {
        ...this.entry,
        withoutBelief: this.withoutBelief,
        turnaround: this.turnaround,
        changeAnnounce: this.announce,
        changeApologize: this.apologize,
        changeAsk: this.ask,
        changeAct: this.act,
      });
      this.$router.push('/patterns');
    },
    close() {
      this.$router.push('/patterns');
    },
  },
};
</script>

<style scoped lang="scss">
</style>
