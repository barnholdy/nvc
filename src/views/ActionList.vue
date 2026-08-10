<template>
  <div class="dark-page">
    <v-content>
      <div class="screen-title-row">
        <h1 class="screen-title">Handlungen</h1>
        <div class="screen-actions">
          <button class="screen-add" @click="$router.push('/add-action')" aria-label="Neue Handlung">+</button>
          <button class="screen-add" @click="$router.push('/settings')" aria-label="Einstellungen">
            <v-icon color="#4ade80">settings</v-icon>
          </button>
        </div>
      </div>

      <div v-if="filterBeliefs.length > 1" class="pill-row">
        <button
          class="pill"
          :class="{ active: beliefFilter === null }"
          @click="beliefFilter = null"
        >Alle</button>
        <button
          v-for="b in filterBeliefs"
          :key="b.time"
          class="pill"
          :class="{ active: beliefFilter === b.time }"
          @click="beliefFilter = b.time"
        >„{{ b.belief }}“</button>
      </div>

      <div class="pill-row">
        <button
          v-for="f in filters"
          :key="f.key"
          class="pill"
          :class="{ active: tab === f.key }"
          @click="tab = f.key"
        >{{ f.label }}<span class="pill-count"> · {{ f.count }}</span></button>
      </div>

      <div v-if="filteredRows.length === 0" class="list-empty">
        <span class="list-empty-icon">🎯</span>
        <p class="list-empty-title">Keine Einträge</p>
        <p class="list-empty-sub">{{ emptyText }}</p>
      </div>

      <div
        v-for="(row, i) in filteredRows"
        :key="row.experiment.id"
        class="swipe-outer"
        :data-row-id="row.experiment.id"
      >
        <div v-if="sw.openIdx === i || sw.touchIdx === i" class="swipe-right-panel">
          <button class="swipe-btn swipe-btn-edit" @click.stop="editExperiment(row)">
            <v-icon small color="#fff">edit</v-icon>
            <span>Planen</span>
          </button>
          <!-- Nothing to compare against until an anchor exists -->
          <button
            v-if="!needsPlan(row.experiment)"
            class="swipe-btn swipe-btn-evaluate"
            @click.stop="startResult(row)"
          >
            <v-icon small color="#fff">assessment</v-icon>
            <span>Auswerten</span>
          </button>
        </div>
        <div v-if="sw.openIdx === i || sw.touchIdx === i" class="swipe-left-panel">
          <button class="swipe-btn swipe-btn-delete" @click.stop="preDelete(row)">
            <v-icon small color="#fff">delete</v-icon>
            <span>Löschen</span>
          </button>
        </div>

        <div class="card" :style="rowSt(i)">
          <div
            class="card-head swipe-handle"
            @touchstart="tsStart($event, i)"
            @touchmove="tsMove($event, i)"
            @touchend="tsEnd($event, i)"
          >
            <p class="card-title">{{ row.experiment.situation || 'Ohne Situation' }}</p>
            <button
              v-if="needsPlan(row.experiment)"
              class="card-btn"
              @click.stop="editExperiment(row)"
            >Planen</button>
            <button
              v-else-if="displayState(row.experiment) === 'planned'"
              class="card-btn"
              @click.stop="startResult(row)"
            >Auswerten</button>
          </div>
          <span class="card-pill">{{ stateLine(row.experiment) }}</span>
          <p v-if="isDue(row.experiment)" class="due-hint">Schon durchgeführt?</p>

          <!-- What was feared against what happened, as one bar: the orange
               reaches as far as the fear did, the blue as far as reality. -->
          <template v-if="gapOf(row.experiment) !== null">
            <div class="gap-bar">
              <span
                class="gap-fill gap-expected"
                :style="{ width: pct(row.experiment.fearExpected) }"
              ></span>
              <span
                class="gap-fill gap-real"
                :style="{ width: pct(row.experiment.fearActual) }"
              ></span>
            </div>
            <div class="gap-legend">
              <span class="gap-key"><i class="gap-dot gap-dot-expected"></i>erwartet {{ row.experiment.fearExpected }}</span>
              <span class="gap-key"><i class="gap-dot gap-dot-real"></i>real {{ row.experiment.fearActual }}</span>
              <span class="gap-delta" :style="{ color: gapColor(gapOf(row.experiment)) }">
                {{ gapOf(row.experiment) > 0 ? '−' : '+' }}{{ Math.abs(gapOf(row.experiment)) }}
              </span>
            </div>
          </template>
          <template v-else-if="row.experiment.fearExpected !== null">
            <div class="gap-bar">
              <span
                class="gap-fill gap-expected"
                :style="{ width: pct(row.experiment.fearExpected) }"
              ></span>
            </div>
            <div class="gap-legend">
              <span class="gap-key"><i class="gap-dot gap-dot-expected"></i>erwartet {{ row.experiment.fearExpected }}</span>
            </div>
          </template>

          <div class="card-sep"></div>

          <div
            v-if="row.experiment.fear"
            class="detail-row"
            :class="{ open: isOpen(row, 'fear') }"
            @click.stop="toggleRow(row, 'fear')"
          >
            <span class="detail-label">Befürchtung</span>
            <p class="detail-value" :class="{ open: isOpen(row, 'fear') }">{{ row.experiment.fear }}</p>
            <v-icon v-if="!isOpen(row, 'fear')" class="detail-chevron">chevron_right</v-icon>
          </div>

          <div
            v-if="row.experiment.outcome"
            class="detail-row"
            :class="{ open: isOpen(row, 'outcome') }"
            @click.stop="toggleRow(row, 'outcome')"
          >
            <span class="detail-label">Was passiert ist</span>
            <p class="detail-value" :class="{ open: isOpen(row, 'outcome') }">{{ row.experiment.outcome }}</p>
            <v-icon v-if="!isOpen(row, 'outcome')" class="detail-chevron">chevron_right</v-icon>
          </div>

          <div
            v-if="row.experiment.learning"
            class="detail-row"
            :class="{ open: isOpen(row, 'learning') }"
            @click.stop="toggleRow(row, 'learning')"
          >
            <span class="detail-label">Was sagt dir das?</span>
            <p class="detail-value" :class="{ open: isOpen(row, 'learning') }">{{ row.experiment.learning }}</p>
            <v-icon v-if="!isOpen(row, 'learning')" class="detail-chevron">chevron_right</v-icon>
          </div>

          <div
            v-if="affirmationOf(row)"
            class="aff-box"
            @click.stop="openAffirmation(row)"
          >
            <p class="aff-label">Affirmation</p>
            <p class="aff-text">„{{ affirmationOf(row) }}“</p>
            <div class="aff-foot" v-if="affirmationTruth(row) !== null">
              <span class="aff-score">
                <span class="aff-value">{{ round(affirmationTruth(row)) }}</span>
                <span class="aff-max">/10</span>
                <span class="aff-word">Glaubwürdigkeit</span>
              </span>
            </div>
          </div>

          <!-- The belief under test, kept at the foot of the card: the run is
               the subject here, the belief is what it is aimed at. -->
          <div class="belief-chip" @click.stop="openBelief(row)">
            <span class="belief-chip-text">„{{ row.beliefText }}“</span>
            <span v-if="beliefTruth(row) !== null" class="belief-chip-score">
              {{ round(beliefTruth(row)) }}/10
            </span>
          </div>
        </div>
      </div>

      <div class="list-bottom-space"></div>

      <!-- Step 4: result and comparison -->
      <v-dialog v-model="isResultDialogShowing" fullscreen>
        <div v-if="isResultDialogShowing" class="wizard-page">
          <!-- A real toolbar, minus the `app` prop: inside a dialog that would
               register with the page layout behind it. -->
          <v-toolbar color="#000" dark flat class="wizard-bar">
            <v-btn icon @click="resultStep === 1 ? cancelResult() : resultStep--">
              <v-icon>{{ resultStep === 1 ? 'close' : 'chevron_left' }}</v-icon>
            </v-btn>
            <v-toolbar-title>Handlung auswerten</v-toolbar-title>
            <v-spacer></v-spacer>
            <span class="grey--text body-1">{{ resultStep }} / 4</span>
          </v-toolbar>
          <div class="wizard-scroll">
            <v-container class="mb-5">
              <!-- Facts first, deliberately before any rating -->
              <v-layout v-show="resultStep === 1" column>
                <v-flex class="mt-2 mb-3">
                  <h1 class="headline font-weight-regular">Was ist passiert?</h1>
                  <belief-context :situation="resultSituation"></belief-context>
                  <p class="body-1 grey--text mt-2 wizard-prompt">
                    Was ist tatsächlich passiert? Beschreibe es, bevor du es bewertest.
                  </p>
                </v-flex>
                <v-flex>
                  <v-textarea v-model="resultOutcome" placeholder="..." auto-grow rows="6" hide-details></v-textarea>
                </v-flex>
              </v-layout>

              <!-- The fear is shown again: rating it from memory is guesswork -->
              <v-layout v-show="resultStep === 2" column>
                <v-flex class="mt-2 mb-3">
                  <h1 class="headline font-weight-regular">Abgleich</h1>
                  <belief-context :situation="resultSituation"></belief-context>
                </v-flex>

                <!-- The fear itself, but not the number: seeing the old rating
                     would anchor the new one. -->
                <experiment-recall
                  :fear="resultFear"
                  :outcome="resultOutcome"
                ></experiment-recall>

                <v-flex>
                  <p class="body-1 grey--text mb-2 wizard-prompt">
                    Wie stark ist deine Befürchtung tatsächlich eingetreten?
                  </p>
                  <div class="slider-row">
                    <span class="slider-end-label">0</span>
                    <input type="range" min="0" max="10" v-model.number="resultActual" class="fear-slider" />
                    <span class="slider-end-label">10</span>
                  </div>
                  <p class="slider-value-label">{{ resultActual }}</p>
                  <div class="scale-legend">
                    <span>0 = gar nicht</span>
                    <span>10 = genau so schlimm wie erwartet</span>
                  </div>
                </v-flex>
              </v-layout>

              <v-layout v-show="resultStep === 3" column>
                <v-flex class="mt-2 mb-3">
                  <h1 class="headline font-weight-regular">Reflexion</h1>
                  <belief-context :situation="resultSituation"></belief-context>
                </v-flex>

                <experiment-recall
                  :fear="resultFear"
                  :outcome="resultOutcome"
                ></experiment-recall>

                <v-flex>
                  <div class="gap-box" :style="{ borderColor: gapColor(resultGap) }">
                    <p class="gap-line">
                      Deine Erwartung war
                      <span class="gap-num">{{ resultExpected }}</span>,
                      real waren es
                      <span class="gap-num" :style="{ color: gapColor(resultGap) }">{{ resultActual }}</span>.
                    </p>
                    <p class="gap-delta" :style="{ color: gapColor(resultGap) }">
                      <template v-if="resultGap > 0">{{ resultGap }} Punkte weniger schlimm als befürchtet</template>
                      <template v-else-if="resultGap === 0">Genau wie befürchtet</template>
                      <template v-else>{{ Math.abs(resultGap) }} Punkte schlimmer als befürchtet</template>
                    </p>
                  </div>
                  <p class="body-1 grey--text mt-4 mb-2 wizard-prompt">Was sagt dir das?</p>
                  <v-textarea
                    v-model="resultLearning"
                    placeholder="..."
                    auto-grow
                    rows="4"
                    hide-details
                  ></v-textarea>
                </v-flex>
              </v-layout>

              <v-layout v-show="resultStep === 4" column>
                <v-flex class="mt-2 mb-3">
                  <h1 class="headline font-weight-regular">Affirmation</h1>
                  <belief-context :situation="resultSituation"></belief-context>
                </v-flex>

                <experiment-recall
                  :fear="resultFear"
                  :outcome="resultOutcome"
                ></experiment-recall>

                <!-- The measurement and what it meant, before asking what the
                     body makes of it. -->
                <v-flex class="mb-3">
                  <div class="gap-box" :style="{ borderColor: gapColor(resultGap) }">
                    <p class="gap-line">
                      Deine Erwartung war
                      <span class="gap-num">{{ resultExpected }}</span>,
                      real waren es
                      <span class="gap-num" :style="{ color: gapColor(resultGap) }">{{ resultActual }}</span>.
                    </p>
                    <p class="gap-delta" :style="{ color: gapColor(resultGap) }">
                      <template v-if="resultGap > 0">{{ resultGap }} Punkte weniger schlimm als befürchtet</template>
                      <template v-else-if="resultGap === 0">Genau wie befürchtet</template>
                      <template v-else>{{ Math.abs(resultGap) }} Punkte schlimmer als befürchtet</template>
                    </p>
                  </div>
                  <template v-if="resultLearning.trim()">
                    <p class="expand-label mt-3">Das sagt mir</p>
                    <p class="recall-text">{{ resultLearning }}</p>
                  </template>
                </v-flex>

                <v-flex class="mb-3">
                  <p class="body-1 grey--text wizard-prompt">
                    Fühle in dich hinein. Für wie glaubwürdig hält dein Körper die Sätze?
                  </p>
                </v-flex>

                <!-- Two scales, not one: the old sentence can lose credibility
                     without the new one gaining any, and a single slider
                     between them could not say that. -->
                <v-flex v-if="resultAffirmationText" class="mb-3">
                  <p class="expand-label">Glaubwürdigkeit Überzeugung</p>
                  <p class="pole">{{ resultBeliefText }}</p>
                  <div class="slider-row">
                    <span class="slider-end-label">0</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      v-model.number="resultBeliefTruth"
                      class="fear-slider"
                    />
                    <span class="slider-end-label">10</span>
                  </div>
                  <p class="slider-value-label">{{ resultBeliefTruth }}</p>

                  <p class="expand-label mt-3">Glaubwürdigkeit Affirmation</p>
                  <p class="pole">{{ resultAffirmationText }}</p>
                  <div class="slider-row">
                    <span class="slider-end-label">0</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      v-model.number="resultAffirmationTruth"
                      class="fear-slider"
                    />
                    <span class="slider-end-label">10</span>
                  </div>
                  <p class="slider-value-label">{{ resultAffirmationTruth }}</p>
                </v-flex>
                <v-flex v-else>
                  <p class="empty-hint">
                    Diese Überzeugung hat noch keine Affirmation — du findest sie im Wizard
                    „Überzeugung wandeln“.
                  </p>
                </v-flex>

              </v-layout>
            </v-container>
          </div>
          <v-footer color="white elevation-3" height="44" class="wizard-footer">
            <v-btn
              v-if="resultStep < 4"
              :disabled="resultStep === 1 && !resultOutcome.trim()"
              @click="resultStep += 1"
              block large color="primary"
            >weiter</v-btn>
            <v-btn v-else @click="saveResult" block large color="primary">speichern</v-btn>
          </v-footer>
        </div>
      </v-dialog>

      <v-dialog v-model="isDeleteDialogShowing" width="300">
        <v-card class="confirm-dialog">
          <v-card-title class="confirm-title">Experiment löschen?</v-card-title>
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
      <v-btn flat color="grey" to="/affirmations">
        <v-icon>flare</v-icon>
      </v-btn>
      <v-btn flat color="primary" to="/actions">
        <v-icon>gps_fixed</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import moment from 'moment';
import ExperimentRecall from '@/views/ExperimentRecall.vue';
import BeliefContext from '@/views/BeliefContext.vue';
import {
  EXPERIMENT_DISPLAY_STATES,
  EXPERIMENT_DISPLAY_LABELS,
  collectExperiments,
  experimentsOf,
  experimentDisplayState,
  isExperimentDisplayState,
  experimentState,
  fearGap,
  fearGapColor,
  isDue,
  isPlanned,
} from '@/utils/experiment';
import { beliefCredibility, affirmationCredibility } from '@/utils/credibility';
import { beliefStatusLabel, beliefStatusColor } from '@/utils/beliefStatus';
import { openQuery, requestedId, scrollRowIntoView } from '@/utils/reveal';

function triggerConfetti() {
  var canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  if (!ctx) { document.body.removeChild(canvas); return; }
  var COLORS = ['#4ade80', '#f9e02e', '#ff6b6b', '#60c5f9', '#c084fc', '#fb923c'];
  var cx = canvas.width / 2, cy = canvas.height * 0.55;
  var particles = [];
  for (var i = 0; i < 72; i++) {
    var angle = Math.PI * 2 * i / 72 + (Math.random() - 0.5) * 0.4;
    var speed = 4 + Math.random() * 8;
    particles.push({ x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 3,
      w: 4 + Math.random() * 7, h: 2 + Math.random() * 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.3 });
  }
  var start = null, dur = 1500;
  function frame(ts) {
    if (!start) start = ts;
    var t = ts - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(function(p) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.vx *= 0.99; p.rot += p.vr;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t / dur);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    });
    if (t < dur) { requestAnimationFrame(frame); }
    else { if (canvas.parentNode) canvas.parentNode.removeChild(canvas); }
  }
  requestAnimationFrame(frame);
}

export default {
  name: 'action-list',
  components: { ExperimentRecall, BeliefContext },
  data() {
    return {
      // Planned experiments are the ones waiting on you, so they open first;
      // a wizard can send you straight to a specific tab with ?tab=.
      tab: isExperimentDisplayState(this.$route.query.tab)
        ? this.$route.query.tab
        : 'all',
      // Which written answer is unfolded, keyed by experiment and row: every
      // card is open at once now, so one shared index would not do.
      openRows: {},
      beliefFilter: null,
      sw: { openIdx: null, openDir: null, touchIdx: null, startX: 0, startY: 0, dx: 0, isH: null, drag: false },
      now: Date.now(),
      isResultDialogShowing: false,
      resultRow: null,
      resultStep: 1,
      resultOutcome: '',
      resultActual: 5,
      resultLearning: '',
      // 0 = the old belief still holds, 100 = the affirmation does.
      resultBeliefTruth: 5,
      resultAffirmationTruth: 5,
      rowToDelete: null,
      isDeleteDialogShowing: false,
    };
  },
  watch: {
    '$route.query.open': function() { this.revealRequested(); },
    '$route.query.belief': function() { this.applyBeliefQuery(); },
    tab() { this.sw.openIdx = null; this.sw.openDir = null; },
    beliefFilter() { this.sw.openIdx = null; this.sw.openDir = null; },
  },
  computed: {
    rows() {
      return collectExperiments(this.$store.getters.beliefs);
    },
    // Both filters apply: a belief narrows which runs are in play, the state
    // narrows how far along they are.
    byBelief() {
      if (this.beliefFilter === null) return this.rows;
      return this.rows.filter(r => r.beliefTime === this.beliefFilter);
    },
    filteredRows() {
      const tab = this.tab;
      if (tab === 'all') return this.byBelief;
      return this.byBelief.filter(function(row) {
        return experimentDisplayState(row.experiment) === tab;
      });
    },
    // Only beliefs that actually carry a run can filter one.
    filterBeliefs() {
      const seen = {};
      const out = [];
      this.rows.forEach((r) => {
        if (seen[r.beliefTime]) return;
        seen[r.beliefTime] = true;
        out.push({ time: r.beliefTime, belief: r.beliefText });
      });
      return out;
    },
    filters() {
      const rows = this.byBelief;
      const all = { key: 'all', label: 'Alle', count: rows.length };
      return [all].concat(EXPERIMENT_DISPLAY_STATES.map(key => ({
        key,
        label: EXPERIMENT_DISPLAY_LABELS[key],
        count: rows.filter(r => experimentDisplayState(r.experiment) === key).length,
      })));
    },
    emptyText() {
      if (this.tab === 'open') return 'Neu ist hier nur, was noch keine Befürchtung hat.';
      if (this.tab === 'planned') return 'Noch kein Experiment geplant.';
      if (this.tab === 'done') return 'Noch kein Experiment ausgewertet.';
      return 'Noch keine Handlung angelegt.';
    },
    resultSituation() {
      return this.resultRow ? this.resultRow.experiment.situation : '';
    },
    resultExpected() {
      return this.resultRow ? this.resultRow.experiment.fearExpected : null;
    },
    resultFear() {
      return this.resultRow ? this.resultRow.experiment.fear : '';
    },
    // The belief's own affirmation — the other end of the scale.
    resultAffirmationText() {
      const list = (this.resultRow ? (this.beliefOf(this.resultRow) || {}).affirmations : []) || [];
      return list.map(a => a && a.text).filter(Boolean).join(' · ');
    },
    resultBeliefText() {
      return this.resultRow ? this.resultRow.beliefText : '';
    },
    resultGap() {
      if (this.resultExpected === null) return 0;
      return this.resultExpected - this.resultActual;
    },
  },
  mounted() {
    this.applyBeliefQuery();
    this.revealRequested();
  },
  methods: {
    state(x) { return experimentState(x); },
    displayState(x) { return experimentDisplayState(x); },
    gapOf(x) { return fearGap(x); },
    gapColor(gap) { return fearGapColor(gap); },
    isDue(x) { return isDue(x, this.now); },
    // A migrated action has a situation but no anchor — it cannot be evaluated.
    needsPlan(x) { return experimentState(x) !== 'evaluated' && !isPlanned(x); },
    isOpen(row, key) { return !!this.openRows[`${row.experiment.id}:${key}`]; },
    toggleRow(row, key) {
      const k = `${row.experiment.id}:${key}`;
      this.openRows = Object.assign({}, this.openRows, { [k]: !this.openRows[k] });
    },
    // One decimal, and a German comma: the headline number is the only
    // place this value is shown, so rounding it whole would hide half a
    // point that was actually recorded.
    round(v) {
      if (v === null || v === undefined) return '';
      return String(Math.round(v * 10) / 10).replace('.', ',');
    },
    // The bar is drawn on the 0-10 fear scale.
    pct(v) { return `${Math.max(0, Math.min(10, v || 0)) * 10}%`; },
    // State and, once it is finished, when — a run is identified as much by
    // its date as by how far it got.
    stateLine(x) {
      const label = EXPERIMENT_DISPLAY_LABELS[experimentDisplayState(x)];
      const at = x.completedAt || x.doneAt || x.plannedAt;
      return at ? `${label} · ${this.shortDate(at)}` : label;
    },
    shortDate(ts) {
      moment.locale('de');
      return moment(ts).format('D. MMM');
    },

    // Writes the changed experiment back into its belief, matched by id.
    // beliefChanges rides along in the SAME dispatch: two separate updates would
    // both build from the same starting belief, and the second would silently
    // undo the first.
    persist(row, changes, beliefChanges) {
      const belief = this.$store.getters.beliefs.find(b => b.time === row.beliefTime);
      if (!belief) return;
      const r = belief.reflection || {};
      const list = experimentsOf(belief).map((x) => {
        if (x.id !== row.experiment.id) return x;
        return Object.assign({}, x, changes);
      });
      this.$store.dispatch('updateBelief', Object.assign({}, belief, beliefChanges || {}, {
        reflection: Object.assign({}, r, { experiments: list }),
      }));
    },

    startResult(row) {
      this.resultRow = row;
      this.resultStep = 1;
      this.resultOutcome = row.experiment.outcome || '';
      this.resultActual = typeof row.experiment.fearActual === 'number' ? row.experiment.fearActual : 5;
      this.resultLearning = row.experiment.learning || '';
      this.resultBeliefTruth = typeof row.experiment.beliefTruth === 'number'
        ? row.experiment.beliefTruth
        : 5;
      this.resultAffirmationTruth = typeof row.experiment.affirmationTruth === 'number'
        ? row.experiment.affirmationTruth
        : 5;
      this.isResultDialogShowing = true;
    },
    cancelResult() {
      this.isResultDialogShowing = false;
      this.resultRow = null;
      this.resultStep = 1;
      this.resultOutcome = '';
      this.resultActual = 50;
      this.resultLearning = '';
      this.resultBeliefTruth = 5;
      this.resultAffirmationTruth = 5;
    },
    // The belief's own standing, the same number its row shows in the belief
    // list. The reading this experiment took is shown further down, separately.
    beliefTruth(row) {
      return beliefCredibility(this.$store.getters.patterns, this.beliefOf(row));
    },
    beliefStatusLabel(belief) { return beliefStatusLabel(belief); },
    beliefStatusColor(belief) { return beliefStatusColor(belief); },
    openBelief(row) {
      this.$router.push({ path: '/beliefs', query: openQuery(row.beliefTime) });
    },
    // One affirmation per belief, so the first is the one — but experiments
    // written before that rule can name their own, and that one wins.
    affirmationOf(row) {
      const named = row && row.experiment && row.experiment.affirmationText;
      if (named) return named;
      const list = ((this.beliefOf(row) || {}).affirmations) || [];
      const first = list.find(a => a && a.text);
      return first ? first.text : '';
    },
    // The sentence's own standing across everything it was rated in, the same
    // number the Affirmationen list shows.
    affirmationTruth(row) {
      const text = this.affirmationOf(row);
      if (!text) return null;
      return affirmationCredibility(this.$store.getters.beliefs, text);
    },
    openAffirmation(row) {
      const text = this.affirmationOf(row);
      if (!text) return;
      this.$router.push({ path: '/affirmations', query: openQuery(text) });
    },
    // Coming from a belief card: select its chip and scroll the row so the
    // selection is visible rather than off to the right.
    applyBeliefQuery() {
      const raw = this.$route.query.belief;
      if (!raw) return;
      const time = parseInt(raw, 10);
      if (!this.filterBeliefs.some(b => b.time === time)) return;
      this.beliefFilter = time;
      this.tab = 'all';
      this.$nextTick(() => {
        const el = this.$el.querySelector('.pill.active');
        if (el && el.scrollIntoView) {
          el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        }
      });
    },
    // Only the card head answers a swipe; the rest of the card scrolls.
    tsStart(e, i) {
      if (e.target && e.target.closest && e.target.closest('.card-btn')) return;
      const t = e.touches[0];
      this.sw.touchIdx = i; this.sw.startX = t.clientX; this.sw.startY = t.clientY;
      this.sw.dx = 0; this.sw.isH = null; this.sw.drag = false;
    },
    tsMove(e, i) {
      if (this.sw.touchIdx !== i) return;
      const t = e.touches[0];
      const dx = t.clientX - this.sw.startX, dy = t.clientY - this.sw.startY;
      if (this.sw.isH === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8))
        this.sw.isH = Math.abs(dx) > Math.abs(dy) * 1.5;
      if (!this.sw.isH) return;
      e.preventDefault();
      this.sw.dx = Math.max(-80, Math.min(dx, this.rightWidth(i)));
      this.sw.drag = true;
    },
    tsEnd(e, i) {
      if (this.sw.touchIdx !== i) return;
      if (this.sw.drag) {
        if (this.sw.dx < -40) { this.sw.openIdx = i; this.sw.openDir = 'left'; }
        else if (this.sw.dx > 40) { this.sw.openIdx = i; this.sw.openDir = 'right'; }
        else { this.sw.openIdx = null; this.sw.openDir = null; }
      } else if (this.sw.openIdx !== null) {
        this.sw.openIdx = null; this.sw.openDir = null;
      }
      this.sw.touchIdx = null; this.sw.dx = 0; this.sw.drag = false; this.sw.isH = null;
    },
    // Keep in step with the buttons rendered above: a mismatch makes the card
    // spring back before the second one can be tapped.
    rightWidth(i) {
      const row = this.filteredRows[i];
      return row && !this.needsPlan(row.experiment) ? 130 : 65;
    },
    rowSt(i) {
      const s = this.sw;
      const live = s.touchIdx === i && s.drag && s.isH;
      let x = 0;
      if (live) x = s.dx;
      else if (s.openIdx === i) x = s.openDir === 'left' ? -80 : this.rightWidth(i);
      return { transform: `translateX(${x}px)`, transition: live ? 'none' : 'transform 0.2s ease' };
    },
    revealRequested() {
      const id = requestedId(this.$route);
      if (!id) return;
      const row = this.rows.find(r => String(r.experiment.id) === id);
      if (!row) return;
      this.tab = 'all';
      this.beliefFilter = null;
      this.$nextTick(() => scrollRowIntoView(this.$el, id));
    },
    beliefOf(row) {
      return this.$store.getters.beliefs.find(b => b.time === row.beliefTime);
    },
    saveResult() {
      const row = this.resultRow;
      const now = Date.now();
      const changes = {
        outcome: this.resultOutcome.trim(),
        fearActual: this.resultActual,
        learning: this.resultLearning.trim(),
        // Evaluating implies it was carried out. Without this the belief would
        // never count as acted on, which keys off doneAt — and that is one of
        // the two ways it reaches "Gewandelt".
        doneAt: (row && row.experiment.doneAt) || now,
        completedAt: now,
        // How credible each sentence is after the experiment, on its own scale.
        beliefTruth: this.resultBeliefTruth,
        affirmationTruth: this.resultAffirmationTruth,
        // Which affirmation was rated — the belief's may be replaced later.
        affirmationText: this.resultAffirmationText,
      };
      this.cancelResult();
      if (row) {
        this.persist(row, changes);
        this.tab = 'done';
        triggerConfetti();
      }
    },

    // Same wizard as "Handeln" on a belief, so there is one place to edit an
    // experiment.
    editExperiment(row) {
      this.$router.push(`/act-belief/${row.beliefTime}/${row.experiment.id}`);
    },
    dateLabel(ts) {
      if (!ts) return '—';
      moment.locale('de');
      return moment(ts).format('D. MMMM YYYY');
    },

    preDelete(row) {
      this.rowToDelete = row;
      this.isDeleteDialogShowing = true;
    },
    cancelDelete() { this.isDeleteDialogShowing = false; this.rowToDelete = null; },
    confirmDelete() {
      const row = this.rowToDelete;
      this.isDeleteDialogShowing = false;
      this.rowToDelete = null;
      if (!row) return;
      const belief = this.$store.getters.beliefs.find(b => b.time === row.beliefTime);
      if (!belief) return;
      const r = belief.reflection || {};
      // Matched by id, so two experiments with the same situation text stay distinct.
      const list = experimentsOf(belief).filter(x => x.id !== row.experiment.id);
      this.$store.dispatch('updateBelief', Object.assign({}, belief, {
        reflection: Object.assign({}, r, { experiments: list }),
      }));
    },
  },
};
</script>

<style scoped lang="scss">
.dark-page { background: #000; min-height: 100vh; }

/* ─── Swipe rows ─── */

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
.gap-pill { font-weight: 600; }
.check-meta {
  font-size: 0.75rem;
  color: #8e8e93;
  margin: 4px 0 0;
  font-style: italic;
}
.due-hint {
  font-size: 0.78rem;
  color: #fd9927;
  font-weight: 600;
  margin: 4px 0 0;
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
.expand-text { font-size: 0.93rem; color: #ebebf5; margin: 0; line-height: 1.5; }
.expand-meta { font-size: 0.78rem; color: #8e8e93; margin: 2px 0 0; }
.mb-1 { margin-bottom: 4px !important; }
.mt-3 { margin-top: 12px !important; }
/* The belief this experiment tests, shown the way the Situationen list shows
   one — tappable, with its standing and its credibility. */
.belief-row {
  display: flex;
  align-items: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
.belief-row-body { flex: 1; min-width: 0; }
.belief-chevron {
  color: #636366 !important;
  font-size: 1.1rem !important;
  flex-shrink: 0;
  margin-left: 6px;
}
.status-pill {
  display: inline-block;
  margin-top: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  background: #2c2c2e;
  border-radius: 20px;
  padding: 1px 8px;
}

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 5rem 2rem; text-align: center;
}
.empty-icon { font-size: 3rem; opacity: 0.3; display: block; margin-bottom: 16px; }
.empty-title { font-size: 1.1rem; color: #fff; font-weight: 600; margin: 0 0 6px; }
.empty-sub { font-size: 0.875rem; color: #8e8e93; margin: 0; }

// Toolbar and footer stay put, the middle scrolls. Without this the later steps
// are simply cut off at the bottom of the screen with no way to reach them.
.wizard-page {
  background: #000;
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
}
// Neither may shrink: the middle scrolls, these two stay put.
.wizard-bar { flex-shrink: 0; }
.wizard-scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.wizard-footer { flex-shrink: 0; }

.pole {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #ebebf5;
  margin: 0 0 6px;
}
.empty-hint {
  font-size: 0.875rem;
  color: #8e8e93;
  line-height: 1.5;
  margin: 0;
}
.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px;
}
.slider-end-label {
  font-size: 0.78rem;
  color: #8e8e93;
  flex-shrink: 0;
}
.fear-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 2px;
  background: #3a3a3c;
  outline: none;
  cursor: pointer;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #4ade80;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }
  &::-moz-range-thumb {
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 50%;
    background: #4ade80;
    cursor: pointer;
  }
}
/* Shows a recorded value — deliberately not interactive. */
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
.slider-value-label {
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 8px 0 0;
}
.scale-legend {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: #636366;
  margin-top: 2px;
}

/* Same chip look as the affirmation step of the change wizard */
.selected-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.selected-chip {
  white-space: normal;
  height: auto !important;
  padding: 4px 10px !important;
}
.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.available-chip {
  cursor: pointer;
  white-space: normal;
  height: auto !important;
  padding: 4px 10px !important;
}

.gap-box {
  padding: 14px;
  border-radius: 12px;
  border: 1.5px solid;
  transition: border-color 0.2s ease;
}
.gap-line { font-size: 0.95rem; color: #ebebf5; margin: 0; line-height: 1.5; }
.gap-num { font-weight: 700; }
.gap-delta { font-size: 0.875rem; font-weight: 600; margin: 6px 0 0; }

.confirm-dialog { border-radius: 14px !important; overflow: hidden; }
.confirm-title {
  font-size: 1rem !important; font-weight: 600 !important; color: #fff !important;
  justify-content: center !important; padding: 16px !important;
}
.confirm-actions { padding: 0 !important; display: flex; }
.confirm-cancel { flex: 1; color: #4ade80 !important; border-right: 1px solid #3a3a3c; }
.confirm-delete { flex: 1; color: #ff453a !important; font-weight: 600 !important; }

.dark-nav { border-top: 1px solid #2c2c2e !important; }

/* ─── Card list ─── */
.swipe-outer {
  position: relative;
  overflow: hidden;
  margin-bottom: 16px;
}
.swipe-outer .card { margin-bottom: 0; }
.swipe-right-panel {
  position: absolute;
  left: 16px; top: 0; bottom: 0;
  display: flex;
  align-items: stretch;
}
.swipe-left-panel {
  position: absolute;
  right: 16px; top: 0; bottom: 0;
  display: flex;
  align-items: stretch;
}
.swipe-btn {
  width: 65px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border: none;
  color: #fff;
  font-size: 0.7rem;
  font-family: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.swipe-btn-edit { background: #636366; border-radius: 20px 0 0 20px; }
.swipe-btn-evaluate { background: #2f7a52; border-radius: 0 20px 20px 0; }
.swipe-btn-delete { background: #ff453a; width: 80px; border-radius: 20px; }
.swipe-handle { touch-action: pan-y; }

.due-hint { font-size: 0.85rem; color: #fd9927; margin: 10px 0 0; }

/* One track, two fills: the fear laid over what reality turned out to be, so
   the difference is the part of the bar that is only orange. */
.gap-bar {
  position: relative;
  height: 10px;
  border-radius: 999px;
  background: #2c2c2e;
  margin-top: 16px;
  overflow: hidden;
}
.gap-fill {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  border-radius: 999px;
}
.gap-expected { background: #fd9927; }
.gap-real { background: #6aaef7; }
.gap-legend {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 10px;
  font-size: 0.85rem;
  color: #8e8e93;
}
.gap-key { display: flex; align-items: center; gap: 6px; }
.gap-dot { width: 9px; height: 9px; border-radius: 3px; display: inline-block; }
.gap-dot-expected { background: #fd9927; }
.gap-dot-real { background: #6aaef7; }
.gap-delta { margin-left: auto; font-weight: 600; }

.belief-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #2c2c2e;
  border-radius: 12px;
  padding: 11px 14px;
  margin-top: 14px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  &:active { opacity: 0.6; }
}
.belief-chip-text {
  flex: 1;
  min-width: 0;
  font-size: 0.9rem;
  color: #8e8e93;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.belief-chip-score { font-size: 0.85rem; color: #636366; flex-shrink: 0; }
</style>
