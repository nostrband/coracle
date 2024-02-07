import {nip04, finalizeEvent} from 'nostr-tools'
import {Emitter, Subscription, createEvent} from 'paravel'
import {randomId} from "hurdak"
import {NostrConnect} from "nostr-tools/kinds"
import {getPublicKey} from 'src/util/nostr'
import {tryJson} from "src/util/misc"
import type {Event} from 'src/engine/events/model'
import {Publisher} from "./publish"
import {subscribePersistent} from "./subscribe"
import type {NostrConnectHandler} from "../model"

let singleton: NostrConnectBroker

export class NostrConnectBroker extends Emitter {
  #sub: typeof Subscription

  static get(pubkey, connectKey: string, handler: NostrConnectHandler) {
    if (singleton?.pubkey !== pubkey) {
      singleton?.teardown()
      singleton = new NostrConnectBroker(pubkey, connectKey, handler)
    }

    return singleton
  }

  constructor(readonly pubkey: string, readonly connectKey: string, readonly handler: NostrConnectHandler) {
    super()

    this.#sub = subscribePersistent({
      relays: this.handler.relays,
      filters: [{kinds: [NostrConnect, 24134], '#p': [getPublicKey(this.connectKey)]}],
      onEvent: async (e: Event) => {
        const json = await nip04.decrypt(this.connectKey, e.pubkey, e.content)
        const {id, result, error} = tryJson(() => JSON.parse(json)) || {error: "invalid-response"}

        console.info('NostrConnect response:', id, result, error)

        this.emit(`response-${id}`, {result, error})
      },
    })
  }

  async request(method: string, params: string[]) {
    console.info('NostrConnect request:', method, params)

    const id = randomId()
    const {relays, pubkey} = this.handler
    const payload = JSON.stringify({id, method, params})
    const content = await nip04.encrypt(this.connectKey, this.pubkey, payload)
    const template = createEvent(NostrConnect, {content, tags: [["p", this.pubkey]]})
    const event = finalizeEvent(template, this.connectKey)

    Publisher.publish({event, relays})

    return new Promise((resolve, reject) => {
      this.once(`response-${id}`, ({result, error}) => {
        if (result === 'auth_url') {
          const url = `${error}?redirect_uri=${window.location.href}`
          const opts = "width=600,height=800,popup=yes"

          window.open(url, "Coracle", opts)
        } else if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }

  connect() {
    return this.request('connect', [this.pubkey])
  }

  createAccount(username: string) {
    return this.request('create_account', [username, this.handler.domain])
  }

  teardown() {
    this.sub?.close()
  }
}
