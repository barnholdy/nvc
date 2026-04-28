<template>
  <div class="pattern-list">
    <v-toolbar color="white" app>
      <v-toolbar-title>Muster</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon to="/add-pattern">
        <v-icon>add</v-icon>
      </v-btn>
    </v-toolbar>
    <v-content>
      <v-card class="entry" v-for="entry in patterns" v-bind:key="entry.time">
        <v-card-title class="header" @click="toggle(entry.time)">
          <div class="header-text">
            <p class="subheading trigger-title mb-1">{{ entry.trigger }}</p>
            <div class="feelings-preview mb-1">
              <span
                v-for="(feeling, i) in entry.feelings.slice(0, 3)"
                :key="i"
                class="feeling-chip">{{ feeling.name }}</span>
              <span v-if="entry.feelings.length > 3" class="feeling-chip feeling-chip--more">
                +{{ entry.feelings.length - 3 }}
              </span>
            </div>
            <p class="caption grey--text mb-0">{{ formatTime(entry.time) }}</p>
          </div>
          <v-spacer></v-spacer>
          <v-icon class="expand-icon" :class="{ expanded: openEntry === entry.time }">
            chevron_right
          </v-icon>
          <v-btn icon small @click.stop="preDelete(entry)">
            <v-icon color="grey darken-2">delete</v-icon>
          </v-btn>
        </v-card-title>
        <template v-if="openEntry === entry.time">
          <v-divider></v-divider>
          <v-card-text>
            <p class="section-label caption grey--text">Trigger</p>
            <p class="body-1">{{ entry.trigger }}</p>
            <p class="section-label caption grey--text mt-2">Reaktion</p>
            <div class="mb-2">
              <tag-list :items="entry.feelings"></tag-list>
            </div>
            <p class="section-label caption grey--text mt-2">Narrativ</p>
            <p class="body-1">{{ entry.narrative }}</p>
            <p class="section-label caption grey--text mt-2">Ursprungshypothese</p>
            <p class="body-1">{{ entry.origin }}</p>
          </v-card-text>
        </template>
      </v-card>

      <v-dialog v-model="isDeleteDialogShowing" width="500">
        <v-card>
          <v-card-title class="subheading" primary-title>
            Muster wirklich löschen?
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
      <v-btn flat color="grey" to="/the-work">
        <span>The Work</span>
        <v-icon>lightbulb_outline</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/patterns">
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
  name: 'pattern-list',
  components: { TagList },
  data() {
    return {
      openEntry: null,
      entryToDelete: null,
      isDeleteDialogShowing: false,
    };
  },
  computed: {
    patterns() {
      return this.$store.getters.patterns.concat().sort((a, b) => b.time - a.time);
    },
  },
  methods: {
    toggle(time) {
      this.openEntry = this.openEntry === time ? null : time;
    },
    preDelete(entry) {
      this.entryToDelete = entry;
      this.isDeleteDialogShowing = true;
    },
    confirmDelete() {
      this.isDeleteDialogShowing = false;
      this.$store.dispatch('deletePattern', this.entryToDelete);
      this.entryToDelete = null;
    },
    cancelDelete() {
      this.isDeleteDialogShowing = false;
      this.entryToDelete = null;
    },
    formatTime(time) {
      moment.locale('de');
      return moment(time).format('llll');
    },
  },
};
</script>

<style scoped lang="scss">
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
.trigger-title {
  white-space: normal;
  word-break: break-word;
}
.feelings-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.feeling-chip {
  font-size: 0.75rem;
  background: #e0f7fa;
  color: #00838f;
  border-radius: 2px;
  padding: 1px 6px;
  &--more {
    background: #f5f5f5;
    color: #9e9e9e;
  }
}
.expand-icon {
  transition: transform 0.2s ease;
  &.expanded {
    transform: rotate(90deg);
  }
}
.section-label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
