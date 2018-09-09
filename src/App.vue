<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'app',
  created() {
    this.$store.dispatch('loadCheckIns');
  },
};
</script>

<style lang="scss">
html,body{
	-webkit-overflow-scrolling : touch !important;
	overflow: auto !important;
	height: 100% !important;
}
body {
  font-size: 16px;
  margin: 0;
}
input[type="text"] {
  font-size: inherit;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
