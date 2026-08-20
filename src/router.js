import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  routes: [
    // The Verlauf and the Tagebuch are one book now. Its old addresses still
    // lead somewhere, so a link kept from before does not dead-end.
    { path: '/patterns', redirect: '/journal' },
    { path: '/add-pattern', redirect: '/add-journal' },
    { path: '/edit-pattern/:time', redirect: to => `/edit-journal/${to.params.time}` },
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
      path: '/settings',
      name: 'settings',
      component: () => import('./views/SettingsView.vue'),
    },
    {
      path: '/journal',
      name: 'journal',
      component: () => import('./views/JournalList.vue'),
    },
    {
      path: '/add-journal',
      name: 'add-journal',
      component: () => import('./views/JournalAdd.vue'),
    },
    {
      // Straight into a new entry for this belief, the same way act-belief
      // skips the picker when a belief is already known.
      path: '/journal-belief/:time',
      name: 'journal-belief',
      component: () => import('./views/JournalAdd.vue'),
    },
    {
      path: '/edit-journal/:time',
      name: 'edit-journal',
      component: () => import('./views/JournalAdd.vue'),
    },
    { path: '*', redirect: '/now' },
  ],
  scrollBehavior() {
    return { x: 0, y: 0 };
  },
});
