import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const NVC_STORAGE_KEY = 'nvc';
const CHECK_INS_STORAGE_KEY = `${NVC_STORAGE_KEY}.checkIns`;

function storageAvailable(type) {
  try {
    const storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return e instanceof DOMException && (
      // everything except Firefox
      e.code === 22 ||
      // Firefox
      e.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
      // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage.length !== 0; // eslint-disable-line no-undef
  }
}

export default new Vuex.Store({
  state: {
    checkIns: [],
  },
  getters: {
    checkIns: state => state.checkIns,
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
  },
});
