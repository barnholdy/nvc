<template>
  <div class="belief-list">
    <v-toolbar color="white" app>
      <v-toolbar-title>Meine Überzeugungen</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon to="/add-belief">
        <v-icon>add</v-icon>
      </v-btn>
      <v-btn icon to="/settings">
        <v-icon>settings</v-icon>
      </v-btn>
    </v-toolbar>
    <v-content>
      <div class="intro-text body-1 grey--text">
        <p><em>Deine Überzeugungen sind das Betriebssystem hinter deinem Denken, Fühlen und Handeln. Sie formen dich.</em></p>
        <p><em>Viele davon wurden durch Familie, Kultur oder frühe Erfahrungen installiert — nicht bewusst von dir gewählt.</em></p>
        <p><em>Authentizität entsteht, wenn du klar siehst, was du bereits glaubst und dann bewusst wählst, welche Überzeugungen bleiben dürfen. Diese Art von Selbstermächtigung kann dir niemand nehmen.</em></p>
        <p><em>Deine Überzeugungen aufzuschreiben macht das Unsichtbare sichtbar. Es gibt dir die Möglichkeit bewusst zu wählen, statt zu reagieren.</em></p>
      </div>
      <div v-if="beliefs.length === 0" class="empty-state grey--text">
        <v-icon large color="grey lighten-1">lightbulb_outline</v-icon>
        <p class="body-1 mt-2">Noch keine Überzeugungen eingetragen.</p>
        <p class="caption">Tippe auf + um eine neue Überzeugung hinzuzufügen.</p>
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
              <v-btn icon small @click.stop="editEntry(entry)">
                <v-icon :color="isComplete(entry) ? '#00838f' : 'grey darken-2'">edit</v-icon>
              </v-btn>
              <v-btn icon small @click.stop="empathyEntry(entry)">
                <v-icon :color="entry.empathy ? '#00838f' : 'grey darken-2'">favorite</v-icon>
              </v-btn>
              <v-btn icon small @click.stop="changeEntry(entry)">
                <v-icon :color="hasChangeData(entry) ? '#00838f' : 'grey darken-2'">autorenew</v-icon>
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
            <template v-if="associatedPatterns(entry.time).length">
              <p class="section-label caption grey--text">Trigger</p>
              <p v-for="(p, idx) in associatedPatterns(entry.time)" :key="idx" class="body-1 mb-1">{{ p.trigger || p.name }}</p>
            </template>
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
            <template v-if="entry.reflection && entry.reflection.origin">
              <p class="section-label caption grey--text mt-2">Ursprungshypothese</p>
              <p class="body-1">{{ entry.reflection.origin }}</p>
            </template>
            <template v-if="entry.empathy">
              <p class="section-label caption grey--text mt-2">Empathie</p>
              <p class="body-1 empathy-text">{{ entry.empathy }}</p>
            </template>
            <template v-if="hasChangeData(entry) || (entry.affirmations && entry.affirmations.length)">
              <p class="section-label caption grey--text mt-2">Veränderungsprozess</p>
              <template v-if="entry.reflection && entry.reflection.withoutBelief">
                <p class="caption grey--text mt-1">Neue Perspektive</p>
                <p class="body-1">{{ entry.reflection.withoutBelief }}</p>
              </template>
              <template v-if="entry.reflection && entry.reflection.withoutBeliefFeelings && entry.reflection.withoutBeliefFeelings.length">
                <p class="caption grey--text mt-1">Gefühle dabei</p>
                <div class="mb-2">
                  <tag-list :items="entry.reflection.withoutBeliefFeelings"></tag-list>
                </div>
              </template>
              <template v-if="entry.affirmations && entry.affirmations.length">
                <p class="caption grey--text mt-1">Affirmationen</p>
                <p v-for="(a, idx) in entry.affirmations" :key="idx" class="body-1 mb-1">{{ a.text }}</p>
              </template>
              <template v-if="entry.reflection && ((entry.reflection.changeActs && entry.reflection.changeActs.length) || entry.reflection.changeAct)">
                <p class="caption grey--text mt-1">Handlungen</p>
                <template v-if="entry.reflection.changeActs && entry.reflection.changeActs.length">
                  <p v-for="(a, idx) in entry.reflection.changeActs" :key="idx" class="body-1 mb-1">{{ a }}</p>
                </template>
                <p v-else class="body-1">{{ entry.reflection.changeAct }}</p>
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
        <span>Trigger</span>
        <v-icon>bolt</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/beliefs">
        <span>Überzeugungen</span>
        <v-icon>lightbulb_outline</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/affirmations">
        <span>Affirmationen</span>
        <v-icon>stars</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/actions">
        <span>Handlungen</span>
        <v-icon>directions_run</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/empathy">
        <span>Empathie</span>
        <v-icon>favorite_border</v-icon>
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
    };
  },
  computed: {
    beliefs() {
      var map = this.patternCountMap;
      return this.$store.getters.beliefs
        .concat()
        .sort(function(a, b) {
          return ((map[b.time] || 0) - (map[a.time] || 0)) || (b.time - a.time);
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
    associatedPatterns(beliefTime) {
      return this.$store.getters.patterns.filter(function(p) {
        return (p.beliefs || []).indexOf(beliefTime) !== -1;
      });
    },
    toggle(time) {
      this.openEntry = this.openEntry === time ? null : time;
    },
    isComplete(entry) {
      return !!(
        entry.feelings && entry.feelings.length &&
        entry.withBelief &&
        entry.needs && entry.needs.length &&
        entry.reflection && entry.reflection.origin
      );
    },
    hasChangeData(entry) {
      var r = entry.reflection || {};
      return !!(r.withoutBelief || r.changeAct || (r.changeActs && r.changeActs.length));
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
