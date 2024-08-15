<script setup lang="ts">
  import 'beercss'

  async function showJWT(jwt:string) {
    console.log(jwt)
    const opts = {
      method: "GET",
      headers: {
        'Content-type': 'text/plain',
        'Authorization': `Bearer ${jwt}`
      }
    }
    const result = await fetch("https://nosh-app-mj3xd.ondigitalocean.app/api/nosh_2c23641c-c1b4-4f5c-92e8-c749c54a34da/Timeline", opts).then((res) => res.text())
    console.log(result)
    const opts1 = {
      method: "PUT",
      headers: {
        'Content-type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({content: result})
    }
    const result1 = await fetch("https://nosh-app-mj3xd.ondigitalocean.app/api/nosh_2c23641c-c1b4-4f5c-92e8-c749c54a34da/md", opts1).then((res) => res.json())
    console.log(result1)
  }
  function showAuth() {
    console.log("I'm authorized!")
  }
  const access = [
    {
      "type": "Timeline",
      "actions": ["read"],
      "locations": ["https://nosh-app-mj3xd.ondigitalocean.app/api/nosh_2c23641c-c1b4-4f5c-92e8-c749c54a34da/Timeline"],
      "purpose": "Clinical - Routine"
    },
    {
      "type": "Markdown",
      "actions": ["write"],
      "locations": ["https://nosh-app-mj3xd.ondigitalocean.app/api/nosh_2c23641c-c1b4-4f5c-92e8-c749c54a34da/md"],
      "purpose": "Clinical - Routine"
    }
  ]
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
      label="Sign In"
      :access="access"
      server="https://shihjay.xyz/api/as"
      name="Test Client"
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
