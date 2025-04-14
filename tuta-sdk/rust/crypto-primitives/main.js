import init, { generate_ed25519_keypair } from "./pkg/crypto_primitives.js"

await init()

let keyPair = generate_ed25519_keypair()

console.log("keyPair:", keyPair)
