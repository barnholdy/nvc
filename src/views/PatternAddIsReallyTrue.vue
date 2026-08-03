<template>
  <v-layout column>
    <v-flex class="mt-2 mb-3">
      <h1 class="headline font-weight-regular">Kannst du absolut sicher sein, dass es wahr ist?</h1>
      <p class="subheading grey--text belief-quote mt-1">„{{ belief }}“</p>
    </v-flex>
    <v-flex>
      <v-layout row>
        <v-flex xs6 class="pr-2">
          <v-btn
            block large
            :color="answer === true ? 'primary' : ''"
            :flat="answer !== true"
            :outline="answer !== true"
            @click="select(true)">
            Ja
          </v-btn>
        </v-flex>
        <v-flex xs6 class="pl-2">
          <v-btn
            block large
            :color="answer === false ? 'primary' : ''"
            :flat="answer !== false"
            :outline="answer !== false"
            @click="select(false)">
            Nein
          </v-btn>
        </v-flex>
      </v-layout>
    </v-flex>
  </v-layout>
</template>

<script>
export default {
  name: 'pattern-add-is-really-true',
  props: {
    belief: String,
    initialValue: { default: null },
  },
  data() {
    return { answer: this.initialValue };
  },
  methods: {
    select(val) {
      this.answer = val;
      this.$emit('answered', val);
    },
  },
};
</script>

<style scoped lang="scss">
.belief-quote {
  font-style: italic;
}
</style>
