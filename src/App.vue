<script setup lang="ts">
  import 'beercss'
  function showJWT(jwt:string) {
    console.log(jwt)
  }
  function showAuth() {
    console.log("I'm authorized!")
  }
</script>

<template>
  <div>
    <div>
      <a href="https://vitejs.dev" target="_blank">
        <img src="/vite.svg" class="logo" alt="Vite logo" />
      </a>
      <a href="https://vuejs.org/" target="_blank">
        <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
      </a>
    </div>
    <GNAP 
      @on-authorized="showAuth"
      @jwt="showJWT"
      helper="blue large" 
      location="https://nosh-app-mj3xd.ondigitalocean.app/app/chart/nosh_2c23641c-c1b4-4f5c-92e8-c749c54a34da"
      server="https://shihjay.xyz/api/as"
    />
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
