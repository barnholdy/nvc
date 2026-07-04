<template>
  <div class="affirmation-list">
    <v-toolbar color="white" app>
      <v-toolbar-title>Affirmationen</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon to="/settings">
        <v-icon>settings</v-icon>
      </v-btn>
    </v-toolbar>
    <v-content>
      <div class="intro-text body-1 grey--text">
        <p><em>Die Kraft von Affirmationen liegt in der Neuroplastizität — der Fähigkeit des Gehirns, sich durch wiederholte Denkmuster neu zu vernetzen. Wenn du positive Aussagen bewusst wiederholst, stärkst du neuronale Bahnen, die mit Selbstvertrauen verbunden sind, reduzierst Stress und trainierst deinen Geist, sich auf Lösungen statt auf Einschränkungen zu fokussieren.</em></p>
      </div>
      <template v-if="affirmations.length">
        <v-card
          class="affirmation-card"
          v-for="(item, i) in affirmations"
          :key="item.text"
        >
          <v-card-title class="affirmation-header" @click="editIndex !== i && toggle(i)">
            <template v-if="editIndex === i">
              <v-text-field
                v-model="editText"
                single-line
                hide-details
                class="edit-field"
                @click.stop
              ></v-text-field>
              <div class="header-actions">
                <v-btn icon small @click.stop="saveEdit(item)">
                  <v-icon color="primary">check</v-icon>
                </v-btn>
                <v-btn icon small @click.stop="cancelEdit()">
                  <v-icon color="grey darken-2">close</v-icon>
                </v-btn>
              </div>
            </template>
            <template v-else>
              <p class="body-1 affirmation-text mb-0">{{ item.text }}</p>
              <div class="header-actions">
                <span class="count-badge">{{ item.beliefCount }}</span>
                <v-btn icon small @click.stop="startEdit(i, item)">
                  <v-icon color="grey darken-2">edit</v-icon>
                </v-btn>
                <v-btn icon small @click.stop="preDelete(item)">
                  <v-icon color="grey darken-2">delete</v-icon>
                </v-btn>
              </div>
            </template>
          </v-card-title>
          <template v-if="openIndex === i">
            <v-divider></v-divider>
            <v-card-text>
              <p class="caption grey--text mb-2 section-label">Überzeugungen</p>
              <div class="belief-chips mb-2">
                <v-chip
                  v-for="(s, j) in item.sources"
                  :key="j"
                  close
                  class="mb-1 mr-1"
                  @input="removeBeliefFromAffirmation(item.text, s.beliefTime)"
                >{{ s.beliefText }}</v-chip>
              </div>
              <v-menu v-if="unlinkedBeliefs(item).length" bottom>
                <v-btn slot="activator" flat small color="primary" class="mt-1 ml-0">
                  <v-icon left small>add</v-icon>
                  Überzeugung hinzufügen
                </v-btn>
                <v-list>
                  <v-list-tile
                    v-for="b in unlinkedBeliefs(item)"
                    :key="b.time"
                    @click="addBeliefToAffirmation(item.text, b)"
                  >
                    <v-list-tile-title>{{ b.belief }}</v-list-tile-title>
                  </v-list-tile>
                </v-list>
              </v-menu>
            </v-card-text>
          </template>
        </v-card>
      </template>

      <div v-else class="empty-state">
        <v-icon large color="grey lighten-2">stars</v-icon>
        <p class="body-1 grey--text mt-2">Noch keine Affirmationen vorhanden.</p>
        <p class="caption grey--text">Füge Affirmationen zu deinen Überzeugungen hinzu.</p>
      </div>

      <v-dialog v-model="isDeleteDialogShowing" width="500">
        <v-card>
          <v-card-title class="subheading" primary-title>
            Affirmation wirklich löschen?
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
      <v-btn flat color="grey" to="/beliefs">
        <span>Überzeugungen</span>
        <v-icon>lightbulb_outline</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/affirmations">
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
export default {
  name: 'affirmation-list',
  data() {
    return {
      openIndex: null,
      editIndex: null,
      editText: '',
      itemToDelete: null,
      isDeleteDialogShowing: false,
    };
  },
  computed: {
    affirmations() {
      var map = {};
      this.$store.getters.beliefs.forEach(function(belief) {
        if (!belief.affirmations || !belief.affirmations.length) return;
        belief.affirmations.forEach(function(a, idx) {
          if (!a.text) return;
          if (!map[a.text]) {
            map[a.text] = { text: a.text, beliefCount: 0, sources: [] };
          }
          map[a.text].beliefCount += 1;
          map[a.text].sources.push({ beliefTime: belief.time, affirmationIndex: idx, beliefText: belief.belief });
        });
      });
      var result = [];
      Object.keys(map).forEach(function(key) { result.push(map[key]); });
      return result.sort(function(a, b) { return b.beliefCount - a.beliefCount; });
    },
  },
  methods: {
    toggle(i) {
      this.openIndex = this.openIndex === i ? null : i;
    },
    startEdit(i, item) {
      this.editIndex = i;
      this.editText = item.text;
      if (this.openIndex !== i) this.openIndex = i;
    },
    cancelEdit() {
      this.editIndex = null;
      this.editText = '';
    },
    saveEdit(item) {
      var oldText = item.text;
      var newText = this.editText.trim();
      this.editIndex = null;
      this.editText = '';
      if (!newText || newText === oldText) return;
      var self = this;
      this.$store.getters.beliefs.forEach(function(belief) {
        if (!belief.affirmations || !belief.affirmations.length) return;
        if (belief.affirmations.some(function(a) { return a.text === oldText; })) {
          var updated = belief.affirmations.map(function(a) {
            return a.text === oldText ? Object.assign({}, a, { text: newText }) : a;
          });
          self.$store.dispatch('updateBelief', Object.assign({}, belief, { affirmations: updated }));
        }
      });
    },
    unlinkedBeliefs(item) {
      var linkedTimes = item.sources.map(function(s) { return s.beliefTime; });
      return this.$store.getters.beliefs.filter(function(b) {
        return linkedTimes.indexOf(b.time) === -1;
      });
    },
    addBeliefToAffirmation(text, belief) {
      var existing = belief.affirmations || [];
      var updated = existing.concat([{ text: text }]);
      this.$store.dispatch('updateBelief', Object.assign({}, belief, { affirmations: updated }));
    },
    removeBeliefFromAffirmation(text, beliefTime) {
      var belief = this.$store.getters.beliefs.find(function(b) { return b.time === beliefTime; });
      if (!belief) return;
      var updated = (belief.affirmations || []).filter(function(a) { return a.text !== text; });
      this.$store.dispatch('updateBelief', Object.assign({}, belief, { affirmations: updated }));
    },
    preDelete(item) {
      this.itemToDelete = item;
      this.isDeleteDialogShowing = true;
    },
    cancelDelete() {
      this.isDeleteDialogShowing = false;
      this.itemToDelete = null;
    },
    confirmDelete() {
      this.isDeleteDialogShowing = false;
      var text = this.itemToDelete ? this.itemToDelete.text : null;
      this.itemToDelete = null;
      if (!text) return;
      var self = this;
      this.$store.getters.beliefs.forEach(function(belief) {
        if (!belief.affirmations || !belief.affirmations.length) return;
        if (belief.affirmations.some(function(a) { return a.text === text; })) {
          var updated = belief.affirmations.filter(function(a) { return a.text !== text; });
          self.$store.dispatch('updateBelief', Object.assign({}, belief, { affirmations: updated }));
        }
      });
      self.openIndex = null;
    },
  },
};
</script>

<style scoped lang="scss">
.intro-text {
  margin: 1rem;
  line-height: 1.6;
}
.affirmation-card {
  margin: 1rem;
}
.affirmation-header {
  cursor: pointer;
  user-select: none;
  align-items: flex-start !important;
  padding: 12px 16px !important;
  display: flex;
  justify-content: space-between;
}
.affirmation-text {
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
  flex: 1;
  margin-right: 8px;
}
.edit-field {
  flex: 1;
  margin-right: 8px;
  padding-top: 0;
}
.header-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 4px;
}
.count-badge {
  color: #00838f;
  font-size: 0.85rem;
  font-weight: bold;
  min-width: 18px;
  text-align: center;
  border: 1.5px solid #00838f;
  border-radius: 20px;
  padding: 2px 6px;
}
.belief-chips {
  display: flex;
  flex-wrap: wrap;
}
.section-label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  text-align: center;
}
</style>
