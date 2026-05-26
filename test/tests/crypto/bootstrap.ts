import { random } from "../../../src/platform-kits/crypto"

export async function bootstrapTests() {
	await random.addEntropy([
		{
			data: 36,
			entropy: 256,
			source: "key",
		},
	])
}
