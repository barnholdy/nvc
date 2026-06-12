import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const NVC_STORAGE_KEY = 'nvc';
const PATTERNS_STORAGE_KEY = `${NVC_STORAGE_KEY}.patterns`;
const BELIEFS_STORAGE_KEY = `${NVC_STORAGE_KEY}.beliefs`;

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
  },
  getters: {
    patterns: state => state.patterns,
    beliefs: state => state.beliefs,
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
              return { time: p.time, trigger: p.trigger || '', beliefs: [belief.time], name: p.name || '' };
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
  },
});
