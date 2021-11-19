import {random} from "../lib"

export async function bootstrapTests() {
	const crypto = await import("crypto")

	globalThis.crypto = {
		getRandomValues: function (bytes) {
			let randomBytes = crypto.randomBytes(bytes.length)
			bytes.set(randomBytes)
		}
	}

	await random.addEntropy([{data: 36, entropy: 256, source: "key"}])
}

