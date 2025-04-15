import init, { ed25519_generate_keypair, ed25519_sign, ed25519_verify } from "./pkg/crypto_primitives.js"

await init()

let keyPair = ed25519_generate_keypair()

console.log("keyPair:", keyPair)

const message = "this is a message that should be signed, verified and not throw yes henri thats true!!!!!!!!!!!!!!!!! haha"

const encodedMessage = new TextEncoder().encode(message)
const signature = ed25519_sign(keyPair.private_key, encodedMessage)

console.log("signature: ", signature)

const verification = ed25519_verify(keyPair.public_key, encodedMessage, signature)
console.log("result: ", verification)

const fakeMessage = new TextEncoder().encode("I falsify message for a living")
const fakeSignature = ed25519_sign(keyPair.private_key, fakeMessage)

const fakeVerification = ed25519_verify(keyPair.public_key, fakeMessage, signature)
console.log("fake message result: ", fakeVerification)

const fakeVerification2 = ed25519_verify(keyPair.public_key, encodedMessage, fakeSignature)
console.log("fake signature result: ", fakeVerification2)
