import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
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
      path: '/beliefs',
      name: 'beliefs',
      component: () => import('./views/BeliefList.vue'),
    },
    {
      path: '/add-belief',
      name: 'add-belief',
      component: () => import('./views/BeliefAdd.vue'),
    },
    {
      path: '/edit-belief/:time',
      name: 'edit-belief',
      component: () => import('./views/BeliefAdd.vue'),
    },
    {
      path: '/change-belief/:time',
      name: 'change-belief',
      component: () => import('./views/BeliefChange.vue'),
    },
    {
      path: '/empathy-belief/:time',
      name: 'empathy-belief',
      component: () => import('./views/BeliefEmpathy.vue'),
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
    { path: '*', redirect: '/patterns' },
  ],
  scrollBehavior() {
    return { x: 0, y: 0 };
  },
});
