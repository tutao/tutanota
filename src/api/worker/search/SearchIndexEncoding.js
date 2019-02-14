//@flow

/**
 * @fileoverview SearchIndexEncoding: binary encoding for certain search index columns
 *
 * <b>Purpose</b>
 *
 * We use it primarily because storing data in many tiny {@code Uint8Array}#s is very inefficient,
 * mostly GC wise. Not only many objects create GC pressure by themselves, but they also consume
 * much more memory because each element has a lot of pointers.
 * Besides that, this encoding can encode certain thing with very little space. E.g. let's say
 * you want to encode object like {@code {app: 1, type: 10234 }}. You could convert it to JSON,
 * then convert to to binary and then save it. EcmaScript strings use 2 bytes per character.
 * That means that JSON "{app:1,type:10234}" (18 chars) would use 18*2=36 bytes.
 * With this binary encoding we would encode it as just two numbers, first one in one byte,
 * second one we would use three bytes (one for length of the number and two for the
 * actual number, more on format below) so in total 1+3=4 bytes.
 *
 * <b>Format</b>
 *
 * We encode two types of data: numbers and binary blocks.
 * For numbers we use the following encoding:
 * - If the number fits into 7 bits (smaller than 127), then the first byte represents the number
 * - If it doesn't fit, then the highest bit of the byte is set. The rest of the bits signify
 * the number of following bytes which encode the number.
 *
 * Example:
 * number | bytes
 * ––––––––––––––––
 * 3      | [0000 0011]
 * 127    | [0111 1111]
 * 128    | [1000 0001] [1000 0000]
 * 10234  | [1000 0002] [0010 0111][1111 1010]
 *
 * For binary blocks we use similar principle. First we encode length of the binary data
 * in the number format described above (as number of used bytes). After that we write binary data.
 * [length of first block][binary block] [length of second block] [binary block] ... [length of n block][binary block]
 *
 * Example:
 * Storing 2 bytes [0xFF, 0xFF]
 *
 * length of binary data | data
 * -------------------------------------------------------------------
 * [0000 0010]             [0xFF, 0xFF]
 *
 * Storing 500 bytes [0xFF, 0xFF,.., 0xFF]
 *
 * length of length | length of binary data | data
 * -------------------------------------------------------------------
 * [1000 0010]       [0000 0001] [1111 0100] [0xFF, 0xFF,.., 0xFF]
 */


/**
 * Invoke {@param cb} for each binary block in a {@param row}.
 * Callback parameters:
 * block: found block (without length prefix, only actual data)
 * start: start of the total block, including prefix
 * end: end of the block (this index is not included in the data)
 * iteration: number of the current block.
 * @returns {number} Total number of found blocks
 */
export function iterateBinaryBlocks(row: Uint8Array, cb: (block: Uint8Array, start: number, end: number, iteration: number) => void): number {
	let offset = 0
	let iterations = 0
	while (offset < row.length) {
		const block = decodeBinaryBlock(row, offset)
		const start = offset
		offset = block.byteOffset + block.length
		cb(block, start, offset, iterations++)
	}
	return iterations
}

/**
 * Remove specified {@param ranges} from the {@param row}.
 * In each range start is included, end is excluded (like in {@link iterateBinaryBlocks}.
 * Ranges should be ordered in ascending order and non-overlapping.
 * It is intended to be used with {@link iterateBinaryBlocks}.
 * @returns {Uint8Array} row with ranges removes and length reduced
 */
export function removeBinaryBlockRanges(row: Uint8Array, ranges: Array<[number, number]>): Uint8Array {
	let reducedLength = 0
	for (let i = ranges.length - 1; i >= 0; i--) {
		const [start, end] = ranges[i]
		row.copyWithin(start, end)
		reducedLength += (end - start)
	}
	return row.subarray(0, row.length - reducedLength)
}

/**
 * Encode all blocks from {@param source} and append into the {@param destination} (if present) or
 * into a new buffer.
 * @returns {Uint8Array} Resulting buffer
 */
export function appendBinaryBlocks(source: Uint8Array[], destination?: Uint8Array): Uint8Array {
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
		offset += encodeBinaryBlock(source[i], target, offset)
	}
	return target
}

/**
 * Encode (length and data itself) and write {@param entityData} into {@param target} at specified {@param offset}.
 * target must have enough space to fit encoded data (incl. length prefix).
 * @returns {number} New offset after the written block
 */
export function encodeBinaryBlock(entityData: Uint8Array, target: Uint8Array, offset: number): number {
	// Encode length as number (either as one byte or as length of length and length itself)
	const lengthOfPrefix = encodeNumberBlock(entityData.length, target, offset)
	target.set(entityData, offset + lengthOfPrefix)
	return lengthOfPrefix + entityData.length
}

/**
 * Encode number either in compact format (single byte) or in multiple bytes (length of number &
 * number itself). Maximum number which fits is 2^127 (it's large).
 * @param value
 * @param target
 * @param offset
 * @returns {number}
 */
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


export function decodeBinaryBlock(source: Uint8Array, offset: number): Uint8Array {
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