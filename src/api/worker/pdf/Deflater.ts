import { downcast } from "@tutao/tutanota-utils"

export class Deflater {
	constructor() {}

	async deflate(input: ArrayBuffer): Promise<Uint8Array> {
		// see https://wicg.github.io/compression/#example-deflate-compress
		const cs = new CompressionStream("deflate")
		const writer = cs.writable.getWriter()
		writer.write(input)
		writer.close()
		const output: Array<any> = []
		const reader = cs.readable.getReader()
		let totalSize = 0
		while (true) {
			const { value, done } = await reader.read()
			if (done) break
			output.push(downcast(value))
			totalSize += value.byteLength
		}
		const concatenated = new Uint8Array(totalSize)
		let offset = 0
		for (const array of output) {
			concatenated.set(array, offset)
			offset += array.byteLength
		}
		return concatenated
	}
}
