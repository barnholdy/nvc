<template>
  <div class="dark-page">
    <v-toolbar color="#000" dark flat app>
      <v-toolbar-title>Überzeugungen</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$router.push('/settings')">
        <v-icon color="#4ade80">settings</v-icon>
      </v-btn>
    </v-toolbar>

    <v-content>
      <div class="intro-card">
        <span class="intro-icon">💡</span>
        <p class="intro-title">Dein inneres Betriebssystem</p>
        <p class="intro-text">Deine Überzeugungen formen dein Denken, Fühlen und Handeln. Authentizität entsteht, wenn du klar siehst, was du glaubst — und dann bewusst wählst, was bleiben darf.</p>
      </div>

      <div class="segment-row">
        <button class="seg-tab" :class="{ active: tab === 'open' }" @click="tab = 'open'">Offen</button>
        <button class="seg-tab" :class="{ active: tab === 'working' }" @click="tab = 'working'">Ergründet</button>
        <button class="seg-tab" :class="{ active: tab === 'done' }" @click="tab = 'done'">Gewandelt</button>
        <button class="seg-tab" :class="{ active: tab === 'acted' }" @click="tab = 'acted'">Gehandelt</button>
      </div>

      <div v-if="filteredBeliefs.length === 0" class="empty-state">
        <span class="empty-icon">💡</span>
        <p class="empty-title">Keine Einträge</p>
        <p class="empty-sub">
          <template v-if="tab === 'open'">Überzeugungen entstehen beim Anlegen einer Situation.</template>
          <template v-else-if="tab === 'working'">Noch keine ergründeten Überzeugungen.</template>
          <template v-else-if="tab === 'done'">Noch keine gewandelten Überzeugungen.</template>
          <template v-else>Noch keine gehandelten Überzeugungen — plane ein Verhaltensexperiment über „Handeln“.</template>
        </p>
      </div>

      <div v-else class="ios-list">
        <template v-for="(entry, idx) in filteredBeliefs">
          <div
            :key="entry.time + '-row'"
            class="swipe-outer"
            @touchstart="tsStart($event, idx)"
            @touchmove="tsMove($event, idx)"
            @touchend="tsEnd($event, idx)"
          >
            <div class="swipe-right-panel">
              <button class="swipe-btn swipe-btn-edit" @click.stop="editEntry(entry)">
                <v-icon small color="#fff">edit</v-icon>
                <span>Ergründen</span>
              </button>
              <button class="swipe-btn swipe-btn-change" @click.stop="changeEntry(entry)">
                <v-icon small color="#fff">autorenew</v-icon>
                <span>Wandeln</span>
              </button>
              <button class="swipe-btn swipe-btn-act" @click.stop="actEntry(entry)">
                <v-icon small color="#fff">directions_run</v-icon>
                <span>Handeln</span>
              </button>
            </div>
            <div class="swipe-left-panel">
              <button class="swipe-btn swipe-btn-delete" @click.stop="preDelete(entry)">
                <v-icon small color="#fff">delete</v-icon>
                <span>Löschen</span>
              </button>
            </div>
            <div class="ios-row" :style="rowSt(idx, 195)" @click="deskClick(idx)">
              <div class="row-body">
                <p class="row-title">{{ entry.belief }}</p>
                <div class="row-badges">
                  <span v-if="patternCount(entry.time) > 0" class="badge-pill">
                    {{ patternCount(entry.time) }} {{ patternCount(entry.time) === 1 ? 'Situation' : 'Situationen' }}
                  </span>
                </div>
                <!-- Everything that was ever recorded about this belief, on the
                     scale it was recorded on. -->
                <template v-if="credibility(entry) !== null">
                  <p class="expand-label mt-2">Glaubwürdigkeit</p>
                  <div class="slider-row">
                    <span class="slider-end-label">0</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      :value="credibility(entry)"
                      class="readonly-slider"
                      disabled
                    />
                    <span class="slider-end-label">10</span>
                  </div>
                </template>
              </div>
              <button
                v-if="rowActionLabel(entry)"
                class="row-action-btn"
                @click.stop="runRowAction(entry)"
              >{{ rowActionLabel(entry) }}</button>
              <v-icon class="row-chevron" :class="{ rotated: openEntry === entry.time }">chevron_right</v-icon>
            </div>
          </div>

          <div
            v-if="openEntry === entry.time"
            :key="entry.time + '-expand'"
            class="row-expand"
          >
            <template v-if="associatedPatterns(entry.time).length">
              <p class="expand-label">Situationen</p>
              <div
                v-for="p in associatedPatterns(entry.time)"
                :key="'pat-' + p.time"
                class="linked-row"
                @click.stop="editPattern(p)"
              >
                <div class="linked-row-body">
                  <p class="expand-text">{{ p.trigger || p.name }}</p>
                  <!-- What this belief was rated at in this situation, on the
                       scale it was rated on. -->
                  <template v-if="situationTruth(p, entry) !== null">
                    <p class="expand-label mt-2">Glaubwürdigkeit</p>
                    <div class="slider-row">
                      <span class="slider-end-label">0</span>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        :value="situationTruth(p, entry)"
                        class="readonly-slider"
                        disabled
                      />
                      <span class="slider-end-label">10</span>
                    </div>
                  </template>
                </div>
                <v-icon small class="linked-chevron">chevron_right</v-icon>
              </div>
            </template>
            <template v-if="entry.withBelief">
              <p class="expand-label mt-3">Reaktion</p>
              <p class="expand-text">{{ entry.withBelief }}</p>
            </template>
            <template v-if="entry.feelings && entry.feelings.length">
              <p class="expand-label mt-3">Gefühle</p>
              <feeling-chips :items="entry.feelings" type="feelings" class="mb-2"></feeling-chips>
            </template>
            <!-- Childhood material is reopened by a deliberate tap, never as a
                 side effect of opening the belief. -->
            <template v-if="entry.reflection && entry.reflection.origin">
              <div class="section-toggle" @click.stop="isOriginOpen = !isOriginOpen">
                <span class="section-toggle-label">
                  {{ isOriginOpen ? 'Ursprung ausblenden' : 'Ursprung anzeigen' }}
                </span>
                <v-icon small class="section-chevron">
                  {{ isOriginOpen ? 'expand_more' : 'chevron_right' }}
                </v-icon>
              </div>
              <p v-if="isOriginOpen" class="expand-text mt-2">{{ entry.reflection.origin }}</p>
            </template>
            <template v-if="entry.needs && entry.needs.length">
              <p class="expand-label mt-3">Bedürfnisse</p>
              <feeling-chips :items="entry.needs" type="needs" class="mb-2"></feeling-chips>
            </template>

            <!-- Below the six the wizard collects, and folded away, because it
                 is the longest text here. -->
            <template v-if="entry.empathy">
              <div class="section-toggle" @click.stop="isEmpathyOpen = !isEmpathyOpen">
                <span class="section-toggle-label">
                  {{ isEmpathyOpen ? 'Empathie ausblenden' : 'Empathie anzeigen' }}
                </span>
                <v-icon small class="section-chevron">
                  {{ isEmpathyOpen ? 'expand_more' : 'chevron_right' }}
                </v-icon>
              </div>
              <p v-if="isEmpathyOpen" class="expand-text empathy-text mt-2">{{ entry.empathy }}</p>
            </template>

            <!-- What wandeln and handeln added afterwards. -->
            <template v-if="hasChangeData(entry) || (entry.affirmations && entry.affirmations.length)">
              <template v-if="entry.reflection && entry.reflection.exceptions">
                <p class="expand-label mt-3">Ausnahmen</p>
                <p class="expand-text">{{ entry.reflection.exceptions }}</p>
              </template>
              <template v-if="entry.reflection && entry.reflection.withoutBelief">
                <p class="expand-label mt-3">Neue Perspektive</p>
                <p class="expand-text">{{ entry.reflection.withoutBelief }}</p>
              </template>
              <template v-if="entry.reflection && entry.reflection.withoutBeliefFeelings
                && entry.reflection.withoutBeliefFeelings.length">
                <p class="expand-label mt-3">Neue Gefühle</p>
                <feeling-chips
                  :items="entry.reflection.withoutBeliefFeelings"
                  type="feelings"
                  class="mb-1"
                ></feeling-chips>
              </template>
              <template v-if="entry.reflection && typeof entry.reflection.bodyIntensity === 'number'">
                <p class="expand-label mt-3">Körperempfindung</p>
                <div class="slider-row">
                  <span class="slider-end-label">0</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    :value="entry.reflection.bodyIntensity"
                    class="readonly-slider"
                    disabled
                  />
                  <span class="slider-end-label">10</span>
                </div>
              </template>
              <template v-if="entry.affirmations && entry.affirmations.length">
                <p class="expand-label mt-3">Affirmation</p>
                <div
                  v-for="(a, i) in entry.affirmations"
                  :key="'aff-' + i"
                  class="linked-row"
                  @click.stop="openAffirmations()"
                >
                  <div class="linked-row-body">
                    <p class="expand-text">{{ a.text }}</p>
                    <span class="status-pill" :style="{ color: affStatusColor(a.text) }">
                      {{ affStatusLabel(a.text) }}
                    </span>
                    <p class="expand-label mt-2">Glaubwürdigkeit</p>
                    <div class="slider-row">
                      <span class="slider-end-label">0</span>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        :value="truthOf(a)"
                        class="readonly-slider"
                        disabled
                      />
                      <span class="slider-end-label">10</span>
                    </div>
                  </div>
                  <v-icon small class="linked-chevron">chevron_right</v-icon>
                </div>
              </template>
              <template v-if="experimentsOf(entry).length">
                <p class="expand-label mt-3">Verhaltensexperimente</p>
                <div
                  v-for="x in experimentsOf(entry)"
                  :key="x.id"
                  class="linked-row"
                  @click.stop="editExperiment(entry, x)"
                >
                  <div class="linked-row-body">
                    <p class="expand-text">{{ x.situation }}</p>
                    <span class="status-pill" :style="{ color: experimentStateColor(x) }">
                      {{ experimentStateLabel(x) }}
                    </span>
                    <span v-if="experimentGap(x) !== null" class="experiment-gap">
                      Erwartet {{ x.fearExpected }} → real {{ x.fearActual }}
                      <span :style="{ color: gapColor(experimentGap(x)) }">
                        ({{ experimentGap(x) > 0 ? '−' : '+' }}{{ Math.abs(experimentGap(x)) }})
                      </span>
                    </span>
                    <!-- Both readings the evaluation took, each on its own
                         scale — an experiment can lower the belief without
                         raising the affirmation. -->
                    <template v-if="typeof x.beliefTruth === 'number'">
                      <p class="expand-label mt-2">Glaubwürdigkeit Überzeugung</p>
                      <div class="slider-row">
                        <span class="slider-end-label">0</span>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          :value="x.beliefTruth"
                          class="readonly-slider"
                          disabled
                        />
                        <span class="slider-end-label">10</span>
                      </div>
                    </template>
                    <template v-if="typeof x.affirmationTruth === 'number'">
                      <p class="expand-label mt-2">Glaubwürdigkeit Affirmation</p>
                      <div class="slider-row">
                        <span class="slider-end-label">0</span>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          :value="x.affirmationTruth"
                          class="readonly-slider"
                          disabled
                        />
                        <span class="slider-end-label">10</span>
                      </div>
                    </template>
                  </div>
                  <v-icon small class="linked-chevron">chevron_right</v-icon>
                </div>
              </template>
            </template>
          </div>

          <div :key="entry.time + '-sep'" class="ios-sep" v-if="idx < filteredBeliefs.length - 1"></div>
        </template>
      </div>

      <v-dialog v-model="isDeleteDialogShowing" width="300">
        <v-card class="confirm-dialog">
          <v-card-title class="confirm-title">Eintrag löschen?</v-card-title>
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
      <v-btn flat color="primary" to="/beliefs">
        <v-icon>lightbulb_outline</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/affirmations">
        <v-icon>flare</v-icon>
      </v-btn>
      <v-btn flat color="grey" to="/actions">
        <v-icon>gps_fixed</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import FeelingChips from '@/components/FeelingChips.vue';
import { beliefStatus, hasChangeData, isBeliefStatus } from '@/utils/beliefStatus';
import {
  fearGap,
  fearGapColor,
  experimentStateLabel as stateLabelOf,
  experimentStateColor as stateColorOf,
  experimentsOf,
} from '@/utils/experiment';
import { normalizeTruth } from '@/utils/affirmationTruth';
import { beliefCredibility, beliefTruthIn } from '@/utils/credibility';
import {
  loadAffStatusMap,
  affirmationStatusLabel,
  affirmationStatusColor,
} from '@/utils/affirmationStatus';

export default {
  name: 'belief-list',
  components: { FeelingChips },
  data() {
    return {
      openEntry: null,
      isOriginOpen: false,
      isEmpathyOpen: false,
      entryToDelete: null,
      isDeleteDialogShowing: false,
      // Saving a belief returns here with the tab it now belongs to.
      tab: isBeliefStatus(this.$route.query.tab) ? this.$route.query.tab : 'open',
      affStatusMap: loadAffStatusMap(),
      sw: { openIdx: null, openDir: null, touchIdx: null, startX: 0, startY: 0, dx: 0, isH: null, drag: false },
    };
  },
  watch: {
    tab() {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.openEntry = null; this.isOriginOpen = false; this.isEmpathyOpen = false;
    },
  },
  computed: {
    beliefs() {
      const map = this.patternCountMap;
      return this.$store.getters.beliefs
        .concat()
        .sort((a, b) => ((map[b.time] || 0) - (map[a.time] || 0)) || (b.time - a.time));
    },
    filteredBeliefs() {
      return this.beliefs.filter(e => beliefStatus(e) === this.tab);
    },
    patternCountMap() {
      const map = {};
      this.$store.getters.patterns.forEach((p) => {
        (p.beliefs || []).forEach((id) => { map[id] = (map[id] || 0) + 1; });
      });
      return map;
    },
  },
  methods: {
    patternCount(beliefTime) { return this.patternCountMap[beliefTime] || 0; },
    associatedPatterns(beliefTime) {
      return this.$store.getters.patterns.filter(p => (p.beliefs || []).indexOf(beliefTime) !== -1);
    },
    toggle(time) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.openEntry = this.openEntry === time ? null : time;
      // Every belief starts with its folded sections closed again — a previous
      // tap must not carry over to the next one.
      this.isOriginOpen = false;
      this.isEmpathyOpen = false;
    },
    // The average across every situation and every evaluated experiment. Null
    // while nothing was ever rated, because a slider at zero would claim an
    // answer nobody gave.
    credibility(entry) {
      return beliefCredibility(this.$store.getters.patterns, entry);
    },
    // What this one situation recorded, as opposed to the average above.
    situationTruth(pattern, entry) { return beliefTruthIn(pattern, entry); },
    // Still a method: the template calls hasChangeData(entry) directly.
    hasChangeData(entry) { return hasChangeData(entry); },
    experimentsOf(entry) { return experimentsOf(entry); },
    experimentGap(x) { return fearGap(x); },
    experimentStateColor(x) { return stateColorOf(x); },
    experimentStateLabel(x) { return stateLabelOf(x); },
    gapColor(gap) { return fearGapColor(gap); },
    truthOf(a) { return normalizeTruth(a.resonance); },
    affStatusLabel(text) { return affirmationStatusLabel(text, this.affStatusMap); },
    affStatusColor(text) { return affirmationStatusColor(text, this.affStatusMap); },
    editPattern(p) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.$router.push(`/edit-pattern/${p.time}`);
    },
    // Editing an affirmation lives in the wandeln wizard now; from here the
    // row just opens the list it belongs to.
    openAffirmations() {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.$router.push('/affirmations');
    },
    editExperiment(entry, x) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.$router.push(`/act-belief/${entry.time}/${x.id}`);
    },
    changeEntry(entry) { this.sw.openIdx = null; this.sw.openDir = null; this.$router.push(`/change-belief/${entry.time}`); },
    actEntry(entry) { this.sw.openIdx = null; this.sw.openDir = null; this.$router.push(`/act-belief/${entry.time}`); },
    // The one step that moves this belief forward from where it stands.
    rowActionLabel(entry) {
      const s = beliefStatus(entry);
      if (s === 'open') return 'Ergründen';
      if (s === 'working') return 'Wandeln';
      if (s === 'done') return 'Handeln';
      return '';
    },
    runRowAction(entry) {
      const s = beliefStatus(entry);
      if (s === 'open') this.editEntry(entry);
      else if (s === 'working') this.changeEntry(entry);
      else if (s === 'done') this.actEntry(entry);
    },
    editEntry(entry) { this.sw.openIdx = null; this.sw.openDir = null; this.$router.push(`/edit-belief/${entry.time}`); },
    preDelete(entry) { this.sw.openIdx = null; this.sw.openDir = null; this.entryToDelete = entry; this.isDeleteDialogShowing = true; },
    confirmDelete() {
      this.isDeleteDialogShowing = false;
      this.$store.dispatch('deleteBelief', this.entryToDelete);
      this.entryToDelete = null;
    },
    cancelDelete() { this.isDeleteDialogShowing = false; this.entryToDelete = null; },
    tsStart(e, i) {
      if (e.target && e.target.closest
        && (e.target.closest('.swipe-btn') || e.target.closest('.row-action-btn'))) return;
      const t = e.touches[0];
      this.sw.touchIdx = i; this.sw.startX = t.clientX; this.sw.startY = t.clientY;
      this.sw.dx = 0; this.sw.isH = null; this.sw.drag = false;
    },
    tsMove(e, i) {
      if (this.sw.touchIdx !== i) return;
      const t = e.touches[0];
      const dx = t.clientX - this.sw.startX, dy = t.clientY - this.sw.startY;
      if (this.sw.isH === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4))
        this.sw.isH = Math.abs(dx) >= Math.abs(dy);
      if (!this.sw.isH) return;
      e.preventDefault();
      this.sw.dx = Math.max(-80, Math.min(dx, 195));
      this.sw.drag = true;
    },
    tsEnd(e, i) {
      if (this.sw.touchIdx !== i) return;
      const wasVert = this.sw.isH === false;
      if (!wasVert) e.preventDefault();
      if (!this.sw.drag && !wasVert) {
        if (this.sw.openIdx !== null) { this.sw.openIdx = null; this.sw.openDir = null; }
        else { this.onRowTap(i); }
      } else if (this.sw.drag) {
        if (this.sw.dx < -40) { this.sw.openIdx = i; this.sw.openDir = 'left'; }
        else if (this.sw.dx > 40) { this.sw.openIdx = i; this.sw.openDir = 'right'; }
        else { this.sw.openIdx = null; this.sw.openDir = null; }
        this.openEntry = null;
      }
      this.sw.touchIdx = null; this.sw.dx = 0; this.sw.drag = false; this.sw.isH = null;
    },
    rowSt(i, rw) {
      const s = this.sw;
      const live = s.touchIdx === i && s.drag && s.isH;
      let x = 0;
      if (live) x = s.dx;
      else if (s.openIdx === i) x = s.openDir === 'left' ? -80 : rw;
      return { transform: `translateX(${x}px)`, transition: live ? 'none' : 'transform 0.2s ease' };
    },
    onRowTap(i) {
      const entry = this.filteredBeliefs[i];
      if (entry) this.toggle(entry.time);
    },
    deskClick(i) {
      if (this.sw.openIdx !== null) { this.sw.openIdx = null; this.sw.openDir = null; return; }
      this.onRowTap(i);
    },
  },
};
</script>

<style scoped lang="scss">
.dark-page { background: #000; min-height: 100vh; }

/* ─── Segment tabs ─── */
.segment-row {
  display: flex;
  padding: 0 16px 16px;
  border-bottom: 1px solid #2c2c2e;
  margin-bottom: 4px;
}
.seg-tab {
  flex: 1;
  background: none;
  border: none;
  padding: 8px 2px;
  /* four tabs have to fit across a phone */
  font-size: 0.8rem;
  color: #8e8e93;
  cursor: pointer;
  position: relative;
  font-family: inherit;
  -webkit-tap-highlight-color: transparent;
  &::after {
    content: '';
    position: absolute;
    bottom: -1px; left: 0; right: 0;
    height: 2px;
    background: transparent;
    border-radius: 2px;
  }
  &.active { color: #fff; font-weight: 600; &::after { background: #4ade80; } }
}

.ios-list {
  background: #1c1c1e;
  border-radius: 12px;
  margin: 8px 16px 24px;
  overflow: hidden;
}

/* ─── Swipe rows ─── */
.swipe-outer {
  position: relative;
  overflow: hidden;
  background: #1c1c1e;
}
.swipe-right-panel {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  display: flex;
  align-items: stretch;
}
.swipe-left-panel {
  position: absolute;
  right: 0; top: 0; bottom: 0;
  display: flex;
  align-items: stretch;
}
.swipe-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-size: 0.62rem;
  font-weight: 600;
  font-family: inherit;
  color: #fff;
  width: 65px;
  padding: 0;
  gap: 3px;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.85; }
}
.swipe-btn-delete { background: #ff453a; width: 80px; }
.swipe-btn-edit { background: #636366; }
.swipe-btn-change { background: #1a5fa8; }
.swipe-btn-act { background: #7c3aed; }

.ios-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 12px 12px 12px 20px;
  background: #1c1c1e;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
  &:active { background: #2c2c2e; }
}
.row-body { flex: 1; min-width: 0; }
.row-title {
  font-size: 0.95rem;
  color: #fff;
  margin: 0 0 3px;
  white-space: normal;
  word-break: break-word;
  line-height: 1.4;
}
.row-badges { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.badge-pill {
  font-size: 0.7rem;
  color: #8e8e93;
  background: #2c2c2e;
  border-radius: 20px;
  padding: 1px 6px;
}
.row-action-btn {
  background: #4ade80;
  color: #000;
  border: none;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 0.8125rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 8px;
  -webkit-tap-highlight-color: transparent;
  &:active { background: #3dcc70; transform: scale(0.97); }
}
.row-chevron {
  color: #636366 !important;
  font-size: 1.2rem !important;
  transition: transform 0.2s ease;
  margin-left: 2px;
  flex-shrink: 0;
  &.rotated { transform: rotate(90deg); }
}

.ios-sep { height: 1px; background: #2c2c2e; margin-left: 20px; }

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
  margin: 0 0 4px;
  font-weight: 600;
}
/* Folded sections carry the same label as the open ones — only the chevron
   says that there is more behind it. */
.section-toggle {
  display: flex;
  align-items: center;
  margin-top: 14px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.section-toggle-label {
  font-size: 0.68rem;
  color: #8e8e93;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}
.section-chevron { color: #636366 !important; margin-left: 2px; }
.expand-text { font-size: 0.93rem; color: #ebebf5; margin: 0; line-height: 1.5; }
.empathy-text { white-space: pre-wrap; }
.experiment-gap { display: block; font-size: 0.78rem; color: #8e8e93; margin: 2px 0 0; }

/* Shows a recorded value — deliberately not interactive. */
.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 2px 4px 0;
}
.slider-end-label {
  font-size: 0.72rem;
  color: #636366;
  flex-shrink: 0;
}
.readonly-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #3a3a3c;
  outline: none;
  opacity: 1;
  pointer-events: none;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4ade80;
  }
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: #4ade80;
  }
}

.linked-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
  border-top: 1px solid #2c2c2e;
  -webkit-tap-highlight-color: transparent;
  &:first-of-type { border-top: none; }
  &:active { opacity: 0.6; }
}
.linked-row-body { flex: 1; min-width: 0; }
.status-pill {
  display: inline-block;
  margin-top: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  background: #2c2c2e;
  border-radius: 20px;
  padding: 1px 8px;
}
.linked-chevron {
  color: #636366 !important;
  font-size: 1.1rem !important;
  flex-shrink: 0;
  margin-left: 6px;
}
.chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
.mt-3 { margin-top: 12px !important; }
.mt-2 { margin-top: 8px !important; }
.mb-1 { margin-bottom: 4px !important; }
.mb-2 { margin-bottom: 8px !important; }

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 5rem 2rem; text-align: center;
}
.empty-icon { font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 16px; }
.empty-title { font-size: 1.1rem; color: #fff; font-weight: 600; margin: 0 0 6px; }
.empty-sub { font-size: 0.875rem; color: #8e8e93; margin: 0; }

.confirm-dialog { border-radius: 14px !important; overflow: hidden; }
.confirm-title {
  font-size: 1rem !important; font-weight: 600 !important; color: #fff !important;
  justify-content: center !important; padding: 16px !important;
}
.confirm-actions { padding: 0 !important; display: flex; }
.confirm-cancel { flex: 1; color: #4ade80 !important; border-right: 1px solid #3a3a3c; }
.confirm-delete { flex: 1; color: #ff453a !important; font-weight: 600 !important; }

.dark-nav { border-top: 1px solid #2c2c2e !important; }
</style>
