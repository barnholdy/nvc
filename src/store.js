import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const FELT_FEELINGS_STORAGE_KEY = 'feltFeelings';

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
    feltFeelings: [],
  },
  getters: {
    feltFeelings: state => state.feltFeelings,
  },
  mutations: {
    setFeltFeelings(state, feltFeelings) {
      state.feltFeelings = feltFeelings; // eslint-disable-line no-param-reassign
    },
    addFeltFeelings(state, payload) {
      const feltFeelings = {
        fullfilled: payload.fullfilled,
        unfullfilled: payload.unfullfilled,
        time: +new Date(),
      };
      state.feltFeelings.push(feltFeelings);
    },
  },
  actions: {
    loadFeelings({ commit }) {
      if (storageAvailable('localStorage')) {
        const feltFeelingsJson = localStorage.getItem(FELT_FEELINGS_STORAGE_KEY);
        if (feltFeelingsJson) {
          commit('setFeltFeelings', JSON.parse(feltFeelingsJson));
        }
      } else {
        throw new Error('Feelings were not loaded.');
      }
    },
    saveFeelings({ commit, getters }, payload) {
      commit('addFeltFeelings', payload);
      if (storageAvailable('localStorage')) {
        localStorage.setItem(FELT_FEELINGS_STORAGE_KEY, JSON.stringify(getters.feltFeelings));
      } else {
        throw new Error('Feelings were not saved persistently');
      }
    },
  },
});
