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
      // Straight into planning a new experiment for this belief.
      path: '/act-belief/:time',
      name: 'act-belief',
      component: () => import('./views/BeliefAct.vue'),
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
      // What to do next, gathered from the four lists.
      path: '/now',
      name: 'now',
      component: () => import('./views/NowView.vue'),
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
    { path: '*', redirect: '/patterns' },
  ],
  scrollBehavior() {
    return { x: 0, y: 0 };
  },
});
