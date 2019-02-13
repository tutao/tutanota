//@flow

export function iterateSearchIndexBlocks(row: Uint8Array, cb: (block: Uint8Array, start: number, end: number, iteration: number) => void): number {
	let offset = 0
	let iterations = 0
	while (offset < row.length) {
		const block = decodeSearchIndexBlock(row, offset)
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
	const lengthOfPrefix = encodeNumberBlock(entityData.length, target, offset)
	target.set(entityData, offset + lengthOfPrefix)
	return lengthOfPrefix + entityData.length
}

export function encodeNumberBlock(value: number, target: Uint8Array, offset: number): number {
	if (value <= 0x7F) {
		target[offset] = value
		return 1
	} else {
		const length = numberOfBytes(value)
		let remainingValue = value
		target[offset] = length | 0x80
		for (let i = 0; i < length; i++) {
			if (remainingValue > 0xff) {
				// like shifting right by 8 but without overflows
				target[offset + i + 1] = remainingValue / 256
				remainingValue = remainingValue % 256
			} else {
				target[offset + i + 1] = remainingValue
			}
		}
		return length + 1
	}
}


export function decodeSearchIndexBlock(source: Uint8Array, offset: number): Uint8Array {
	let blockLength = decodeNumberBlock(source, offset)
	let numberLength = calculateNeededSpaceForNumber(blockLength)
	return source.subarray(offset + numberLength, offset + numberLength + blockLength)
}


export function decodeNumberBlock(source: Uint8Array, offset: number): number {
	const markerBit = source[offset] & 0x80
	if (markerBit) {
		const numberLength = source[offset] & 0x7F
		let value = 0
		for (let i = 0; i < numberLength; i++) {
			value = value * 256
			value += source[offset + i + 1]
		}
		return value
	} else {
		return source[offset]
	}
}

export function calculateNeededSpace(data: Uint8Array[]): number {
	return data.reduce((acc, entry) => {
		let lengthOfPrefix = calculateNeededSpaceForNumber(entry.length)
		return acc + entry.length + lengthOfPrefix
	}, 0)
}

export function calculateNeededSpaceForNumber(value: number): number {
	return value <= 0x7f
		? 1
		: numberOfBytes(value) + 1
}

export function numberOfBytes(number: number): number {
	return Math.ceil(Math.log2(number + 1) / 8)
}


export function decodeNumbers(binaryNumbers: Uint8Array, offset: number = 0): number[] {
	const numbers = []
	while (offset < binaryNumbers.length) {
		const number = decodeNumberBlock(binaryNumbers, offset)
		numbers.push(number)
		offset += calculateNeededSpaceForNumber(number)
	}
	return numbers
}


export function encodeNumbers(numbers: number[], target: Uint8Array, offset: number = 0): void {
	numbers.forEach((number) => {
		offset += encodeNumberBlock(number, target, offset)
	})
}