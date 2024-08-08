import * as jose from 'jose'
import objectPath from 'object-path'
import { v4 as uuidv4 } from 'uuid'
import cryptoRandomString from 'crypto-random-string'
import { sign } from '@ltonetwork/http-message-signatures'
import { gnap } from '../lib/schema'

class Signer {
  key: JsonWebKey
  keyid: string
  alg: string
  constructor(key:JsonWebKey, keyid:string, alg:string) {
    this.key = key
    this.keyid = keyid
    this.alg = alg
  }
  async getKey() {
    const algorithm = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }
    return await crypto.subtle.importKey('jwk', this.key, algorithm, false, ['sign'])
  }
  async sign(data:string): Promise<Uint8Array> {
    const encoded = new TextEncoder().encode(data)
    const key = await this.getKey()
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoded)
    const ret_sig = new Uint8Array(signature)
    return ret_sig
  }
}

export function core() {
  const continue_tx = async(interact_ref: string, client_uri: string) => {
    const gnap_store = gnap.get()
    const body = {"interact_ref": interact_ref}
    const signedRequest = await sign_request(body, client_uri, 'POST', gnap_store.interact.continue.uri, gnap_store.client_name, gnap_store.interact.continue.access_token.value)
    try {
      const doc = await fetch(signedRequest)
        .then((res) => res.json())
      objectPath.set(gnap_store, 'interact', {
        nonce: '',
        interact_ref: '',
        route: '',
        interact: {
          redirect: '',
          finish: ''
        },
        continue: {
          access_token: {value: ''},
          uri: '',
          wait: 0
        },
        instance_id: ''
      })
      gnap.set(gnap_store)
      if (objectPath.has(doc, 'access_token.subject')) {
        objectPath.set(gnap_store, 'jwt', doc.access_token.value)
        gnap.set(gnap_store)
        const verify_results:any = await verify_jwt(doc.access_token.value, url_fix(gnap_store.gnap_server))
        if (verify_results.status === 'isValid') {
          return {
            status: 'success',
            data: doc
          }
        } else {
          return {
            status: 'error',
            data: 'JWT not valid'
          }
        }
      } else {
        return {
          status: 'error',
          data: 'Access token subject missing'
        }
      }
    } catch (e) {
      return {
        status: 'error',
        data: e
      }
    }
  }
  const create_key_pair = async(alg: string='RS256') => {
    const gnap_store = gnap.get()
    const { publicKey, privateKey } = await jose.generateKeyPair(alg, {extractable: true})
    const public_key = await jose.exportJWK(publicKey)
    const kid = uuidv4()
    objectPath.set(public_key, 'kid', kid)
    objectPath.set(public_key, 'alg', alg)
    const private_key = await jose.exportJWK(privateKey)
    objectPath.set(private_key, 'kid', kid)
    objectPath.set(private_key, 'alg', alg)
    const gnap_keys = {publicKey: public_key, privateKey: private_key, kid: kid}
    objectPath.set(gnap_store, 'keys', gnap_keys)
    gnap.set(gnap_store)
    return gnap_keys
  }
  const create_nonce = () => {
    return cryptoRandomString({length: 22, type: 'url-safe'})
  }
  const get_all_keys = async(server_uri: string) => {
    const gnap_store = gnap.get()
    const keys = []
    try {
      const outside_key = await fetch(url_fix(server_uri) + '/jwks')
      .then((res) => res.json())
      if (objectPath.has(outside_key, 'key')) {
        keys.push(objectPath.get(outside_key, 'key'))
      }
      var gnap_keys = gnap_store.keys
      if (!objectPath.has(gnap_keys, 'privateKey.kty')) {
        gnap_keys = await create_key_pair()
      }
      keys.push(gnap_keys.publicKey)
      return {keys, publicKey: gnap_keys.publicKey}
    } catch (err) {
      console.log(err)
    }
  }
  const hash = async(algorithm:string, data:any) => {
    if (data instanceof Blob) {
      return await hex(algorithm, new Uint8Array(await data.arrayBuffer()))
    }
   return await hex(algorithm, new TextEncoder().encode(data))
  }
  const hex = async(algorithm:string, msgUint8:Uint8Array) => {
    const hashArray = Array.from(new Uint8Array(await crypto.subtle.digest(algorithm, msgUint8)))
    return hashArray.map(function(b) {
      return b.toString(16).padStart(2, '0')
    }).join('')
  }
  const logout = () => {
    const gnap_store = gnap.get()
    objectPath.set(gnap_store, 'jwt', '')
    objectPath.set(gnap_store, 'url', '')
    objectPath.set(gnap_store, 'interact', {
      nonce: '',
      interact_ref: '',
      route: '',
      interact: {
        redirect: '',
        finish: ''
      },
      continue: {
        access_token: {value: ''},
        uri: '',
        wait: 0
      },
      instance_id: ''
    })
    gnap.set(gnap_store)
    return true
  }
  const sign_request = async(doc:object, client_uri:string, method:string, server_uri:string, client_name:string, auth:string='') => {
    const gnap_store = gnap.get()
    var gnap_keys = gnap_store.keys
    if (!objectPath.has(gnap_keys, 'privateKey.kty')) {
      gnap_keys = await create_key_pair()
    }
    const signer = new Signer(gnap_keys.privateKey, gnap_keys.kid, 'rsa-v1_5-sha256')
    const body = {
      ...doc,
      "client": {
        "display": {
          "name": client_name,
          "uri": client_uri
        },
        "key": {
          "proof": "httpsig",
          "jwk": gnap_keys.publicKey
        }
      }
    }
    const responseBody = JSON.stringify(body)
    const digestBase64 = await hash('sha-256', responseBody)
    const opts = {
      method: method,
      headers: {
        "content-digest": "sha-256=:" + digestBase64 + "=:",
        "content-type": "application/json",
      },
      body: responseBody
    }
    if (auth !== '') {
      objectPath.set(opts, "headers.authorization", "GNAP " + auth)
    }
    const request = new Request(server_uri, opts)
    const components = [
      '@method',
      '@target-uri',
      'content-digest',
      'content-type'
    ]
    const nonce = create_nonce()
    const tag = 'gnap'
    const signedRequest = await sign(request, {signer, components, nonce, tag})
    return signedRequest
  }
  const sleep = async(seconds: number) => {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }
  const tx = async(access: unknown[], client_uri: string, server_uri_root: string, client_name: string) => {
    const gnap_store = gnap.get()
    console.log(access)
    var method = 'GET'
    var server_discovery = false
    var server_uri = ''
    if (objectPath.get(access, '0.actions').includes('write')) {
      method = 'PUT'
    }
    const gnap_url = await fetch(objectPath.get(access, '0.locations.0'), {
      method: method
    }).then((res) => res.headers.get('WWW-Authenticate'))
    const gnap_url_items = gnap_url?.split('=')
    if (gnap_url_items !== undefined) {
      if (gnap_url_items[0] === 'GNAP as_uri') {
        server_uri = gnap_url_items[1]
        server_discovery = true
        objectPath.set(gnap_store, 'gnap_server', server_uri.replace('/tx', ''))
      }
    }
    gnap.set(gnap_store)
    if (!server_discovery) {
      const endpoint = await fetch(url_fix(server_uri_root) + '/.well-known/gnap-as-rs')
        .then((res) => res.json())
      server_uri = endpoint.grant_request_endpoint
    }
    const body = {
      "access_token": {
        "access": access
      },
      "interact": {
        "start": ["redirect"],
        "finish": {
          "method": "redirect",
          "uri": client_uri,
          "nonce": create_nonce()
        }
      }
    }
    const signedRequest = await sign_request(body, client_uri, 'POST', server_uri, client_name)
    try {
      const doc = await fetch(signedRequest)
        .then((res) => res.json())
      objectPath.set(gnap_store, 'interact', {
        ...doc,
        route: server_uri,
        nonce: objectPath.get(body, 'interact.finish.nonce'),
        interact_ref: doc.interact.redirect.substring(doc.interact.redirect.lastIndexOf('/') + 1)
      })
      gnap.set(gnap_store)
      return {
        status: 'success',
        data: doc
      }
    } catch (e) {
      return {
        status: 'error',
        data: e
      }
    }
  }
  const url_fix = (url: string) => {
    return url.replace(/\/$/, "")
  }
  const verify_jwt = async(jwt: string, server_uri: string) => {
    const keys:any = await get_all_keys(server_uri)
    const response = {}
    var found = 0
    for (var a in keys.keys) {
      const jwk = await jose.importJWK(keys.keys[a])
      try {
        const { payload, protectedHeader } = await jose.jwtVerify(jwt, jwk)
        objectPath.set(response, a + '.payload', payload)
        objectPath.set(response, a + '.protectedHeader', protectedHeader)
        found++
      } catch (err) {
        objectPath.set(response, a + '.error', err)
      }
    }
    if (found > 0) {
      objectPath.set(response, 'status', 'isValid')
    }
    return response
  }
  return {
    continue_tx,
    create_key_pair,
    create_nonce,
    get_all_keys,
    hash,
    hex,
    logout,
    sign_request,
    sleep,
    tx,
    url_fix,
    verify_jwt
  }
}