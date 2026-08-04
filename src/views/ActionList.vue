<template>
  <div class="dark-page">
    <v-toolbar color="#000" dark flat app>
      <v-toolbar-title>Handlungen</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon @click="$router.push('/add-action')">
        <v-icon color="#4ade80">add</v-icon>
      </v-btn>
      <v-btn icon @click="$router.push('/settings')">
        <v-icon color="#4ade80">settings</v-icon>
      </v-btn>
    </v-toolbar>

    <v-content>
      <div class="intro-card">
        <span class="intro-icon">🎯</span>
        <p class="intro-title">Verhaltensexperiment</p>
        <p class="intro-text">Eine Überzeugung lässt sich nicht wegdiskutieren, aber testen. Du schreibst vorher auf, was du befürchtest — und vergleichst es danach mit dem, was wirklich passiert ist. Die Lücke dazwischen ist die Evidenz.</p>
      </div>

      <div class="segment-row">
        <button class="seg-tab" :class="{ active: tab === 'open' }" @click="tab = 'open'">Offen</button>
        <button class="seg-tab" :class="{ active: tab === 'planned' }" @click="tab = 'planned'">Geplant</button>
        <button class="seg-tab" :class="{ active: tab === 'done' }" @click="tab = 'done'">Ausgewertet</button>
      </div>

      <div v-if="filteredRows.length === 0" class="empty-state">
        <span class="empty-icon">🏃</span>
        <p class="empty-title">Keine Einträge</p>
        <p class="empty-sub">
          <template v-if="tab === 'open'">Alle Experimente sind geplant — offen ist hier nur, was noch keine Befürchtung hat.</template>
          <template v-else-if="tab === 'planned'">Noch kein Experiment geplant.</template>
          <template v-else>Noch kein Experiment ausgewertet.</template>
        </p>
      </div>

      <div v-else class="ios-list">
        <template v-for="(row, i) in filteredRows">
          <div
            :key="row.experiment.id + '-row'"
            class="swipe-outer"
            @touchstart="tsStart($event, i)"
            @touchmove="tsMove($event, i)"
            @touchend="tsEnd($event, i)"
          >
            <div class="swipe-right-panel">
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
            <div class="swipe-left-panel">
              <button class="swipe-btn swipe-btn-delete" @click.stop="preDelete(row)">
                <v-icon small color="#fff">delete</v-icon>
                <span>Löschen</span>
              </button>
            </div>
            <div class="ios-row" :style="rowSt(i)" @click="deskClick(i)">
              <div class="row-body">
                <p class="row-title">{{ row.experiment.situation || 'Ohne Situation' }}</p>
                <div v-if="gapOf(row.experiment) !== null" class="row-badges">
                  <span class="badge-pill gap-pill"
                    :style="{ color: gapColor(gapOf(row.experiment)) }">
                    {{ row.experiment.fearExpected }} → {{ row.experiment.fearActual }}
                  </span>
                </div>
                <p class="check-meta">„{{ row.beliefText }}“</p>
                <p v-if="isDue(row.experiment)" class="due-hint">Schon durchgeführt?</p>
              </div>
              <button
                v-if="needsPlan(row.experiment)"
                class="check-btn"
                @click.stop="editExperiment(row)"
              >Planen</button>
              <button
                v-else-if="displayState(row.experiment) === 'planned'"
                class="check-btn"
                @click.stop="startResult(row)"
              >Auswerten</button>
            </div>
          </div>

          <div :key="row.experiment.id + '-expand'" v-if="openIndex === i" class="row-expand">
            <p class="expand-label">Überzeugung</p>
            <p class="expand-text mb-1">„{{ row.beliefText }}“</p>

            <p class="expand-label mt-3">Situation</p>
            <p class="expand-text mb-1">{{ row.experiment.situation || '—' }}</p>

            <template v-if="row.experiment.fear">
              <p class="expand-label mt-3">Befürchtung</p>
              <p class="expand-text mb-1">{{ row.experiment.fear }}</p>
            </template>
            <template v-if="row.experiment.fearExpected !== null">
              <p class="expand-label mt-3">Erwartet</p>
              <div class="slider-row">
                <span class="slider-end-label">0</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  :value="row.experiment.fearExpected"
                  class="readonly-slider"
                  disabled
                />
                <span class="slider-end-label">100</span>
              </div>
            </template>
            <template v-if="typeof row.experiment.fearActual === 'number'">
              <p class="expand-label mt-3">Real</p>
              <div class="slider-row">
                <span class="slider-end-label">0</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  :value="row.experiment.fearActual"
                  class="readonly-slider"
                  disabled
                />
                <span class="slider-end-label">100</span>
              </div>
            </template>

            <template v-if="row.experiment.outcome">
              <p class="expand-label mt-3">Was passiert ist</p>
              <p class="expand-text mb-1">{{ row.experiment.outcome }}</p>
            </template>

            <template v-if="gapOf(row.experiment) !== null">
              <p class="expand-label mt-3">Abgleich</p>
              <p class="expand-text mb-1">
                Erwartung {{ row.experiment.fearExpected }} · real {{ row.experiment.fearActual }}
                <span :style="{ color: gapColor(gapOf(row.experiment)) }">
                  ({{ gapOf(row.experiment) > 0 ? '−' : '+' }}{{ Math.abs(gapOf(row.experiment)) }})
                </span>
              </p>
            </template>
            <template v-if="row.experiment.learning">
              <p class="expand-label mt-3">Was sagt dir das?</p>
              <p class="expand-text mb-1">{{ row.experiment.learning }}</p>
            </template>
            <template v-if="typeof row.experiment.bodyTruth === 'number'">
              <p class="expand-label mt-3">Was sich mehr wahr anfühlt</p>
              <div class="slider-row">
                <span class="slider-end-label">Überzeugung</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  :value="row.experiment.bodyTruth"
                  class="readonly-slider"
                  disabled
                />
                <span class="slider-end-label">Affirmation</span>
              </div>
            </template>

            <p class="expand-label mt-3">Verlauf</p>
            <p class="expand-meta">Geplant: {{ dateLabel(row.experiment.plannedAt) }}</p>
            <p class="expand-meta">Gemacht: {{ dateLabel(row.experiment.doneAt) }}</p>
            <p class="expand-meta">Ausgewertet: {{ dateLabel(row.experiment.completedAt) }}</p>
          </div>

          <div :key="row.experiment.id + '-sep'" class="ios-sep" v-if="i < filteredRows.length - 1"></div>
        </template>
      </div>

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
                    <input type="range" min="0" max="100" v-model.number="resultActual" class="fear-slider" />
                    <span class="slider-end-label">100</span>
                  </div>
                  <p class="slider-value-label">{{ resultActual }}</p>
                  <div class="scale-legend">
                    <span>0 = gar nicht</span>
                    <span>100 = genau so schlimm wie erwartet</span>
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
                    Fühle in dich hinein. Was hält dein Körper nach dieser Erfahrung für
                    mehr wahr?
                  </p>
                </v-flex>

                <!-- The old sentence against the new one, as one scale. The
                     sentences are the ends of it, so they carry no label of
                     their own — and no colour, which would name a winner
                     before the question is answered. They sit under the slider
                     in two columns, each aligned to the end it belongs to. -->
                <v-flex v-if="resultAffirmationText">
                  <div class="slider-row">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      v-model.number="resultBodyTruth"
                      class="fear-slider"
                    />
                  </div>
                  <div class="pole-grid">
                    <p class="pole pole-belief">{{ resultBeliefText }}</p>
                    <p class="pole pole-affirmation">{{ resultAffirmationText }}</p>
                  </div>
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
        : 'planned',
      openIndex: null,
      now: Date.now(),
      isResultDialogShowing: false,
      resultRow: null,
      resultStep: 1,
      resultOutcome: '',
      resultActual: 50,
      resultLearning: '',
      // 0 = the old belief still holds, 100 = the affirmation does.
      resultBodyTruth: 50,
      rowToDelete: null,
      isDeleteDialogShowing: false,
      sw: { openIdx: null, openDir: null, touchIdx: null, startX: 0, startY: 0, dx: 0, isH: null, drag: false },
    };
  },
  watch: {
    tab() { this.sw.openIdx = null; this.sw.openDir = null; this.openIndex = null; },
  },
  computed: {
    rows() {
      return collectExperiments(this.$store.getters.beliefs);
    },
    filteredRows() {
      const tab = this.tab;
      return this.rows.filter(function(row) {
        return experimentDisplayState(row.experiment) === tab;
      });
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
  methods: {
    state(x) { return experimentState(x); },
    displayState(x) { return experimentDisplayState(x); },
    gapOf(x) { return fearGap(x); },
    gapColor(gap) { return fearGapColor(gap); },
    isDue(x) { return isDue(x, this.now); },
    // A migrated action has a situation but no anchor — it cannot be evaluated.
    needsPlan(x) { return experimentState(x) !== 'evaluated' && !isPlanned(x); },
    toggle(i) {
      this.sw.openIdx = null; this.sw.openDir = null;
      this.openIndex = this.openIndex === i ? null : i;
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
      this.sw.openIdx = null; this.sw.openDir = null;
      this.resultRow = row;
      this.resultStep = 1;
      this.resultOutcome = row.experiment.outcome || '';
      this.resultActual = typeof row.experiment.fearActual === 'number' ? row.experiment.fearActual : 50;
      this.resultLearning = row.experiment.learning || '';
      this.resultBodyTruth = typeof row.experiment.bodyTruth === 'number'
        ? row.experiment.bodyTruth
        : 50;
      this.isResultDialogShowing = true;
    },
    cancelResult() {
      this.isResultDialogShowing = false;
      this.resultRow = null;
      this.resultStep = 1;
      this.resultOutcome = '';
      this.resultActual = 50;
      this.resultLearning = '';
      this.resultBodyTruth = 50;
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
        // never reach "Gehandelt", which keys off doneAt.
        doneAt: (row && row.experiment.doneAt) || now,
        completedAt: now,
        // Where the body put itself between the old belief and the affirmation.
        bodyTruth: this.resultBodyTruth,
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
      this.sw.openIdx = null; this.sw.openDir = null;
      this.$router.push(`/act-belief/${row.beliefTime}/${row.experiment.id}`);
    },
    dateLabel(ts) {
      if (!ts) return '—';
      moment.locale('de');
      return moment(ts).format('D. MMMM YYYY');
    },

    preDelete(row) {
      this.sw.openIdx = null; this.sw.openDir = null;
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
      this.openIndex = null;
    },

    tsStart(e, i) {
      if (e.target && e.target.closest && (e.target.closest('.swipe-btn') || e.target.closest('.check-btn'))) return;
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
      this.sw.dx = Math.max(-80, Math.min(dx, this.rightWidth(i)));
      this.sw.drag = true;
    },
    tsEnd(e, i) {
      if (this.sw.touchIdx !== i) return;
      const wasVert = this.sw.isH === false;
      if (!wasVert) e.preventDefault();
      if (!this.sw.drag && !wasVert) {
        if (this.sw.openIdx !== null) { this.sw.openIdx = null; this.sw.openDir = null; }
        else { this.toggle(i); }
      } else if (this.sw.drag) {
        if (this.sw.dx < -40) { this.sw.openIdx = i; this.sw.openDir = 'left'; }
        else if (this.sw.dx > 40) { this.sw.openIdx = i; this.sw.openDir = 'right'; }
        else { this.sw.openIdx = null; this.sw.openDir = null; }
        this.openIndex = null;
      }
      this.sw.touchIdx = null; this.sw.dx = 0; this.sw.drag = false; this.sw.isH = null;
    },
    // Keep in step with the buttons rendered above: a mismatch makes the row
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
    deskClick(i) {
      if (this.sw.openIdx !== null) { this.sw.openIdx = null; this.sw.openDir = null; return; }
      this.toggle(i);
    },
  },
};
</script>

<style scoped lang="scss">
.dark-page { background: #000; min-height: 100vh; }

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
  padding: 8px 0;
  font-size: 0.875rem;
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
  margin: 0 16px 24px;
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
.swipe-btn-evaluate { background: #2f7a52; }

.ios-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 13px 12px 13px 20px;
  background: #1c1c1e;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  will-change: transform;
  &:active { background: #2c2c2e; }
}
.row-body { flex: 1; min-width: 0; margin-right: 12px; }
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

.check-btn {
  background: #4ade80;
  color: #000;
  border: none;
  border-radius: 20px;
  padding: 7px 16px;
  font-size: 0.875rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  &:active { background: #3dcc70; transform: scale(0.97); }
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
  margin: 0 0 6px;
  font-weight: 600;
}
.expand-text { font-size: 0.93rem; color: #ebebf5; margin: 0; line-height: 1.5; }
.expand-meta { font-size: 0.78rem; color: #8e8e93; margin: 2px 0 0; }
.mb-1 { margin-bottom: 4px !important; }
.mt-3 { margin-top: 12px !important; }

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
  margin: 0;
}
.pole-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 12px;
}
.pole-belief { color: #ebebf5; text-align: left; }
.pole-affirmation { color: #ebebf5; text-align: right; }
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
</style>
