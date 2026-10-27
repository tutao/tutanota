import { EntropySource } from "../../../src/platform-kit/crypto"
import { getTestRandom } from "../TestUtils"

export async function bootstrapTests() {
	await getTestRandom().addEntropy([
		{
			data: 36,
			entropy: 256,
			source: EntropySource.Key,
		},
	])
}
