import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/Home.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/check-ins',
      name: 'check-ins',
      component: () => import('./views/CheckInList.vue'),
    },
    {
      path: '/add-check-in',
      name: 'add-check-in',
      component: () => import('./views/CheckInAdd.vue'),
    },
  ],
  scrollBehavior() {
    return { x: 0, y: 0 };
  },
});
