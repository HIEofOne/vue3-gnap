<script setup lang="ts">
  import 'beercss'
  import { reactive } from 'vue'

  async function showJWT(jwt:string) {
    console.log(jwt)
    const opts = {
      method: "GET",
      headers: {
        'Content-type': 'text/plain',
        'Authorization': `Bearer ${jwt}`
      }
    }
    const result = await fetch("https://nosh-app-mj3xd.ondigitalocean.app/api/nosh_2c23641c-c1b4-4f5c-92e8-c749c54a34da/Timeline", opts).then((res) => res.json())
    console.log(result.process)
    let a = false
    let b = 0
    let md = null
    while (!a && b < 100) {
      await sleep(3)
      const response = await fetch("https://nosh-app-mj3xd.ondigitalocean.app/api/nosh_2c23641c-c1b4-4f5c-92e8-c749c54a34da/Timeline?process=" + result.process, opts)
      if (response.status === 200) {
        a = true
        md = await response.text()
        console.log(md)
      }
      if (response.status === 404) {
        console.log('pending')
      }
      if (response.status === 401) {
        a = true
        console.log('unauthorized')
      }
      b++
    }
    const opts1 = {
      method: "PUT",
      headers: {
        'Content-type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify({content: md})
    }
    const result1 = await fetch("https://nosh-app-mj3xd.ondigitalocean.app/api/nosh_2c23641c-c1b4-4f5c-92e8-c749c54a34da/md", opts1).then((res) => res.json())
    console.log(result1)
  }
  function showAuth() {
    console.log("I'm authorized!")
  }
  function showRotateComplete() {
    console.log("JWT renewal complete!")
    state.rotate = false
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
  const state = reactive({
    show_logout: false,
    logout: false,
    rotate: false
  })
  function logout() {
    console.log('test logout')
    state.logout = true
  }
  async function sleep(seconds: number) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
  }
  function rotate() {
    console.log('test rotation')
    state.rotate = true
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
      @rotate-complete="showRotateComplete"
      helper="blue large"
      label="Sign In"
      :access="access"
      server="https://shihjay.xyz/api/as"
      name="Test Client"
      :show_logout=false
      :rotate=true
      :push_rotate="state.rotate"
      :logout="state.logout"
    />
    <button @click="logout">
      Other Logout Button
    </button>
    <button @click="rotate">
      Push JWT Renewal
    </button>
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
