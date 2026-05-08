import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const NVC_STORAGE_KEY = 'nvc';
const CHECK_INS_STORAGE_KEY = `${NVC_STORAGE_KEY}.checkIns`;
const PATTERNS_STORAGE_KEY = `${NVC_STORAGE_KEY}.patterns`;

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
    checkIns: [],
    patterns: [],
  },
  getters: {
    checkIns: state => state.checkIns,
    patterns: state => state.patterns,
  },
  mutations: {
    setCheckIns(state, checkIns) {
      state.checkIns = checkIns; // eslint-disable-line no-param-reassign
    },
    addCheckIn(state, checkIn) {
      checkIn.time = +new Date(); // eslint-disable-line no-param-reassign
      state.checkIns.push(checkIn);
    },
    deleteCheckIn(state, checkIn) {
      const index = state.checkIns.indexOf(checkIn);
      if (index > -1) {
        state.checkIns.splice(index, 1);
      }
    },
    setPatterns(state, entries) {
      state.patterns = entries; // eslint-disable-line no-param-reassign
    },
    addPattern(state, entry) {
      entry.time = +new Date(); // eslint-disable-line no-param-reassign
      entry.count = 1; // eslint-disable-line no-param-reassign
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
    incrementPattern(state, entry) {
      const index = state.patterns.indexOf(entry);
      if (index > -1) {
        const updated = { ...state.patterns[index], count: (state.patterns[index].count || 1) + 1 };
        state.patterns.splice(index, 1, updated);
      }
    },
    decrementPattern(state, entry) {
      const index = state.patterns.indexOf(entry);
      if (index > -1) {
        const current = state.patterns[index].count || 1;
        const updated = { ...state.patterns[index], count: Math.max(1, current - 1) };
        state.patterns.splice(index, 1, updated);
      }
    },
  },
  actions: {
    loadCheckIns({ commit }) {
      if (storageAvailable('localStorage')) {
        const checkInsJson = localStorage.getItem(CHECK_INS_STORAGE_KEY);
        if (checkInsJson) {
          commit('setCheckIns', JSON.parse(checkInsJson));
        }
      } else {
        throw new Error('Check-Ins were not loaded.');
      }
    },
    saveCheckIn({ commit, getters }, checkIn) {
      commit('addCheckIn', checkIn);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(CHECK_INS_STORAGE_KEY, JSON.stringify(getters.checkIns));
      } else {
        throw new Error('Check-Ins were not saved persistently.');
      }
    },
    deleteCheckIn({ commit, getters }, checkIn) {
      commit('deleteCheckIn', checkIn);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(CHECK_INS_STORAGE_KEY, JSON.stringify(getters.checkIns));
      } else {
        throw new Error('Check-Ins were not saved persistently.');
      }
    },
    loadPatterns({ commit }) {
      if (storageAvailable('localStorage')) {
        // Migrate data from the old 'nvc.theWork' key if present
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
          patterns = patterns.map(p => {
            if (typeof p.affirmation === 'string') {
              const lines = p.affirmation.split('\n').map(s => s.trim()).filter(s => s);
              const migrated = Object.assign({}, p, { affirmations: lines.map(function(text) { return { text: text, count: 1 }; }) });
              delete migrated.affirmation;
              return migrated;
            }
            return p;
          });
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
    incrementPatternCount({ commit, getters }, entry) {
      commit('incrementPattern', entry);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(PATTERNS_STORAGE_KEY, JSON.stringify(getters.patterns));
      } else {
        throw new Error('Pattern count was not saved persistently.');
      }
    },
    decrementPatternCount({ commit, getters }, entry) {
      commit('decrementPattern', entry);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(PATTERNS_STORAGE_KEY, JSON.stringify(getters.patterns));
      } else {
        throw new Error('Pattern count was not saved persistently.');
      }
    },
  },
});
