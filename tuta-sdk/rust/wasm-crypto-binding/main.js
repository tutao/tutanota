// @flow
import init, { generate_ed25519_keypair } from "./pkg/wasm_crypto_binding.js"

await init()

let keyPair = generate_ed25519_keypair()
console.log(keyPair)
