<template>
  <div class="pattern-list">
    <v-toolbar color="white" app>
      <v-toolbar-title>Meine Muster</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon to="/add-pattern">
        <v-icon>add</v-icon>
      </v-btn>
    </v-toolbar>
    <v-content>
      <div class="intro-text body-1 grey--text">
        <p><em>Deine Überzeugungen sind das Betriebssystem hinter deinen Entscheidungen, Reaktionen und Urteilen. Sie formen deine Muster.</em></p>
        <p><em>Viele davon wurden durch Familie, Kultur oder frühe Erfahrungen installiert — nicht von dir gewählt, sondern einfach übernommen.</em></p>
        <p><em>Authentizität entsteht nicht dadurch, dass du entscheidest, wer du sein willst. Sie entsteht, wenn du klar siehst, was du bereits glaubst — und dann bewusst wählst, welche Überzeugungen bleiben dürfen.</em></p>
        <p><em>Deine Muster aufzuschreiben macht das Unsichtbare sichtbar. Es gibt dir die Möglichkeit zu wählen, statt einfach zu reagieren.</em></p>
      </div>
      <v-card class="entry" v-for="entry in patterns" v-bind:key="entry.time">
        <v-card-title class="header" @click="toggle(entry.time)">
          <p class="subheading belief-title mb-1">{{ entry.name || entry.belief }}</p>
          <div class="header-bottom">
            <div class="header-meta">
              <p class="caption grey--text mb-0">{{ formatTime(entry.time) }}</p>
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
            <template v-if="entry.trigger">
              <p class="section-label caption grey--text">Situation</p>
              <p class="body-1">{{ entry.trigger }}</p>
            </template>
            <p class="section-label caption grey--text mt-2">Glaube / Urteil</p>
            <p class="body-1">{{ entry.belief }}</p>
            <template v-if="entry.feelings && entry.feelings.length">
              <p class="section-label caption grey--text mt-2">Gefühl</p>
              <div class="mb-2">
                <tag-list :items="entry.feelings"></tag-list>
              </div>
            </template>
            <p class="section-label caption grey--text mt-2">Reaktion</p>
            <p class="body-1">{{ entry.withBelief }}</p>
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
            <template v-if="entry.withoutBelief || entry.turnaround || entry.changeAnnounce || entry.changeApologize || entry.changeAsk || entry.changeAct">
              <p class="section-label caption grey--text mt-2">Veränderungsprozess</p>
              <template v-if="entry.withoutBelief">
                <p class="caption grey--text mt-1">Neue Perspektive</p>
                <p class="body-1">{{ entry.withoutBelief }}</p>
              </template>
              <template v-if="entry.turnaround">
                <p class="caption grey--text mt-1">Umkehrung</p>
                <p class="body-1">{{ entry.turnaround }}</p>
              </template>
              <template v-if="entry.changeAnnounce">
                <p class="caption grey--text mt-1">Ankündigung</p>
                <p class="body-1">{{ entry.changeAnnounce }}</p>
              </template>
              <template v-if="entry.changeApologize">
                <p class="caption grey--text mt-1">Entschuldigung</p>
                <p class="body-1">{{ entry.changeApologize }}</p>
              </template>
              <template v-if="entry.changeAsk">
                <p class="caption grey--text mt-1">Um Hilfe bitten</p>
                <p class="body-1">{{ entry.changeAsk }}</p>
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
      <v-btn flat color="grey" to="/check-ins">
        <span>Check-Ins</span>
        <v-icon>favorite_border</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/patterns">
        <span>Muster</span>
        <v-icon>repeat</v-icon>
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
        clearTimeout(this.tapTimeouts[time]);
        this.$delete(this.tapTimeouts, time);
        if ((entry.count || 1) > 1) {
          this.$store.dispatch('decrementPatternCount', entry);
        }
      } else {
        this.$set(this.tapTimeouts, time, setTimeout(() => {
          this.$delete(this.tapTimeouts, time);
          this.$store.dispatch('incrementPatternCount', entry);
        }, 300));
      }
    },
    toggle(time) {
      this.openEntry = this.openEntry === time ? null : time;
    },
    hasChangeData(entry) {
      return !!(entry.changeAnnounce || entry.changeApologize || entry.changeAsk || entry.changeAct);
    },
    empathyEntry(entry) {
      this.$router.push(`/empathy-pattern/${entry.time}`);
    },
    changeEntry(entry) {
      this.$router.push(`/change-pattern/${entry.time}`);
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
</style>
