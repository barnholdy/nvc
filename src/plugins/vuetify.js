import Vue from 'vue';
import {
  Vuetify,
  VApp,
  VNavigationDrawer,
  VFooter,
  VList,
  VBtn,
  VIcon,
  VGrid,
  VToolbar,
  transitions,
} from 'vuetify';
import 'vuetify/src/stylus/app.styl';
import colors from 'vuetify/es5/util/colors'

Vue.use(Vuetify, {
  components: {
    VApp,
    VNavigationDrawer,
    VFooter,
    VList,
    VBtn,
    VIcon,
    VGrid,
    VToolbar,
    transitions,
  },
  theme: {
    primary: colors.grey.lighten5,
    secondary: colors.grey.lighten5,
    accent: colors.cyan.darken2,
    error: colors.red.base,
    warning: colors.yellow.base,
    info: colors.blue.base,
    success: colors.green.base,
  },
});
