/* eslint-disable global-require */
// Exposed to the app as process.env.VUE_APP_* (inlined by Vue CLI at build time).
// The build stamp changes on every build, so the Settings screen can prove that
// "App aktualisieren" actually loaded a fresh bundle.
process.env.VUE_APP_VERSION = require('./package.json').version;
process.env.VUE_APP_BUILD = new Date().toISOString().slice(0, 16).replace('T', ' ');

module.exports = {
  baseUrl: process.env.NODE_ENV === 'production'
    ? '/nvc/'
    : '/',
  css: {
    loaderOptions: {
      sass: {
        implementation: require('sass'),
      },
    },
  },
}
