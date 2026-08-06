/* eslint-disable global-require */
// Exposed to the app as process.env.VUE_APP_* (inlined by Vue CLI at build time).
// The build stamp changes on every build, so the Settings screen can prove that
// "App aktualisieren" actually loaded a fresh bundle.
process.env.VUE_APP_VERSION = require('./package.json').version;
process.env.VUE_APP_BUILD = new Date().toISOString().slice(0, 16).replace('T', ' ');

// The same stamp, written next to the bundle as a file small enough to fetch
// uncached on every start. That is how a running app can tell that a newer
// build exists: its own stamp is baked in, this one comes from the server.
const BUILD_STAMP_FILE = 'build.json';
const emitBuildStamp = {
  apply(compiler) {
    compiler.hooks.emit.tap('EmitBuildStamp', (compilation) => {
      const body = JSON.stringify({ build: process.env.VUE_APP_BUILD });
      // eslint-disable-next-line no-param-reassign
      compilation.assets[BUILD_STAMP_FILE] = {
        source: () => body,
        size: () => body.length,
      };
    });
  },
};

module.exports = {
  baseUrl: process.env.NODE_ENV === 'production'
    ? '/nvc/'
    : '/',
  configureWebpack: {
    plugins: [emitBuildStamp],
  },
  css: {
    loaderOptions: {
      sass: {
        implementation: require('sass'),
      },
    },
  },
}
