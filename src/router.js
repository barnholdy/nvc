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
      path: '/patterns',
      name: 'patterns',
      component: () => import('./views/PatternList.vue'),
    },
    {
      path: '/add-pattern',
      name: 'add-pattern',
      component: () => import('./views/PatternAdd.vue'),
    },
    {
      path: '/edit-pattern/:time',
      name: 'edit-pattern',
      component: () => import('./views/PatternAdd.vue'),
    },
    {
      path: '/change-pattern/:time',
      name: 'change-pattern',
      component: () => import('./views/PatternChange.vue'),
    },
    { path: '*', redirect: '/check-ins' },
  ],
  scrollBehavior() {
    return { x: 0, y: 0 };
  },
});
