import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const NVC_STORAGE_KEY = 'nvc';
const CHECK_INS_STORAGE_KEY = `${NVC_STORAGE_KEY}.checkIns`;
const THE_WORK_STORAGE_KEY = `${NVC_STORAGE_KEY}.theWork`;

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
    theWork: [],
  },
  getters: {
    checkIns: state => state.checkIns,
    theWork: state => state.theWork,
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
    setTheWork(state, entries) {
      state.theWork = entries; // eslint-disable-line no-param-reassign
    },
    addTheWork(state, entry) {
      entry.time = +new Date(); // eslint-disable-line no-param-reassign
      entry.count = 1; // eslint-disable-line no-param-reassign
      state.theWork.push(entry);
    },
    deleteTheWork(state, entry) {
      const index = state.theWork.indexOf(entry);
      if (index > -1) {
        state.theWork.splice(index, 1);
      }
    },
    updateTheWork(state, updated) {
      const index = state.theWork.findIndex(p => p.time === updated.time);
      if (index > -1) {
        state.theWork.splice(index, 1, updated);
      }
    },
    incrementTheWork(state, entry) {
      const index = state.theWork.indexOf(entry);
      if (index > -1) {
        const updated = { ...state.theWork[index], count: (state.theWork[index].count || 1) + 1 };
        state.theWork.splice(index, 1, updated);
      }
    },
    decrementTheWork(state, entry) {
      const index = state.theWork.indexOf(entry);
      if (index > -1) {
        const current = state.theWork[index].count || 1;
        const updated = { ...state.theWork[index], count: Math.max(1, current - 1) };
        state.theWork.splice(index, 1, updated);
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
    loadTheWork({ commit }) {
      if (storageAvailable('localStorage')) {
        const json = localStorage.getItem(THE_WORK_STORAGE_KEY);
        if (json) {
          commit('setTheWork', JSON.parse(json));
        }
      } else {
        throw new Error('The Work entries were not loaded.');
      }
    },
    saveTheWork({ commit, getters }, entry) {
      commit('addTheWork', entry);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(THE_WORK_STORAGE_KEY, JSON.stringify(getters.theWork));
      } else {
        throw new Error('The Work entry was not saved persistently.');
      }
    },
    deleteTheWork({ commit, getters }, entry) {
      commit('deleteTheWork', entry);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(THE_WORK_STORAGE_KEY, JSON.stringify(getters.theWork));
      } else {
        throw new Error('The Work entry was not deleted persistently.');
      }
    },
    updateTheWork({ commit, getters }, entry) {
      commit('updateTheWork', entry);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(THE_WORK_STORAGE_KEY, JSON.stringify(getters.theWork));
      } else {
        throw new Error('The Work entry was not updated persistently.');
      }
    },
    incrementTheWorkCount({ commit, getters }, entry) {
      commit('incrementTheWork', entry);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(THE_WORK_STORAGE_KEY, JSON.stringify(getters.theWork));
      } else {
        throw new Error('The Work count was not saved persistently.');
      }
    },
    decrementTheWorkCount({ commit, getters }, entry) {
      commit('decrementTheWork', entry);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(THE_WORK_STORAGE_KEY, JSON.stringify(getters.theWork));
      } else {
        throw new Error('The Work count was not saved persistently.');
      }
    },
  },
});
