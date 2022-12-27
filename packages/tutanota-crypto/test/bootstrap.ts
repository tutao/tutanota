import { random } from "../lib/random/Randomizer.js"
export async function bootstrapTests() {
	const crypto = await import("crypto")
	globalThis.crypto = {
		getRandomValues: function (bytes: Uint8Array) {
			let randomBytes = crypto.randomBytes(bytes.length)
			bytes.set(randomBytes)
		},
		subtle: "We have to do this, because node's crypto is not compatible with SubtleCrypto. Sorry." as unknown as SubtleCrypto,
	}
	await random.addEntropy([
		{
			data: 36,
			entropy: 256,
			source: "key",
		},
	])
}
