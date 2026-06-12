<template>
  <div class="belief-list">
    <v-toolbar color="white" app>
      <v-toolbar-title>Meine Beliefs</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon to="/add-belief">
        <v-icon>add</v-icon>
      </v-btn>
    </v-toolbar>
    <v-content>
      <div v-if="beliefs.length === 0" class="empty-state grey--text">
        <v-icon large color="grey lighten-1">lightbulb_outline</v-icon>
        <p class="body-1 mt-2">Noch keine Beliefs eingetragen.</p>
        <p class="caption">Tippe auf + um einen neuen Belief hinzuzufügen.</p>
      </div>

      <v-card class="entry" v-for="entry in beliefs" :key="entry.time">
        <v-card-title class="header" @click="toggle(entry.time)">
          <p class="subheading belief-title mb-1">{{ entry.belief }}</p>
          <div class="header-bottom">
            <div class="header-meta">
              <span v-if="patternCount(entry.time) > 0" class="caption grey--text">
                {{ patternCount(entry.time) }} {{ patternCount(entry.time) === 1 ? 'Muster' : 'Muster' }}
              </span>
            </div>
            <div class="header-actions">
              <div class="counter-tap" @click.stop="handleTap(entry)">
                <span class="count-badge">{{ entry.count || 1 }}</span>
                <span class="count-plus">+</span>
              </div>
              <v-btn icon small @click.stop="empathyEntry(entry)">
                <v-icon :color="entry.empathy ? '#00838f' : 'grey darken-2'">favorite</v-icon>
              </v-btn>
              <v-btn icon small @click.stop="changeEntry(entry)">
                <v-icon :color="hasChangeData(entry) ? '#00838f' : 'grey darken-2'">autorenew</v-icon>
              </v-btn>
              <v-btn icon small @click.stop="editEntry(entry)">
                <v-icon color="grey darken-2">edit</v-icon>
              </v-btn>
              <v-btn icon small @click.stop="preDelete(entry)">
                <v-icon color="grey darken-2">delete</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card-title>
        <template v-if="openEntry === entry.time">
          <v-divider></v-divider>
          <v-card-text>
            <template v-if="entry.feelings && entry.feelings.length">
              <p class="section-label caption grey--text mt-2">Gefühl</p>
              <div class="mb-2">
                <tag-list :items="entry.feelings"></tag-list>
              </div>
            </template>
            <template v-if="entry.withBelief">
              <p class="section-label caption grey--text mt-2">Reaktion</p>
              <p class="body-1">{{ entry.withBelief }}</p>
            </template>
            <template v-if="entry.needs && entry.needs.length">
              <p class="section-label caption grey--text mt-2">Bedürfnis</p>
              <div class="mb-2">
                <tag-list :items="entry.needs"></tag-list>
              </div>
            </template>
            <template v-if="entry.origin">
              <p class="section-label caption grey--text mt-2">Ursprungshypothese</p>
              <p class="body-1">{{ entry.origin }}</p>
            </template>
            <template v-if="entry.empathy">
              <p class="section-label caption grey--text mt-2">Empathie</p>
              <p class="body-1 empathy-text">{{ entry.empathy }}</p>
            </template>
            <template v-if="entry.affirmations && entry.affirmations.length">
              <p class="section-label caption grey--text mt-2">Affirmationen</p>
              <p v-for="(a, idx) in entry.affirmations" :key="idx" class="body-1 mb-1">{{ a.text }}</p>
            </template>
            <template v-if="hasChangeData(entry)">
              <p class="section-label caption grey--text mt-2">Veränderungsprozess</p>
              <template v-if="entry.withoutBelief">
                <p class="caption grey--text mt-1">Neue Perspektive</p>
                <p class="body-1">{{ entry.withoutBelief }}</p>
              </template>
              <template v-if="entry.turnarounds && entry.turnarounds.length">
                <p class="caption grey--text mt-1">Umkehrungen</p>
                <p v-for="(t, idx) in entry.turnarounds" :key="idx" class="body-1 mb-1">{{ t }}</p>
              </template>
              <template v-if="entry.changeAct">
                <p class="caption grey--text mt-1">Handlungen</p>
                <p class="body-1">{{ entry.changeAct }}</p>
              </template>
            </template>
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

    <v-bottom-nav :value="true" fixed app color="white" class="elevation-3">
      <v-btn flat color="grey" to="/patterns">
        <span>Muster</span>
        <v-icon>repeat</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/beliefs">
        <span>Beliefs</span>
        <v-icon>lightbulb_outline</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/affirmations">
        <span>Affirmationen</span>
        <v-icon>stars</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/reflections">
        <span>Reflektion</span>
        <v-icon>spa</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/resentments">
        <span>Groll</span>
        <v-icon>whatshot</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import TagList from '@/components/TagList.vue';

export default {
  name: 'belief-list',
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
    beliefs() {
      return this.$store.getters.beliefs
        .concat()
        .sort(function(a, b) {
          return ((b.count || 1) - (a.count || 1)) || (b.time - a.time);
        });
    },
    patternCountMap() {
      var map = {};
      this.$store.getters.patterns.forEach(function(p) {
        var ids = p.beliefs || [];
        ids.forEach(function(id) {
          map[id] = (map[id] || 0) + 1;
        });
      });
      return map;
    },
  },
  methods: {
    patternCount(beliefTime) {
      return this.patternCountMap[beliefTime] || 0;
    },
    handleTap(entry) {
      var time = entry.time;
      var self = this;
      if (this.tapTimeouts[time]) {
        clearTimeout(this.tapTimeouts[time]);
        this.$delete(this.tapTimeouts, time);
        if ((entry.count || 1) > 1) {
          this.$store.dispatch('decrementBeliefCount', entry);
        }
      } else {
        this.$set(this.tapTimeouts, time, setTimeout(function() {
          self.$delete(self.tapTimeouts, time);
          self.$store.dispatch('incrementBeliefCount', entry);
        }, 300));
      }
    },
    toggle(time) {
      this.openEntry = this.openEntry === time ? null : time;
    },
    hasChangeData(entry) {
      return !!(entry.withoutBelief || (entry.turnarounds && entry.turnarounds.length) || entry.changeAct);
    },
    empathyEntry(entry) {
      this.$router.push('/empathy-belief/' + entry.time);
    },
    changeEntry(entry) {
      this.$router.push('/change-belief/' + entry.time);
    },
    editEntry(entry) {
      this.$router.push('/edit-belief/' + entry.time);
    },
    preDelete(entry) {
      this.entryToDelete = entry;
      this.isDeleteDialogShowing = true;
    },
    confirmDelete() {
      this.isDeleteDialogShowing = false;
      this.$store.dispatch('deleteBelief', this.entryToDelete);
      this.entryToDelete = null;
    },
    cancelDelete() {
      this.isDeleteDialogShowing = false;
      this.entryToDelete = null;
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
  flex-direction: column;
  align-items: stretch;
  padding-bottom: 8px;
}
.belief-title {
  white-space: normal;
  word-break: break-word;
}
.header-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-meta {
  flex: 1;
  min-width: 0;
}
.header-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
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
.section-label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.empathy-text {
  white-space: pre-wrap;
}
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}
</style>
