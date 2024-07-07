# A Vue3 component to make GNAP/PDAP authorization requests (Client Instance) to a GNAP authorization server

[![Latest Version on NPM](https://img.shields.io/npm/v/vue3-tabs-component.svg?style=flat-square)](https://npmjs.com/package/vue3-gnap)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE.md)
[![npm](https://img.shields.io/npm/dt/vue3-tabs-component.svg?style=flat-square)](https://www.npmjs.com/package/vue3-gnap)

The package contains a [Vue 3](https://vuejs.org/) component to easily display some tabs.

This is how they can be used:
=
```html
<div>
  <GNAP @on-authorized="showAuth"
    @jwt="showJWT"
    helper="blue large" 
    location="https://nosh-app-mj3xd.ondigitalocean.app/app/chart/nosh_2c23641c-c1b4-4f5c-92e8-c749c54a34da"
    server="https://shihjay.xyz/api/as"
  />
</div>
```

## Installation

You can install the package via yarn:

```bash
yarn add vue3-gnap
```

or npm:

```bash
npm install vue3-gnap --save
```

## Usage

The most common use case is to register the components globally:

```js
import {createApp} from 'vue'
import {GNAP} from 'vue3-gnap';
import "vue3-gnap/dist/style.css";

createApp(App)
    .component('GNAP', GNAP)
    .mount('#app')
```

Alternatively you can do this to register the components:

```js
import Vue from 'vue';
import {GNAP} from 'vue3-gnap';
import "vue3-gnap/dist/style.css";

Vue.component('GNAP', GNAP);
```

Or inside another component:

```js
import { defineComponent } from 'vue';
import {GNAP} from 'vue3-gnap';
import "vue3-gnap/dist/style.css";

export default defineComponent({
  name: 'My Component',
  components: {
    GNAP,
    ...
  }
```

Make sure to include the css as indicated in the examples above!

### Props:
1.  `location`: URL of the resource governed by policies set on the GNAP/PDAP authorization server.
2.  `server`:  URL of a GNAP/PDAP authorization server (Trustee).  This is typically the root domain without an endpoint/path ('/api/as/tx') as thie component figures this out based on the step of the GNAP workflow.
3.  `helper`:  Button customization can be acheived by reviewing the [Beer CSS Helpers](https://github.com/beercss/beercss/blob/main/docs/HELPERS.md) to use in the helper prop for the GNAP component.


### Callbacks:
1. `on-authorized`: emitted when authorization is complete and JWT has been issued for future resource calls.
2. `jwt`: emitted and returns the JWT as the first property to be used for future resource calls.

Example for how use the callback:
```ts
<script setup lang="ts">
  function showJWT(jwt:string) {
    console.log(jwt)
  }
  function showAuth() {
    console.log("I'm authorized!")
  }
</script>
```
```html
<template>
  <GNAP @on-authorized="showAuth"
    @jwt="showJWT"
    helper="blue large" 
    location="https://nosh-app-mj3xd.ondigitalocean.app/app/chart/nosh_2c23641c-c1b4-4f5c-92e8-c749c54a34da"
    server="https://shihjay.xyz/api/as"
  />
</template>
```

## How it works
### Grant Negotiation and Authorization Protocol (GNAP)
This component functions as an Client Instance as specified by the [Grant Negotiation and Authorization Protocol](https://www.ietf.org/archive/id/draft-ietf-gnap-core-protocol-20.html#name-introduction).

An example of a GNAP-compliant authorization server is [Trustee Community](https://github.com/HIEofOne/Trustee-Community).

This component sends HTTP POST to the grant endpoint of the [Authorization Server](https://github.com/HIEofOne/Trustee-Community) with the following headers and body.  The Content-Digest, Signature, and Signature-Input fields and how they are constructed are [described here](https://www.ietf.org/archive/id/draft-ietf-gnap-core-protocol-20.html#name-http-message-signatures).  It is imperative that the processes outlined in the aformentioned link are followed explicitly as the [Authorization Server](https://github.com/HIEofOne/Trustee-Community) verifies these header fields with the public key presented in the request body (client.key field)
NOTE: [Trustee Authorization Server](https://github.com/HIEofOne/Trustee-Community) currently only accepts JSON Web Keys for the public key presentation at this time (in the client.key field)
```
POST /api/as/tx
Content-Type: application/json
Signature-Input: sig1=...
Signature: sig1=:...
Content-Digest: sha-256=...
{
  "access_token": {
    "access": [
      {
        "type": "app",
        "actions": [
          "read",
          "write"
        ],
        "locations": [
          "https://nosh-app-mj3xd.ondigitalocean.app/app/chart/nosh_49798bcb-c617-4165-beb6-05442152c99a"
        ],
        "datatypes": [
          "application"
        ]
      },
      {
        "type": "conditions",
        "actions": [
          "read",
          "write"
        ],
        "locations": [
          "https://nosh-app-mj3xd.ondigitalocean.app/fhir/api/Condition"
        ],
        "datatypes": [
          "application/json"
        ]
      }
    ]
  },
  "client": {
    "display": {
      "name": "My Client Display Name",
      "uri": "https://client.example.net"
    },
    "key": {
      "proof": "httpsig",
      "jwk": {
        "kty": "RSA",
        "e": "AQAB",
        "kid": "xyz-1",
        "alg": "RS256",
        "n": "kOB5rR4Jv0GMeL...."
      }
    }
  },
  "interact": {
    "start": ["redirect"],
    "finish": {
      "method": "redirect",
      "uri": "https://client.example.net/return/123455",
      "nonce": "LKLTI25DK82FX4T4QFZC"
    }
  },
  "subject": {
    "sub_id_formats": ["iss_sub", "opaque"],
    "assertion_formats": ["id_token"]
  }
}

```
If verified successfuly, [Trustee Authorization Server](https://github.com/HIEofOne/Trustee-Community) responds with:
```
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
    "interact": {
      "redirect":
        "https://server.example.com/api/as/interact/4CF492MLVMSW9MKM",
      "finish": "MBDOFXG4Y5CVJCX821LH"
    }
    "continue": {
      "access_token": {
        "value": "80UPRY5NM33OMUKMKSKU"
      },
      "uri": "https://server.example.com/api/as/continue"
    },
    "instance_id": "7C7C4AZ9KHRS6X63AJAO"
}
```

The component then redirects the user to the `interact.redirect` URL for user authentication.  After successful authentication and determination of policies, the [Trustee Authorization Server](https://github.com/HIEofOne/Trustee-Community) will redirect the user back to the Client Instance URL.

The component will then interpret and verify the `hash` and `interact_ref` query strings to verify authenticity of the interaction.  The component will then make a fetch call to the `interact.continue.uri` URL to retrieve the access token in JWT format.

## Security

If you discover any security related issues, please contact [Michael Chen](https://github.com/shihjay2) instead of using the issue tracker.

## Credits

## License

The MIT License (MIT). Please see [License File](LICENSE.md) for more information.
