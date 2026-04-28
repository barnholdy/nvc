<template>
  <div class="the-work-list">
    <v-toolbar color="white" app>
      <v-toolbar-title>The Work</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon to="/add-the-work">
        <v-icon>add</v-icon>
      </v-btn>
    </v-toolbar>
    <v-content>
      <p class="intro-text body-1 grey--text">
        <em>Deine Muster sind eingefrorene Überzeugungen aus einer Zeit, in der sie dich geschützt haben. Heute hindern sie dich womöglich. Wenn du sie aufschreibst, machst du das Unsichtbare sichtbar. Dann kannst du wählen, statt nur zu reagieren. Nimm dir zwei Minuten und schreib auf, was dich zuletzt mehr bewegt hat als vielleicht erwartet.</em>
      </p>
      <v-card class="entry" v-for="entry in theWork" v-bind:key="entry.time">
        <v-card-title class="header" @click="toggle(entry.time)">
          <div class="header-text">
            <p class="subheading belief-title mb-1">{{ entry.name || entry.belief }}</p>
            <div class="status-bar mb-1">
              <span
                v-for="step in 3"
                :key="step"
                class="status-dot"
                :class="step <= filledSteps(entry) ? 'status-dot--filled' : 'status-dot--empty'"
              ></span>
            </div>
            <p class="caption grey--text mb-0">{{ formatTime(entry.time) }}</p>
          </div>
          <v-spacer></v-spacer>
          <div
            class="counter-tap"
            @click.stop="handleTap(entry)"
          >
            <span class="count-badge">{{ entry.count || 1 }}</span>
            <span class="count-plus">+</span>
          </div>
          <v-btn icon small @click.stop="editEntry(entry)">
            <v-icon color="grey darken-2">edit</v-icon>
          </v-btn>
          <v-btn icon small @click.stop="preDelete(entry)">
            <v-icon color="grey darken-2">delete</v-icon>
          </v-btn>
        </v-card-title>
        <template v-if="openEntry === entry.time">
          <v-divider></v-divider>
          <v-card-text>
            <template v-if="entry.trigger">
              <p class="section-label caption grey--text">Trigger</p>
              <p class="body-1">{{ entry.trigger }}</p>
            </template>
            <template v-if="entry.feelings && entry.feelings.length">
              <p class="section-label caption grey--text mt-2">Reaktion</p>
              <div class="mb-2">
                <tag-list :items="entry.feelings"></tag-list>
              </div>
            </template>
            <p class="section-label caption grey--text mt-2">Glaubenssatz</p>
            <p class="body-1">{{ entry.belief }}</p>
            <v-layout row wrap class="mb-2 mt-2">
              <v-chip small :color="entry.isTrue ? 'primary' : 'grey'" text-color="white">
                Wahr: {{ entry.isTrue ? 'Ja' : 'Nein' }}
              </v-chip>
              <v-chip small :color="entry.isReallyTrue ? 'primary' : 'grey'" text-color="white" class="ml-1">
                Wirklich wahr: {{ entry.isReallyTrue ? 'Ja' : 'Nein' }}
              </v-chip>
            </v-layout>
            <p class="section-label caption grey--text mt-2">Mit dem Glauben</p>
            <p class="body-1">{{ entry.withBelief }}</p>
            <template v-if="entry.origin">
              <p class="section-label caption grey--text mt-2">Ursprungshypothese</p>
              <p class="body-1">{{ entry.origin }}</p>
            </template>
            <p class="section-label caption grey--text mt-2">Ohne den Glauben</p>
            <p class="body-1">{{ entry.withoutBelief }}</p>
            <p class="section-label caption grey--text mt-2">Umkehrung</p>
            <p class="body-1">{{ entry.turnaround }}</p>
          </v-card-text>
        </template>
      </v-card>

      <v-dialog v-model="isDeleteDialogShowing" width="500">
        <v-card>
          <v-card-title class="subheading" primary-title>
            Eintrag wirklich löschen?
          </v-card-title>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="secondary" flat @click="cancelDelete">abbrechen</v-btn>
            <v-btn color="red" flat @click="confirmDelete">löschen</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-content>

    <v-bottom-nav :value="true" fixed color="white" class="elevation-3">
      <v-btn flat color="grey" to="/check-ins">
        <span>Check-Ins</span>
        <v-icon>favorite_border</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/the-work">
        <span>Muster</span>
        <v-icon>repeat</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import moment from 'moment';
import TagList from '@/components/TagList.vue';

export default {
  name: 'the-work-list',
  components: { TagList },
  data() {
    return {
      openEntry: null,
      entryToDelete: null,
      isDeleteDialogShowing: false,
      tapTimeouts: {},
    };
  },
  computed: {
    theWork() {
      return this.$store.getters.theWork
        .concat()
        .sort((a, b) => (b.count || 1) - (a.count || 1) || b.time - a.time);
    },
  },
  methods: {
    handleTap(entry) {
      const { time } = entry;
      if (this.tapTimeouts[time]) {
        clearTimeout(this.tapTimeouts[time]);
        this.$delete(this.tapTimeouts, time);
        if ((entry.count || 1) > 1) {
          this.$store.dispatch('decrementTheWorkCount', entry);
        }
      } else {
        this.$set(this.tapTimeouts, time, setTimeout(() => {
          this.$delete(this.tapTimeouts, time);
          this.$store.dispatch('incrementTheWorkCount', entry);
        }, 300));
      }
    },
    toggle(time) {
      this.openEntry = this.openEntry === time ? null : time;
    },
    editEntry(entry) {
      this.$router.push(`/edit-the-work/${entry.time}`);
    },
    preDelete(entry) {
      this.entryToDelete = entry;
      this.isDeleteDialogShowing = true;
    },
    confirmDelete() {
      this.isDeleteDialogShowing = false;
      this.$store.dispatch('deleteTheWork', this.entryToDelete);
      this.entryToDelete = null;
    },
    cancelDelete() {
      this.isDeleteDialogShowing = false;
      this.entryToDelete = null;
    },
    filledSteps(entry) {
      return 1 + (entry.isTrue ? 1 : 0) + (entry.isReallyTrue ? 1 : 0);
    },
    formatTime(time) {
      moment.locale('de');
      return moment(time).format('llll');
    },
  },
};
</script>

<style scoped lang="scss">
.intro-text {
  margin: 1rem;
  line-height: 1.6;
}
.entry {
  margin: 1rem;
}
.header {
  cursor: pointer;
  user-select: none;
}
.header-text {
  flex: 1;
  min-width: 0;
  padding-right: 0.5rem;
}
.belief-title {
  white-space: normal;
  word-break: break-word;
}
.counter-tap {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  border-radius: 20px;
  border: 1.5px solid #00838f;
  cursor: pointer;
  margin-right: 4px;
  -webkit-tap-highlight-color: transparent;
  &:active {
    background: #e0f7fa;
  }
}
.count-badge {
  color: #00838f;
  font-size: 0.85rem;
  font-weight: bold;
  min-width: 14px;
  text-align: center;
}
.count-plus {
  color: #00838f;
  font-size: 0.8rem;
  font-weight: bold;
  line-height: 1;
}
.status-bar {
  display: flex;
  gap: 4px;
}
.status-dot {
  display: inline-block;
  width: 16px;
  height: 8px;
  border-radius: 2px;
  &--filled {
    background-color: #00838f;
  }
  &--empty {
    background-color: #ccc;
  }
}
.section-label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
