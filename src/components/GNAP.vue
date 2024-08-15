<template>
  <button v-if="state.show_button" :class="state.helper" @click="submit">
    <i>key</i>
    <span>{{ state.button_text }}</span>
  </button>
  <button v-if="state.show_logout" :class="state.helper" @click="logout_gnap">
    <i>logout</i>
    <span>Logout</span>
  </button>
  <div v-if="state.loading">
    <dialog class="modal active">
      <progress class="circle large"></progress>
      <div class="space"></div>
      <div>Loading...</div>
    </dialog>
  </div>
  <div v-if="state.show_alert">
    <dialog class="modal active">
      <i class="large">warning</i>
      <div class="space"></div>
      <div>{{ state.alert }}</div>
    </dialog>
  </div>
</template>

<script lang="ts">
// import { defineComponent, nextTick, onMounted, reactive, ref, watch, watchEffect } from 'vue'
import { defineComponent, onMounted, reactive, watch } from 'vue'
import { core } from '../lib/core'
import { gnap, RootState } from '../lib/schema'

import 'beercss'

export default defineComponent({
  name: 'GNAP',
  components: {
  },
  props: {
    helper: { type: String, required: false },
    label: { type: String, required: false},
    access: { type: Array, default: function () { return []}, required: true },
    server: { type: String, required: true },
    name: { type: String, required: true }
  },
  emits: ['on-authorized', 'jwt'],
  setup (props, {emit}) {
    // const gnap = useGnapAuthStore()
    const { continue_tx, logout, sleep, tx, verify_jwt } = core()
    const state = reactive<{ 
      loading: boolean; 
      value: string; 
      helper: string | undefined; 
      show_button: boolean;
      show_alert: boolean;
      alert: string; 
      show_logout: boolean;
      gnap_store: RootState;
      button_text: string | undefined;
    }>({
      loading: false,
      value: '',
      helper: 'secondary',
      show_button: false,
      show_alert: false,
      alert: '',
      show_logout: false,
      gnap_store: gnap.get(),
      button_text: 'Sign In to Trustee Authorization Server'
    })
    onMounted(async() => {
      state.loading = true
      if (props.helper !== undefined) {
        state.helper = props.helper
      }
      if (props.label !== undefined) {
        state.button_text = props.label
      }
      if (state.gnap_store.jwt !== '') {
        const verify_results:any = await verify_jwt(state.gnap_store.jwt, props.server)
        if (verify_results.status === 'isValid') {
          state.show_button = false
          state.show_logout = true
          emit('on-authorized')
          emit('jwt', state.gnap_store.jwt)
        } else {
          await logout_gnap()
        }
      } else {
        state.show_button = true
      }
      const current_url = new URL(window.location.href)
      if (current_url.searchParams.get('interact_ref') !== null) {
        if (state.gnap_store.interact.interact_ref === current_url.searchParams.get('interact_ref')) {
          const data = state.gnap_store.interact.nonce + '\n' + state.gnap_store.interact.interact.finish + '\n' + state.gnap_store.interact.interact_ref + '\n' + state.gnap_store.interact.route
          const byteArray = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
          const hash_data = btoa(Array.from(new Uint8Array(byteArray)).map(val => {
            return String.fromCharCode(val)
          }).join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '')
          if (hash_data === current_url.searchParams.get('hash')) {
            const continue_tx_return = await continue_tx(state.gnap_store.interact.interact_ref, current_url.origin)
            if (continue_tx_return.status === 'success') {
              emit('on-authorized')
              emit('jwt', continue_tx_return.data.access_token.value)
              state.show_button = false
              state.show_logout = true
            }
          } else {
            state.show_alert = true
            state.alert = 'Hash values do not match!'
            console.log(hash_data)
            console.log(current_url.searchParams.get('hash'))
            await sleep(5)
            state.show_alert = false
          }
        } else {
          state.show_alert = true
          state.alert = 'No previous interaction found!'
          await sleep(5)
          state.show_alert = false
        }
      } else {
        const url = new URL(window.location.href)
        state.gnap_store.url = url
        state.gnap_store.gnap_server = props.server
        state.gnap_store.client_name = props.name
      }
      // if (props.helper !== undefined) {
        
      // }
      state.loading = false
    })
    watch(() => props.helper, (newVal) => {
      if (newVal) {
        state.helper = newVal
      }
    })
    watch(() => state.gnap_store, async(newVal) => {
      gnap.set(newVal)
    },{deep: true})
    const logout_gnap = async() => {
      const redirect = state.gnap_store.url
      logout()
      await sleep(5)
      window.location.href = redirect
    }
    const submit = async() => {
      state.loading = true
      const url = new URL(window.location.href)
      const tx_return = await tx(props.access, url.origin, props.server, props.name)
      if (tx_return.status === 'success') {
        window.location.href = tx_return.data.interact.redirect
      } else {
        console.log(tx_return.data)
      }
    }
    return {
      gnap,
      logout_gnap,
      state,
      submit
    }
  }
})


</script>

<style scoped>
</style>