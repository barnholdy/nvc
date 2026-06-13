<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Handeln</h1>
      <div v-if="withoutBeliefFeelings && withoutBeliefFeelings.length" class="mb-2">
        <tag-list :items="withoutBeliefFeelings"></tag-list>
      </div>
      <div v-if="affirmations && affirmations.length" class="selected-chips mb-2">
        <v-chip v-for="a in affirmations" :key="a.text" small class="affirmation-chip">{{ a.text }}</v-chip>
      </div>
      <p class="body-1 grey--text mt-2">Eine einzelne Handlung ist eine Ausnahme. Fünf beginnen, eine neue Spur zu legen und signalisieren, dass sich wirklich etwas verändert. Manifestiere deine Gefühle und Affirmationen, indem du fünf konkrete Handlungen aufschreibst und umsetzt.</p>
    </v-flex>

    <v-flex v-for="(act, i) in acts" :key="i" class="act-row">
      <v-text-field
        v-model="acts[i]"
        :label="'Handlung ' + (i + 1)"
        placeholder="Ich werde…"
        single-line
        hide-details
        class="act-field"
        @focus="$emit('focussed')"
        @blur="$emit('blurred')"
      ></v-text-field>
      <v-btn icon small class="remove-btn" @click="removeAct(i)">
        <v-icon color="grey">remove_circle_outline</v-icon>
      </v-btn>
    </v-flex>

    <v-flex class="mt-2">
      <v-btn flat small color="primary" @click="addAct">
        <v-icon left small>add</v-icon>
        Neue Handlung
      </v-btn>
    </v-flex>
  </v-layout>
</template>

<script>
import TagList from '@/components/TagList.vue';

export default {
  name: 'pattern-change-act',
  components: { TagList },
  props: {
    belief: { type: String, default: '' },
    withoutBelief: { type: String, default: '' },
    withoutBeliefFeelings: { type: Array, default: function() { return []; } },
    affirmations: { type: Array, default: function() { return []; } },
    initialActs: { type: Array, default: function() { return []; } },
  },
  data() {
    var initial = this.initialActs.filter(function(a) { return a && a.trim(); });
    return {
      acts: initial.length > 0 ? initial.slice() : [''],
    };
  },
  watch: {
    acts: {
      deep: true,
      handler(val) {
        this.$emit('changed', val.filter(function(a) { return a && a.trim(); }));
      },
    },
  },
  methods: {
    addAct() {
      this.acts.push('');
    },
    removeAct(i) {
      this.acts.splice(i, 1);
      if (this.acts.length === 0) this.acts.push('');
    },
  },
};
</script>

<style scoped lang="scss">
.act-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}
.act-field {
  flex: 1;
}
.remove-btn {
  flex-shrink: 0;
  margin-top: 8px;
}
.selected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.affirmation-chip {
  white-space: normal;
  height: auto !important;
  padding: 4px 10px !important;
}
</style>
