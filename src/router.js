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
    {
      path: '/affirmation-pattern/:time',
      name: 'affirmation-pattern',
      component: () => import('./views/PatternAffirmation.vue'),
    },
    {
      path: '/empathy-pattern/:time',
      name: 'empathy-pattern',
      component: () => import('./views/PatternEmpathy.vue'),
    },
    {
      path: '/affirmations',
      name: 'affirmations',
      component: () => import('./views/AffirmationList.vue'),
    },
    {
      path: '/reflections',
      name: 'reflections',
      component: () => import('./views/ReflectionList.vue'),
    },
    {
      path: '/add-reflection',
      name: 'add-reflection',
      component: () => import('./views/ReflectionAdd.vue'),
    },
    {
      path: '/resentments',
      name: 'resentments',
      component: () => import('./views/ResentmentList.vue'),
    },
    {
      path: '/add-resentment',
      name: 'add-resentment',
      component: () => import('./views/ResentmentAdd.vue'),
    },
    { path: '*', redirect: '/check-ins' },
  ],
  scrollBehavior() {
    return { x: 0, y: 0 };
  },
});
