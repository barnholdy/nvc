<template>
  <div class="dark-page">
    <v-toolbar color="#000" dark flat app>
      <v-spacer></v-spacer>
      <v-btn icon @click="$router.push('/settings')">
        <v-icon color="#4ade80">settings</v-icon>
      </v-btn>
    </v-toolbar>

    <v-content>
      <div class="page-title-area">
        <h1 class="page-title">Affirmationen</h1>
      </div>

      <!-- Header card — like "Time to pray" -->
      <div v-if="affirmations.length" class="reminder-card">
        <span class="reminder-icon">✨</span>
        <p class="reminder-title">Zeit für Affirmationen</p>
        <p class="reminder-sub">Deine Affirmationen warten auf dich</p>
      </div>

      <div v-if="affirmations.length === 0" class="empty-state">
        <span class="empty-icon">✨</span>
        <p class="empty-title">Noch keine Affirmationen</p>
        <p class="empty-sub">Füge Affirmationen zu deinen Überzeugungen hinzu.</p>
      </div>

      <div v-else class="reminder-list">
        <template v-for="(item, i) in affirmations">
          <div :key="item.text + '-row'" class="reminder-row" @click="toggle(i)">
            <div class="reminder-row-body">
              <p class="reminder-text">{{ item.text }}</p>
              <p class="reminder-meta">{{ amenLabel(item.text) }}</p>
            </div>
            <button class="amen-btn" @click.stop="sayAmen(item.text)">Amen</button>
          </div>
          <div :key="item.text + '-expand'" v-if="openIndex === i" class="row-expand">
            <p class="expand-label">Überzeugungen</p>
            <p v-for="(s, j) in item.sources" :key="j" class="expand-text mb-1">„{{ s.beliefText }}"</p>
            <div class="expand-actions">
              <v-btn icon small @click.stop="startEdit(item)" class="row-action-btn">
                <v-icon small color="#636366">edit</v-icon>
              </v-btn>
              <v-btn icon small @click.stop="preDelete(item)" class="row-action-btn">
                <v-icon small color="#636366">delete</v-icon>
              </v-btn>
            </div>
          </div>
          <div :key="item.text + '-sep'" class="ios-sep" v-if="i < affirmations.length - 1 && openIndex !== i"></div>
        </template>
      </div>

      <!-- Edit dialog -->
      <v-dialog v-model="isEditDialogShowing" fullscreen>
        <div class="wizard-page">
          <v-toolbar color="#000" dark flat app>
            <v-btn icon @click="editStep === 1 ? cancelEdit() : prevEditStep()">
              <v-icon>{{ editStep === 1 ? 'close' : 'chevron_left' }}</v-icon>
            </v-btn>
            <v-toolbar-title>Affirmation bearbeiten</v-toolbar-title>
            <v-spacer></v-spacer>
            <span class="grey--text body-1">{{ editStep }} / 2</span>
          </v-toolbar>
          <v-content>
            <v-container class="mb-5">
              <v-layout v-show="editStep === 1" column>
                <v-flex class="mt-2 mb-3">
                  <h1 class="headline font-weight-regular">Affirmation</h1>
                  <p class="body-1 grey--text mt-2">Formuliere eine positive, kraftvolle Aussage im Präsens.</p>
                </v-flex>
                <v-flex>
                  <v-textarea v-model="editText" placeholder="..." auto-grow rows="4" hide-details></v-textarea>
                </v-flex>
              </v-layout>
              <v-layout v-show="editStep === 2" column>
                <v-flex class="mt-2 mb-3">
                  <h1 class="headline font-weight-regular">Überzeugungen</h1>
                  <p class="body-1 grey--text mt-2">Verknüpfe diese Affirmation mit deinen Überzeugungen.</p>
                </v-flex>
                <v-flex v-if="currentEditAffirmation">
                  <div class="belief-chips mb-2">
                    <v-chip
                      v-for="(s, j) in currentEditAffirmation.sources"
                      :key="j"
                      close
                      class="mb-1 mr-1"
                      @input="removeBeliefFromAffirmation(editOriginalText, s.beliefTime)"
                    >{{ s.beliefText }}</v-chip>
                  </div>
                  <v-menu v-if="unlinkedBeliefsForEdit.length" bottom>
                    <v-btn slot="activator" flat small color="primary" class="mt-2 ml-0">
                      <v-icon left small>add</v-icon>
                      Überzeugung hinzufügen
                    </v-btn>
                    <v-list>
                      <v-list-tile
                        v-for="b in unlinkedBeliefsForEdit"
                        :key="b.time"
                        @click="addBeliefToAffirmation(editOriginalText, b)"
                      >
                        <v-list-tile-title>{{ b.belief }}</v-list-tile-title>
                      </v-list-tile>
                    </v-list>
                  </v-menu>
                </v-flex>
              </v-layout>
            </v-container>
            <v-footer :fixed="true" color="white elevation-3" height="44">
              <v-btn v-if="editStep === 1" :disabled="!editText.trim()" @click="nextEditStep" block large color="primary">weiter</v-btn>
              <v-btn v-else @click="saveEdit" block large color="primary">speichern</v-btn>
            </v-footer>
          </v-content>
        </div>
      </v-dialog>

      <v-dialog v-model="isDeleteDialogShowing" width="300">
        <v-card class="confirm-dialog">
          <v-card-title class="confirm-title">Affirmation löschen?</v-card-title>
          <v-divider></v-divider>
          <v-card-actions class="confirm-actions">
            <v-btn flat @click="cancelDelete" class="confirm-cancel">Abbrechen</v-btn>
            <v-btn flat @click="confirmDelete" class="confirm-delete">Löschen</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-content>

    <v-bottom-nav :value="true" fixed app color="#1c1c1e" class="dark-nav">
      <v-btn flat color="grey" to="/patterns">
        <v-icon>bolt</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/beliefs">
        <v-icon>lightbulb_outline</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/affirmations">
        <v-icon>stars</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/actions">
        <v-icon>directions_run</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/empathy">
        <v-icon>favorite_border</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import moment from 'moment';

const AMEN_KEY = 'nvc.amen';

function loadAmenMap() {
  try { return JSON.parse(localStorage.getItem(AMEN_KEY)) || {}; } catch (e) { return {}; }
}

export default {
  name: 'affirmation-list',
  data() {
    return {
      openIndex: null,
      isEditDialogShowing: false,
      editStep: 1,
      editOriginalText: '',
      editText: '',
      itemToDelete: null,
      isDeleteDialogShowing: false,
      amenMap: loadAmenMap(),
    };
  },
  computed: {
    affirmations() {
      const map = {};
      this.$store.getters.beliefs.forEach((belief) => {
        if (!belief.affirmations || !belief.affirmations.length) return;
        belief.affirmations.forEach((a) => {
          if (!a.text) return;
          if (!map[a.text]) map[a.text] = { text: a.text, beliefCount: 0, sources: [] };
          map[a.text].beliefCount += 1;
          map[a.text].sources.push({ beliefTime: belief.time, beliefText: belief.belief });
        });
      });
      return Object.values(map).sort((a, b) => b.beliefCount - a.beliefCount);
    },
    currentEditAffirmation() {
      const key = this.editOriginalText;
      if (!key) return null;
      return this.affirmations.find(a => a.text === key) || null;
    },
    unlinkedBeliefsForEdit() {
      if (!this.currentEditAffirmation) return [];
      const linked = this.currentEditAffirmation.sources.map(s => s.beliefTime);
      return this.$store.getters.beliefs.filter(b => linked.indexOf(b.time) === -1);
    },
  },
  methods: {
    toggle(i) {
      this.openIndex = this.openIndex === i ? null : i;
    },
    sayAmen(text) {
      this.amenMap = Object.assign({}, this.amenMap, { [text]: Date.now() });
      localStorage.setItem(AMEN_KEY, JSON.stringify(this.amenMap));
    },
    amenLabel(text) {
      const ts = this.amenMap[text];
      if (!ts) return 'Noch nicht gesagt';
      moment.locale('de');
      return moment(ts).fromNow();
    },
    startEdit(item) {
      this.editOriginalText = item.text;
      this.editText = item.text;
      this.editStep = 1;
      this.isEditDialogShowing = true;
    },
    nextEditStep() { this.editStep = 2; },
    prevEditStep() { this.editStep = 1; },
    cancelEdit() {
      this.isEditDialogShowing = false;
      this.editOriginalText = '';
      this.editText = '';
      this.editStep = 1;
    },
    saveEdit() {
      const oldText = this.editOriginalText;
      const newText = this.editText.trim();
      this.isEditDialogShowing = false;
      this.editOriginalText = '';
      this.editText = '';
      this.editStep = 1;
      if (!newText || newText === oldText) return;
      this.$store.getters.beliefs.forEach((belief) => {
        if (!belief.affirmations || !belief.affirmations.length) return;
        if (belief.affirmations.some(a => a.text === oldText)) {
          const updated = belief.affirmations.map(a => (a.text === oldText ? Object.assign({}, a, { text: newText }) : a));
          this.$store.dispatch('updateBelief', Object.assign({}, belief, { affirmations: updated }));
        }
      });
    },
    addBeliefToAffirmation(text, belief) {
      const updated = (belief.affirmations || []).concat([{ text }]);
      this.$store.dispatch('updateBelief', Object.assign({}, belief, { affirmations: updated }));
    },
    removeBeliefFromAffirmation(text, beliefTime) {
      const belief = this.$store.getters.beliefs.find(b => b.time === beliefTime);
      if (!belief) return;
      const updated = (belief.affirmations || []).filter(a => a.text !== text);
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
      const text = this.itemToDelete ? this.itemToDelete.text : null;
      this.itemToDelete = null;
      if (!text) return;
      this.$store.getters.beliefs.forEach((belief) => {
        if (!belief.affirmations || !belief.affirmations.length) return;
        if (belief.affirmations.some(a => a.text === text)) {
          const updated = belief.affirmations.filter(a => a.text !== text);
          this.$store.dispatch('updateBelief', Object.assign({}, belief, { affirmations: updated }));
        }
      });
      this.openIndex = null;
    },
  },
};
</script>

<style scoped lang="scss">
.dark-page {
  background: #000;
  min-height: 100vh;
}

.page-title-area {
  padding: 8px 20px 16px;
}
.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
  margin: 0;
}

/* ─── "Time to pray" card ─── */
.reminder-card {
  background: #1c1c1e;
  border-radius: 16px;
  margin: 0 16px 20px;
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.reminder-icon {
  font-size: 2.4rem;
  display: block;
  margin-bottom: 12px;
}
.reminder-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 4px;
}
.reminder-sub {
  font-size: 0.875rem;
  color: #8e8e93;
  margin: 0;
}

/* ─── Reminder list ─── */
.reminder-list {
  background: #1c1c1e;
  border-radius: 12px;
  margin: 0 16px 24px;
  overflow: hidden;
}
.reminder-row {
  display: flex;
  align-items: center;
  padding: 14px 16px 14px 20px;
  background: #1c1c1e;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  &:active { background: #2c2c2e; }
}
.reminder-row-body {
  flex: 1;
  min-width: 0;
  margin-right: 12px;
}
.reminder-text {
  font-size: 0.95rem;
  color: #fff;
  margin: 0 0 3px;
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
}
.reminder-meta {
  font-size: 0.78rem;
  color: #8e8e93;
  margin: 0;
}

.amen-btn {
  background: #4ade80;
  color: #000;
  border: none;
  border-radius: 20px;
  padding: 7px 18px;
  font-size: 0.875rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  &:active { background: #3dcc70; transform: scale(0.97); }
}

.ios-sep {
  height: 1px;
  background: #2c2c2e;
  margin-left: 20px;
}

.row-expand {
  background: #141416;
  padding: 14px 20px 16px;
  border-top: 1px solid #2c2c2e;
}
.expand-label {
  font-size: 0.68rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 6px;
  font-weight: 600;
}
.expand-text {
  font-size: 0.93rem;
  color: #ebebf5;
  margin: 0;
  line-height: 1.5;
  font-style: italic;
}
.expand-actions {
  display: flex;
  margin-top: 8px;
}
.row-action-btn { margin: 0 !important; }
.mb-1 { margin-bottom: 4px !important; }
.belief-chips { display: flex; flex-wrap: wrap; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5rem 2rem;
  text-align: center;
}
.empty-icon { font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 16px; }
.empty-title { font-size: 1.1rem; color: #fff; font-weight: 600; margin: 0 0 6px; }
.empty-sub { font-size: 0.875rem; color: #8e8e93; margin: 0; }

.wizard-page {
  background: #000;
  min-height: 100vh;
  position: fixed;
  inset: 0;
  z-index: 200;
}

.confirm-dialog { border-radius: 14px !important; overflow: hidden; }
.confirm-title {
  font-size: 1rem !important;
  font-weight: 600 !important;
  color: #fff !important;
  justify-content: center !important;
  padding: 16px !important;
}
.confirm-actions { padding: 0 !important; display: flex; }
.confirm-cancel { flex: 1; color: #4ade80 !important; border-right: 1px solid #3a3a3c; }
.confirm-delete { flex: 1; color: #ff453a !important; font-weight: 600 !important; }

.dark-nav { border-top: 1px solid #2c2c2e !important; }
</style>
