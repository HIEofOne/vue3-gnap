import { createStoredValue } from 'typed-ls'
import { JWK } from 'jose'

const defaultValue = {
  jwt: '',
  gnap_server: '',
  client_name: '',
  rotate_token: '',
  rotate_uri: '',
  keys: {
    publicKey: {} as JWK,
    privateKey: {} as JWK,
    kid: ''
  },
  url: '',
  interact: {
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
  }
}
export const gnap = createStoredValue('gnap', defaultValue)
export type RootState = {
  jwt: string,
  gnap_server: string,
  client_name: string,
  rotate_token: string,
  rotate_uri: string,
  keys: {
    publicKey: JWK,
    privateKey: JWK,
    kid: string
  },
  url: any,
  interact: {
    nonce: string,
    interact_ref: string,
    route: string,
    interact: {
      redirect: string,
      finish: string
    },
    continue: {
      access_token: {value: string},
      uri: string,
      wait: number
    },
    instance_id: string
  }
}