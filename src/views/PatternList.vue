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
            <p class="subheading trigger-title mb-0">{{ entry.name || entry.trigger }}</p>
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
          <v-icon class="expand-icon" :class="{ expanded: openEntry === entry.time }">
            chevron_right
          </v-icon>
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
      tapTimeouts: {},
    };
  },
  computed: {
    patterns() {
      return this.$store.getters.patterns
        .concat()
        .sort((a, b) => (b.count || 1) - (a.count || 1) || b.time - a.time);
    },
  },
  methods: {
    handleTap(entry) {
      const { time } = entry;
      if (this.tapTimeouts[time]) {
        // Double tap — decrement (min 1)
        clearTimeout(this.tapTimeouts[time]);
        this.$delete(this.tapTimeouts, time);
        if ((entry.count || 1) > 1) {
          this.$store.dispatch('decrementPatternCount', entry);
        }
      } else {
        // First tap — wait to distinguish from double tap
        this.$set(this.tapTimeouts, time, setTimeout(() => {
          this.$delete(this.tapTimeouts, time);
          this.$store.dispatch('incrementPatternCount', entry);
        }, 300));
      }
    },
    toggle(time) {
      this.openEntry = this.openEntry === time ? null : time;
    },
    editEntry(entry) {
      this.$router.push(`/edit-pattern/${entry.time}`);
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
