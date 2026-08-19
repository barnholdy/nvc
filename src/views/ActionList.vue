<template>
  <div class="dark-page">
    <v-content>
      <div class="screen-header">
        <div class="screen-title-row">
          <h1 class="screen-title">Handlungen</h1>
          <div class="screen-actions">
            <button class="screen-add" @click="$router.push('/add-action')" aria-label="Neue Handlung">+</button>
            <button class="screen-add" @click="$router.push('/settings')" aria-label="Einstellungen">
              <v-icon color="#8e8e93">settings</v-icon>
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
          >„{{ b.belief }}“<span class="pill-count"> · {{ b.count }}</span></button>
        </div>

        <div class="pill-row">
          <!-- Compact strips the card back to what a run is and how it stood;
               Befürchtung, was passiert ist and was es sagt stay one tap away. -->
          <button
            class="pill pill-icon"
            :class="{ active: compact }"
            :aria-label="compact ? 'Ausführliche Ansicht' : 'Kompakte Ansicht'"
            @click="compact = !compact"
          >
            <v-icon small>{{ compact ? 'unfold_more' : 'unfold_less' }}</v-icon>
          </button>
          <button
            v-for="f in filters"
            :key="f.key"
            class="pill"
            :class="{ active: tab === f.key }"
            @click="tab = f.key"
          >{{ f.label }}<span class="pill-count"> · {{ f.count }}</span></button>
        </div>
      </div>

      <div v-if="filteredRows.length === 0" class="list-empty">
        <p class="list-empty-title">Keine Einträge</p>
        <p class="list-empty-sub">{{ emptyText }}</p>
      </div>

      <template v-else>
        <template v-for="group in groups">
          <p :key="group.key" class="month-head">{{ group.label }}</p>

          <div
            v-for="row in group.entries"
            :key="row.experiment.id"
            :data-row-id="row.experiment.id"
          >
            <div
              class="timeline-row"
              :class="{ 'timeline-first': row.experiment.id === group.entries[0].experiment.id }"
            >
              <span class="timeline-dot"></span>
              <div class="timeline-body">
                <p class="timeline-meta">{{ dayLabel(row.experiment.id) }}</p>
                <div class="card action-card">
                  <div class="head-swipe">
                    <!-- Whatever the card's own button already offers is left out. -->
                    <div v-if="isSwiping(row.experiment.id) && otherSteps(row).length" class="swipe-panel left">
                      <div class="swipe-group" :class="{ single: otherSteps(row).length === 1 }">
                        <button
                          v-for="step in otherSteps(row)"
                          :key="step.key"
                          class="swipe-btn"
                          :style="{ color: step.color }"
                          @click.stop="step.run(row)"
                        >{{ step.label }}</button>
                      </div>
                    </div>
                    <div v-if="isSwiping(row.experiment.id)" class="swipe-panel right">
                      <div class="swipe-group single swipe-btn-delete">
                        <button class="swipe-btn swipe-btn-delete" @click.stop="preDelete(row)">Löschen</button>
                      </div>
                    </div>
                    <div
                      class="card-head swipe-handle"
                      :style="rowSt(row.experiment.id)"
                      @touchstart="tsStart($event, row.experiment.id)"
                      @touchmove="tsMove($event, row.experiment.id)"
                      @touchend="tsEnd($event, row.experiment.id)"
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

                  <div v-if="!compact" class="card-sep"></div>

                  <div
                    v-if="!compact && row.experiment.fear"
                    class="detail-row"
                    :class="{ open: isOpen(row, 'fear') }"
                    @click.stop="toggleRow(row, 'fear')"
                  >
                    <span class="detail-label">Befürchtung</span>
                    <p class="detail-value" :class="{ open: isOpen(row, 'fear') }">{{ row.experiment.fear }}</p>
                    <v-icon v-if="!isOpen(row, 'fear')" class="detail-chevron">chevron_right</v-icon>
                  </div>

                  <div
                    v-if="!compact && row.experiment.outcome"
                    class="detail-row"
                    :class="{ open: isOpen(row, 'outcome') }"
                    @click.stop="toggleRow(row, 'outcome')"
                  >
                    <span class="detail-label">Was passiert ist</span>
                    <p class="detail-value" :class="{ open: isOpen(row, 'outcome') }">{{ row.experiment.outcome }}</p>
                    <v-icon v-if="!isOpen(row, 'outcome')" class="detail-chevron">chevron_right</v-icon>
                  </div>

                  <div
                    v-if="!compact && row.experiment.learning"
                    class="detail-row"
                    :class="{ open: isOpen(row, 'learning') }"
                    @click.stop="toggleRow(row, 'learning')"
                  >
                    <span class="detail-label">Was sagt dir das?</span>
                    <p class="detail-value" :class="{ open: isOpen(row, 'learning') }">{{ row.experiment.learning }}</p>
                    <v-icon v-if="!isOpen(row, 'learning')" class="detail-chevron">chevron_right</v-icon>
                  </div>

                  <div v-if="affirmationOf(row)" class="aff-box" :class="{ 'aff-box-loose': compact }">
                    <p class="aff-label">Affirmation</p>
                    <p class="aff-text">„{{ affirmationOf(row) }}“</p>
                  </div>

                  <!-- The belief under test, kept at the foot of the card: the run is
                       the subject here, the belief is what it is aimed at. -->
                  <belief-chip
                    :text="row.beliefText"
                    :value="rowTruth(row)"
                    :baseline="beliefTruth(row)"
                    @open="openBelief(row)"
                  ></belief-chip>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>

      <div class="list-bottom-space"></div>

      <!-- Step 4: result and comparison -->
      <v-dialog v-model="isResultDialogShowing" fullscreen>
        <div v-if="isResultDialogShowing" class="wizard-page">
          <wizard-header title="Handlung auswerten" :step="resultStep" :total="4"></wizard-header>

            <div v-show="resultStep === 1">
              <wizard-context label="Situation" :quote="resultSituation"></wizard-context>
              <p class="wizard-question">Was ist tatsächlich passiert?</p>
              <p class="wizard-body">Beschreibe es, bevor du es bewertest.</p>
              <input-card v-model="resultOutcome" label="Was ist passiert" :rows="4"></input-card>
            </div>

            <!-- The fear is shown again: rating it from memory is guesswork -->
            <div v-show="resultStep === 2">
              <wizard-context
                label="Situation"
                :quote="resultSituation"
                :fear="resultFear"
                :outcome="resultOutcome"
              ></wizard-context>

              <p class="wizard-question">Wie stark ist deine Befürchtung tatsächlich eingetreten?</p>
              <meter-card
                :value="resultActual"
                label="Tatsächlich eingetreten"
                minLabel="gar nicht"
                maxLabel="genau so schlimm"
                @input="resultActual = $event"
              ></meter-card>
            </div>

            <div v-show="resultStep === 3">
              <wizard-context
                label="Situation"
                :quote="resultSituation"
                :fear="resultFear"
                :outcome="resultOutcome"
                :fear-expected="resultExpected"
                :fear-actual="resultActual"
              ></wizard-context>

              <p class="wizard-question">Was sagt dir das?</p>
              <input-card v-model="resultLearning" label="Deine Erkenntnis" :rows="3"></input-card>
            </div>

            <div v-show="resultStep === 4">
              <wizard-context
                label="Situation"
                :quote="resultSituation"
                :fear="resultFear"
                :outcome="resultOutcome"
                :learning="resultLearning"
                :fear-expected="resultExpected"
                :fear-actual="resultActual"
              ></wizard-context>

              <p class="wizard-question">Wie glaubwürdig fühlt sich die Überzeugung jetzt an?</p>
              <p class="wizard-body">Fühle in dich hinein.</p>

              <p class="wizard-note pole">{{ resultBeliefText }}</p>
              <meter-card
                :value="resultBeliefTruth"
                label="Glaubwürdigkeit"
                minLabel="gar nicht"
                maxLabel="völlig"
                @input="resultBeliefTruth = $event"
              ></meter-card>
            </div>

            <div class="wizard-bottom-space"></div>

          <wizard-footer
            :disabled="resultStep === 1 && !resultOutcome.trim()"
            :nextLabel="resultStep < 4 ? 'Weiter' : 'Speichern'"
            @back="resultStep === 1 ? cancelResult() : resultStep--"
            @next="resultStep < 4 ? resultStep++ : saveResult()"
          ></wizard-footer>
        </div>
      </v-dialog>      </v-dialog>

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
      <v-btn flat color="grey" to="/now">
        <nav-icon name="now"></nav-icon>
      </v-btn>
      <v-btn flat color="grey" to="/patterns">
        <nav-icon name="patterns"></nav-icon>
      </v-btn>
      <v-btn flat color="grey" to="/beliefs">
        <nav-icon name="beliefs"></nav-icon>
      </v-btn>
      <v-btn flat color="primary" to="/actions">
        <nav-icon name="actions"></nav-icon>
      </v-btn>
      <v-btn flat color="grey" to="/journal">
        <nav-icon name="journal"></nav-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import moment from 'moment';
import WizardHeader from '@/components/WizardHeader.vue';
import WizardFooter from '@/components/WizardFooter.vue';
import WizardContext from '@/components/WizardContext.vue';
import InputCard from '@/components/InputCard.vue';
import MeterCard from '@/components/MeterCard.vue';
import {
  EXPERIMENT_DISPLAY_STATES,
  EXPERIMENT_DISPLAY_LABELS,
  collectExperiments,
  experimentsOf,
  experimentDisplayState,
  isExperimentDisplayState,
  experimentState,
  fearGap,
  isDue,
  isPlanned,
} from '@/utils/experiment';
import { beliefCredibility } from '@/utils/credibility';
import { beliefStatusLabel, beliefStatusColor } from '@/utils/beliefStatus';
import { openQuery, requestedId, scrollRowIntoView } from '@/utils/reveal';
import NavIcon from '@/components/NavIcon.vue';
import BeliefChip from '@/components/BeliefChip.vue';

const COMPACT_KEY = 'nvc.actionsCompact';

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
  components: {
    NavIcon, WizardHeader, WizardFooter, WizardContext, InputCard, MeterCard, BeliefChip,
  },
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
      // Remembered, so the choice survives leaving the list and coming back —
      // the same key pattern the Überzeugungen list uses for its own toggle.
      compact: localStorage.getItem(COMPACT_KEY) === '1',
      beliefFilter: null,
      sw: { openKey: null, handleHeight: 0, openDir: null, touchKey: null, startX: 0, startY: 0, dx: 0, isH: null, drag: false },
      now: Date.now(),
      isResultDialogShowing: false,
      resultRow: null,
      resultStep: 1,
      resultOutcome: '',
      resultActual: 5,
      resultLearning: '',
      // 0 = the old belief still holds, 100 = the affirmation does.
      resultBeliefTruth: 5,
      rowToDelete: null,
      isDeleteDialogShowing: false,
    };
  },
  watch: {
    '$route.query.open': function() { this.revealRequested(); },
    '$route.query.belief': function() { this.applyBeliefQuery(); },
    tab() { this.sw.openKey = null; this.sw.openDir = null; },
    beliefFilter() { this.sw.openKey = null; this.sw.openDir = null; },
    compact(v) { localStorage.setItem(COMPACT_KEY, v ? '1' : '0'); },
  },
  computed: {
    // The panels reach only as far down as the part that answers the
    // swipe, so a tall card does not get a full-height slab behind it.
    panelStyle() {
      return this.sw.handleHeight ? { height: `${this.sw.handleHeight}px` } : null;
    },
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
        if (seen[r.beliefTime] === undefined) {
          seen[r.beliefTime] = out.length;
          out.push({ time: r.beliefTime, belief: r.beliefText, count: 0 });
        }
        out[seen[r.beliefTime]].count += 1;
      });
      return out.sort((a, b) => b.count - a.count);
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
    // Same monthly timeline the Verlauf and Tagebuch lists use, grouped on
    // when the run was planned — filteredRows already comes out newest first.
    groups() {
      const out = [];
      const index = {};
      moment.locale('de');
      this.filteredRows.forEach((row) => {
        const key = moment(row.experiment.id).format('YYYY-MM');
        if (index[key] === undefined) {
          index[key] = out.length;
          out.push({ key, label: moment(row.experiment.id).format('MMMM YYYY').toUpperCase(), entries: [] });
        }
        out[index[key]].entries.push(row);
      });
      return out;
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
    resultBeliefText() {
      return this.resultRow ? this.resultRow.beliefText : '';
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
    isDue(x) { return isDue(x, this.now); },
    // A migrated action has a situation but no anchor — it cannot be evaluated.
    needsPlan(x) { return experimentState(x) !== 'evaluated' && !isPlanned(x); },
    // The card shows Planen while an anchor is missing and Auswerten once it
    // is there; the swipe offers whichever of the two is not on screen.
    otherSteps(row) {
      const steps = [
        { key: 'plan', label: 'Planen', color: '#4ade80', run: r => this.editExperiment(r) },
      ];
      // Nothing to compare against until an anchor exists.
      if (!this.needsPlan(row.experiment)) {
        steps.push({ key: 'evaluate', label: 'Auswerten', color: '#4ade80', run: r => this.startResult(r) });
      }
      const here = this.needsPlan(row.experiment)
        ? 'Planen'
        : (this.displayState(row.experiment) === 'planned' ? 'Auswerten' : '');
      return steps.filter(s => s.label !== here);
    },
    isSwiping(key) { return this.sw.openKey === key || this.sw.touchKey === key; },
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
    // Just the state — the timeline meta above the card already names the
    // date, so the badge repeating it would say the same thing twice.
    stateLine(x) {
      return EXPERIMENT_DISPLAY_LABELS[experimentDisplayState(x)];
    },
    dayLabel(ts) {
      moment.locale('de');
      return moment(ts).format('D. MMM').toUpperCase();
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
    },
    // The belief's own standing, the same number its row shows in the belief
    // list. The reading this experiment took is shown further down, separately.
    beliefTruth(row) {
      return beliefCredibility(this.$store.getters.patterns, this.beliefOf(row), this.$store.getters.journal);
    },
    // What this run itself rated the belief at, recorded when it was
    // evaluated. Null while it has not been.
    rowTruth(row) {
      const v = row && row.experiment && row.experiment.beliefTruth;
      return typeof v === 'number' ? v : null;
    },
    beliefStatusLabel(belief) { return beliefStatusLabel(belief); },
    beliefStatusColor(belief) { return beliefStatusColor(belief); },
    openBelief(row) {
      this.$router.push({ path: '/beliefs', query: openQuery(row.beliefTime, { top: true }) });
    },
    // Always the belief's current affirmation, never a copy an older
    // experiment recorded of its own — an edited affirmation must read the
    // same on every run that tests it, not just the ones written after.
    affirmationOf(row) {
      const list = ((this.beliefOf(row) || {}).affirmations) || [];
      const first = list.find(a => a && a.text);
      return first ? first.text : '';
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
    // Keyed by the run's own id rather than its index: the timeline is
    // grouped by month, so an index within a group would collide across them.
    tsStart(e, key) {
      if (e.target && e.target.closest && e.target.closest('.card-btn')) return;
      this.sw.handleHeight = e.currentTarget ? e.currentTarget.offsetHeight : 0;
      const t = e.touches[0];
      this.sw.touchKey = key; this.sw.startX = t.clientX; this.sw.startY = t.clientY;
      this.sw.dx = 0; this.sw.isH = null; this.sw.drag = false;
    },
    tsMove(e, key) {
      if (this.sw.touchKey !== key) return;
      const t = e.touches[0];
      const dx = t.clientX - this.sw.startX, dy = t.clientY - this.sw.startY;
      if (this.sw.isH === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8))
        this.sw.isH = Math.abs(dx) > Math.abs(dy) * 1.5;
      if (!this.sw.isH) return;
      e.preventDefault();
      this.sw.dx = Math.max(-110, Math.min(dx, this.rightWidth(key)));
      this.sw.drag = true;
    },
    tsEnd(e, key) {
      if (this.sw.touchKey !== key) return;
      if (this.sw.drag) {
        if (this.sw.dx < -40) { this.sw.openKey = key; this.sw.openDir = 'left'; }
        else if (this.sw.dx > 40) { this.sw.openKey = key; this.sw.openDir = 'right'; }
        else { this.sw.openKey = null; this.sw.openDir = null; }
      } else if (this.sw.openKey !== null) {
        this.sw.openKey = null; this.sw.openDir = null;
      }
      this.sw.touchKey = null; this.sw.dx = 0; this.sw.drag = false; this.sw.isH = null;
    },
    // Keep in step with the buttons rendered above: a mismatch makes the card
    // spring back before the second one can be tapped.
    rightWidth(key) {
      const row = this.filteredRows.find(r => r.experiment.id === key);
      const n = row ? this.otherSteps(row).length : 0;
      return n >= 2 ? 190 : 110;
    },
    rowSt(key) {
      const s = this.sw;
      const live = s.touchKey === key && s.drag && s.isH;
      let x = 0;
      if (live) x = s.dx;
      else if (s.openKey === key) x = s.openDir === 'left' ? -110 : this.rightWidth(key);
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
        // How credible the belief is after the experiment — the same 0-10
        // question a situation asks, so it counts as another reading of it.
        beliefTruth: this.resultBeliefTruth,
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

.month-head {
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: #636366;
  font-weight: 600;
  margin: 18px 0 10px;
  padding: 0 20px;
}

/* Same dotted thread the Verlauf and Tagebuch lists draw the timeline with. */
.timeline-row {
  position: relative;
  display: flex;
  gap: 14px;
  padding: 4px 20px 12px;
  background: #000;
  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 24px;
    width: 1px;
    background: #2c2c2e;
  }
  &::before { top: 14px; bottom: 0; }
  &::after { top: 0; height: 14px; }
  &.timeline-first::after { display: none; }
}
.timeline-dot {
  position: relative;
  flex-shrink: 0;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #48484a;
  margin-top: 6px;
}
.timeline-body { flex: 1; min-width: 0; position: relative; z-index: 1; }
.timeline-meta {
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  color: #636366;
  margin: 0 0 6px;
  text-transform: uppercase;
}
/* The card is the handle, so it keeps its own fill and radius and only drops
   the side margin .card carries for a full-width list. */
.action-card { margin: 0; }

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

/* The two credibility readings at the end: a short quote above each meter,
   in the same voice a wizard-note uses elsewhere. */
.pole { margin-bottom: 8px; }

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

/* Compact hides the row's own detail rows and their separator, which is
   what normally holds the affirmation box away from the bar above it —
   same fix the Überzeugungen list uses for the same reason. */
.aff-box-loose { margin-top: 14px !important; }

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

.due-hint { font-size: 0.85rem; color: #fd9927; margin: 10px 0 0; }

/* .gap-bar and friends are global now — the result wizard's own context
   card draws the same bar. */

/* The belief tag is a component of its own now — it carries the same two
   readings on every screen that shows one. */
</style>
