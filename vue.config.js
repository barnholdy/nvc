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
