import Vue from 'vue';
import Vuex from 'vuex';
import { migrateFearScale, needsFearScaleMigration } from '@/utils/experiment';

Vue.use(Vuex);

const NVC_STORAGE_KEY = 'nvc';
const PATTERNS_STORAGE_KEY = `${NVC_STORAGE_KEY}.patterns`;
const BELIEFS_STORAGE_KEY = `${NVC_STORAGE_KEY}.beliefs`;
const JOURNAL_STORAGE_KEY = `${NVC_STORAGE_KEY}.journal`;

function storageAvailable(type) {
  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return e instanceof DOMException && (
      e.code === 22 ||
      e.code === 1014 ||
      e.name === 'QuotaExceededError' ||
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      storage.length !== 0; // eslint-disable-line no-undef
  }
}

export default new Vuex.Store({
  state: {
    patterns: [],
    beliefs: [],
    journal: [],
  },
  getters: {
    patterns: state => state.patterns,
    beliefs: state => state.beliefs,
    journal: state => state.journal,
  },
  mutations: {
    setPatterns(state, entries) {
      state.patterns = entries; // eslint-disable-line no-param-reassign
    },
    addPattern(state, entry) {
      entry.time = +new Date(); // eslint-disable-line no-param-reassign
      state.patterns.push(entry);
    },
    deletePattern(state, entry) {
      const index = state.patterns.indexOf(entry);
      if (index > -1) {
        state.patterns.splice(index, 1);
      }
    },
    updatePattern(state, updated) {
      const index = state.patterns.findIndex(p => p.time === updated.time);
      if (index > -1) {
        state.patterns.splice(index, 1, updated);
      }
    },
    setBeliefs(state, beliefs) {
      state.beliefs = beliefs; // eslint-disable-line no-param-reassign
    },
    addBelief(state, belief) {
      if (!belief.time) belief.time = +new Date(); // eslint-disable-line no-param-reassign
      if (typeof belief.count === 'undefined') belief.count = 1; // eslint-disable-line no-param-reassign
      state.beliefs.push(belief);
    },
    updateBelief(state, updated) {
      const index = state.beliefs.findIndex(b => b.time === updated.time);
      if (index > -1) {
        state.beliefs.splice(index, 1, updated);
      }
    },
    deleteBelief(state, belief) {
      const index = state.beliefs.indexOf(belief);
      if (index > -1) {
        state.beliefs.splice(index, 1);
      }
    },
    incrementBelief(state, belief) {
      const index = state.beliefs.indexOf(belief);
      if (index > -1) {
        const updated = Object.assign({}, state.beliefs[index], { count: (state.beliefs[index].count || 1) + 1 });
        state.beliefs.splice(index, 1, updated);
      }
    },
    decrementBelief(state, belief) {
      const index = state.beliefs.indexOf(belief);
      if (index > -1) {
        const current = state.beliefs[index].count || 1;
        const updated = Object.assign({}, state.beliefs[index], { count: Math.max(1, current - 1) });
        state.beliefs.splice(index, 1, updated);
      }
    },
    setJournal(state, entries) {
      state.journal = entries; // eslint-disable-line no-param-reassign
    },
    addJournalEntry(state, entry) {
      entry.time = +new Date(); // eslint-disable-line no-param-reassign
      state.journal.push(entry);
    },
    updateJournalEntry(state, updated) {
      const index = state.journal.findIndex(e => e.time === updated.time);
      if (index > -1) {
        state.journal.splice(index, 1, updated);
      }
    },
    deleteJournalEntry(state, entry) {
      const index = state.journal.indexOf(entry);
      if (index > -1) {
        state.journal.splice(index, 1);
      }
    },
  },
  actions: {
    loadPatterns({ commit }) {
      if (storageAvailable('localStorage')) {
        const legacyJson = localStorage.getItem('nvc.theWork');
        if (legacyJson) {
          localStorage.setItem(PATTERNS_STORAGE_KEY, legacyJson);
          localStorage.removeItem('nvc.theWork');
          commit('setPatterns', JSON.parse(legacyJson));
          return;
        }
        const json = localStorage.getItem(PATTERNS_STORAGE_KEY);
        if (json) {
          let patterns = JSON.parse(json);
          // Migrate affirmation string → affirmations array
          patterns = patterns.map(function(p) {
            if (typeof p.affirmation === 'string') {
              const lines = p.affirmation.split('\n').map(function(s) { return s.trim(); }).filter(function(s) { return s; });
              const migrated = Object.assign({}, p, { affirmations: lines.map(function(text) { return { text: text, count: 1 }; }) });
              delete migrated.affirmation;
              return migrated;
            }
            return p;
          });
          // Migrate old pattern format (has `belief` string) → new format (has `beliefs` ID array)
          const migratedBeliefs = [];
          patterns = patterns.map(function(p) {
            if (typeof p.belief === 'string' && !Array.isArray(p.beliefs)) {
              const belief = {
                time: p.time + 1,
                count: p.count || 1,
                belief: p.belief,
                feelings: p.feelings || [],
                withBelief: p.withBelief || '',
                needs: p.needs || [],
                affirmations: p.affirmations || [],
                empathy: p.empathy || '',
                reflection: {
                  origin: p.origin || '',
                  withoutBelief: p.withoutBelief || '',
                  turnarounds: p.turnaround
                    ? p.turnaround.split('\n').filter(function(s) { return s.trim().length > 0; })
                    : [],
                  changeAct: p.changeAct || '',
                },
              };
              migratedBeliefs.push(belief);
              return { time: p.time, trigger: p.trigger || '', beliefs: [belief.time] };
            }
            return p;
          });
          if (migratedBeliefs.length > 0) {
            const existingBeliefsJson = localStorage.getItem(BELIEFS_STORAGE_KEY);
            const existingBeliefs = existingBeliefsJson ? JSON.parse(existingBeliefsJson) : [];
            const allBeliefs = existingBeliefs.concat(migratedBeliefs);
            localStorage.setItem(BELIEFS_STORAGE_KEY, JSON.stringify(allBeliefs));
            localStorage.setItem(PATTERNS_STORAGE_KEY, JSON.stringify(patterns));
          }
          // The wizard no longer asks for a name — the situation text is what
          // the row shows. Where a situation only ever had a name, that name is
          // the only description it has, so it becomes the text rather than
          // being thrown away.
          let droppedName = false;
          patterns = patterns.map(function(p) {
            if (typeof p.name === 'undefined') return p;
            droppedName = true;
            const cleaned = Object.assign({}, p, { trigger: p.trigger || p.name || '' });
            delete cleaned.name;
            return cleaned;
          });
          if (droppedName) {
            localStorage.setItem(PATTERNS_STORAGE_KEY, JSON.stringify(patterns));
          }
          commit('setPatterns', patterns);
        }
      } else {
        throw new Error('Patterns were not loaded.');
      }
    },
    savePattern({ commit, getters }, entry) {
      commit('addPattern', entry);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(PATTERNS_STORAGE_KEY, JSON.stringify(getters.patterns));
      } else {
        throw new Error('Pattern was not saved persistently.');
      }
    },
    updatePattern({ commit, getters }, entry) {
      commit('updatePattern', entry);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(PATTERNS_STORAGE_KEY, JSON.stringify(getters.patterns));
      } else {
        throw new Error('Pattern was not updated persistently.');
      }
    },
    deletePattern({ commit, getters }, entry) {
      commit('deletePattern', entry);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(PATTERNS_STORAGE_KEY, JSON.stringify(getters.patterns));
      } else {
        throw new Error('Pattern was not deleted persistently.');
      }
    },
    loadBeliefs({ commit }) {
      if (storageAvailable('localStorage')) {
        const json = localStorage.getItem(BELIEFS_STORAGE_KEY);
        if (json) {
          let beliefs = JSON.parse(json);
          let migrated = false;
          beliefs = beliefs.map(function(b) {
            if (!b.reflection) {
              migrated = true;
              const reflection = {
                origin: b.origin || '',
                withoutBelief: b.withoutBelief || '',
                turnarounds: b.turnarounds || [],
                changeAct: b.changeAct || '',
              };
              const updated = Object.assign({}, b, { reflection: reflection });
              delete updated.origin;
              delete updated.withoutBelief;
              delete updated.turnarounds;
              delete updated.changeAct;
              return updated;
            }
            return b;
          });
          // Migrate plain action strings → Verhaltensexperimente. Each act
          // becomes the "Situation" of its own experiment, so a text shared by
          // several beliefs yields one experiment per belief.
          beliefs = beliefs.map(function(b) {
            const r = b.reflection || {};
            const rawActs = Array.isArray(r.changeActs) ? r.changeActs : [];
            const legacy = rawActs.length ? rawActs : (typeof r.changeAct === 'string'
              ? r.changeAct.split('\n').filter(function(s) { return s.trim().length > 0; })
              : []);
            // Drop anything that is not a usable experiment object. A single bad
            // entry used to take down the whole app, so it gets repaired here
            // rather than merely tolerated at every read site.
            const existing = (Array.isArray(r.experiments) ? r.experiments : [])
              .filter(function(x) { return x && typeof x === 'object'; });
            const wasClean = Array.isArray(r.experiments)
              && existing.length === r.experiments.length;
            const nothingToDo = wasClean
              && !legacy.length
              && r.changeActs === undefined
              && r.changeAct === undefined;
            if (nothingToDo) return b;
            // Nothing stored at all and nothing legacy: leave the belief alone.
            if (r.experiments === undefined && !legacy.length
              && r.changeActs === undefined && r.changeAct === undefined) return b;
            migrated = true;
            const converted = legacy.map(function(text, i) {
              return {
                id: b.time + i + 1,
                situation: text,
                fear: '',
                fearExpected: null,
                plannedAt: null,
                doneAt: null,
                outcome: '',
                fearActual: null,
                learning: '',
                completedAt: null,
              };
            });
            const reflection = Object.assign({}, r, {
              experiments: existing.concat(converted),
            });
            delete reflection.changeActs;
            delete reflection.changeAct;
            return Object.assign({}, b, { reflection: reflection });
          });
          // Fear used to be rated 0-100. Runs here rather than in the block
          // above because it also has to catch experiments that block leaves
          // untouched — and an imported old backup comes through this same
          // path, so a one-off flag in localStorage would have missed it.
          beliefs = beliefs.map(function(b) {
            const r = b.reflection || {};
            if (!needsFearScaleMigration(r.experiments)) return b;
            migrated = true;
            return Object.assign({}, b, {
              reflection: Object.assign({}, r, {
                experiments: r.experiments.map(migrateFearScale),
              }),
            });
          });
          if (migrated) {
            localStorage.setItem(BELIEFS_STORAGE_KEY, JSON.stringify(beliefs));
          }
          commit('setBeliefs', beliefs);
        }
      }
    },
    saveBelief({ commit, getters }, belief) {
      commit('addBelief', belief);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(BELIEFS_STORAGE_KEY, JSON.stringify(getters.beliefs));
      }
    },
    updateBelief({ commit, getters }, belief) {
      commit('updateBelief', belief);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(BELIEFS_STORAGE_KEY, JSON.stringify(getters.beliefs));
      }
    },
    deleteBelief({ commit, getters }, belief) {
      commit('deleteBelief', belief);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(BELIEFS_STORAGE_KEY, JSON.stringify(getters.beliefs));
      }
    },
    incrementBeliefCount({ commit, getters }, belief) {
      commit('incrementBelief', belief);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(BELIEFS_STORAGE_KEY, JSON.stringify(getters.beliefs));
      }
    },
    decrementBeliefCount({ commit, getters }, belief) {
      commit('decrementBelief', belief);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(BELIEFS_STORAGE_KEY, JSON.stringify(getters.beliefs));
      }
    },
    loadJournal({ commit }) {
      if (storageAvailable('localStorage')) {
        const json = localStorage.getItem(JOURNAL_STORAGE_KEY);
        if (json) {
          commit('setJournal', JSON.parse(json));
        }
      }
    },
    saveJournalEntry({ commit, getters }, entry) {
      commit('addJournalEntry', entry);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(getters.journal));
      }
    },
    updateJournalEntry({ commit, getters }, entry) {
      commit('updateJournalEntry', entry);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(getters.journal));
      }
    },
    deleteJournalEntry({ commit, getters }, entry) {
      commit('deleteJournalEntry', entry);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(getters.journal));
      }
    },
  },
});
