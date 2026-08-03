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
      // Manage the belief's experiments: see them all, add one, remove one.
      path: '/act-belief/:time',
      name: 'act-belief',
      component: () => import('./views/BeliefActList.vue'),
    },
    {
      // Plan a specific experiment: situation plus the locked anchor.
      path: '/act-belief/:time/:experimentId',
      name: 'plan-experiment',
      component: () => import('./views/BeliefAct.vue'),
    },
    {
      // Same wizard, opened from the Handlungen list: the belief is picked in
      // an extra first step.
      path: '/add-action',
      name: 'add-action',
      component: () => import('./views/BeliefAct.vue'),
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
      path: '/actions',
      name: 'actions',
      component: () => import('./views/ActionList.vue'),
    },
    {
      path: '/empathy',
      name: 'empathy',
      component: () => import('./views/EmpathyView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('./views/SettingsView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('./views/ProfileView.vue'),
    },
    {
      path: '/trends',
      name: 'trends',
      component: () => import('./views/TrendsView.vue'),
    },
    { path: '*', redirect: '/patterns' },
  ],
  scrollBehavior() {
    return { x: 0, y: 0 };
  },
});
