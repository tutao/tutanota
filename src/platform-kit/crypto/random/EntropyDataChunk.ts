import { EntropySource } from "@tutao/crypto"

export class EntropyDataChunk {
	constructor(
		public readonly source: EntropySource,
		public readonly entropy: number,
		public readonly data: number,
	) {}
}
