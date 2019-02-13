//@flow

export function iterateSearchIndexBlocks(row: Uint8Array, cb: (block: Uint8Array, start: number, end: number, iteration: number) => void): number {
	let offset = 0
	let iterations = 0
	while (offset < row.length) {
		const block = readSearchIndexBlock(row, offset)
		const start = offset
		offset = block.byteOffset + block.length
		cb(block, start, offset, iterations++)
	}
	return iterations
}

export function removeSearchIndexRanges(row: Uint8Array, ranges: Array<[number, number]>): Uint8Array {
	let reducedLength = 0
	for (let i = ranges.length - 1; i >= 0; i--) {
		const [start, end] = ranges[i]
		row.copyWithin(start, end)
		reducedLength += (end - start)
	}
	return row.subarray(0, row.length - reducedLength)
}

export function appendEntities(source: Uint8Array[], destination?: Uint8Array): Uint8Array {
	const neededSpace = calculateNeededSpace(source)
	let target: Uint8Array
	let offset
	if (destination) {
		offset = destination.length
		target = new Uint8Array(destination.length + neededSpace)
		// Copy from destination to target
		target.set(destination)
	} else {
		target = new Uint8Array(neededSpace)
		offset = 0
	}

	for (let i = 0; i < source.length; i++) {
		offset += encodeSearchIndexBlock(source[i], target, offset)
	}
	return target
}

export function encodeSearchIndexBlock(entityData: Uint8Array, target: Uint8Array, offset: number): number {
	const length = entityData.length
	if (length <= 0x7F) {
		target[offset] = length
		target.set(entityData, offset + 1)
		return length + 1
	} else {
		const lengthOfLength = numberOfBytes(length)
		let remainingLength = length
		target[offset] = lengthOfLength | 0x80
		for (let i = 0; i < lengthOfLength; i++) {
			if (remainingLength > 0xff) {
				// like shifting right by 8 but without overflows
				target[offset + i + 1] = remainingLength / 256
				remainingLength = remainingLength % 256
			} else {
				target[offset + i + 1] = remainingLength
			}
		}
		target.set(entityData, offset + 1 + lengthOfLength)
		return length + lengthOfLength + 1
	}
}

/**
 * Find range for the next entity
 * @param data view on data starting from the entity (incl. encoded length)
 * @returns view with only entity (without encoded length)
 */
export function readSearchIndexBlock(source: Uint8Array, offset: number): Uint8Array {
	const markerBit = source[offset] & 0x80
	if (markerBit) {
		const numberLength = source[offset] & 0x7F
		let length = 0
		for (let i = 0; i < numberLength; i++) {
			length = length * 256
			length += source[offset + i + 1]
		}
		const start = offset + numberLength + 1
		return source.subarray(start, start + length)
	} else {
		const start = offset + 1
		return source.subarray(start, start + source[offset])
	}
}

export function calculateNeededSpace(data: Uint8Array[]): number {
	return data.reduce((acc, entry) => {
		let lengthOfPrefix = entry.length <= 0x7f
			? 1
			: numberOfBytes(entry.length) + 1
		return acc + entry.length + lengthOfPrefix
	}, 0)
}

export function numberOfBytes(number: number): number {
	return Math.ceil(Math.log2(number + 1) / 8)
}