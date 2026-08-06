import '@babel/polyfill';
import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './plugins/vuetify';
import { reloadIfStale } from './utils/appUpdate';

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');

// Not awaited: the app starts either way, and picks up a newer deploy on its
// own a moment later instead of waiting on the network to show anything.
reloadIfStale();
