import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
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
    {
      path: '/the-work',
      name: 'the-work',
      component: () => import('./views/TheWorkList.vue'),
    },
    {
      path: '/add-the-work',
      name: 'add-the-work',
      component: () => import('./views/TheWorkAdd.vue'),
    },
    { path: '*', redirect: '/check-ins' },
  ],
  scrollBehavior() {
    return { x: 0, y: 0 };
  },
});
