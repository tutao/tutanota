export function uint8ArrayUtils(...arrays: Uint8Array[]): Uint8Array<ArrayBuffer> {
	let length = arrays.reduce((previous, current) => previous + current.length, 0)
	let result = new Uint8Array(length)
	let index = 0
	for (const array of arrays) {
		result.set(array, index)
		index += array.length
	}
	return result
}

export function uint8ArrayHashSigned(array: Uint8Array): number {
	let hash = 0
	hash |= 0

	for (let i = 0; i < array.length; i++) {
		hash = (hash << 5) - hash + array[i]
		hash |= 0 // Convert to 32bit signed integer
	}
	return hash
}

export function uint8ArrayHashUnsigned(array: Uint8Array): number {
	return uint8ArrayHashSigned(array) >>> 0
}

export function uint8ArrayChunked(chunkSize: number, array: Uint8Array<ArrayBuffer>): Array<Uint8Array<ArrayBuffer>> {
	return _chunkUint8Array(chunkSize, array)
}

function _chunkUint8Array(chunkSize: number, array: Uint8Array<ArrayBuffer>): Array<Uint8Array<ArrayBuffer>> {
	if (chunkSize < 1) {
		return []
	}
	let chunkNum = 0
	const chunks: Array<Uint8Array<ArrayBuffer>> = []
	let end
	do {
		let start = chunkNum * chunkSize
		end = start + chunkSize
		chunks[chunkNum] = array.slice(start, end)
		chunkNum++
	} while (end < array.length)
	return chunks
}

/**
 * @return 1 if first is bigger than second, -1 if second is bigger than first and 0 otherwise
 */
export function uint8ArrayCompare(first: Uint8Array, second: Uint8Array): number {
	if (first.length > second.length) {
		return 1
	} else if (first.length < second.length) {
		return -1
	}

	for (let i = 0; i < first.length; i++) {
		const a = first[i]
		const b = second[i]
		if (a > b) {
			return 1
		} else if (a < b) {
			return -1
		}
	}

	return 0
}

export function uint8ArraySplitAt(array: Uint8Array, index: number): [Uint8Array, Uint8Array] {
	const left = array.slice(0, index)
	const right = array.slice(index)

	return [left, right]
}
