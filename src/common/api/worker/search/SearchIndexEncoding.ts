/**
 * @fileoverview SearchIndexEncoding: binary encoding for certain search index columns
 *
 * <b>Purpose</b>
 *
 * We use it primarily because storing data in many tiny {@code Uint8Array}'s is very inefficient,
 * mostly GC wise. Not only many objects create GC pressure by themselves, but they also consume
 * much more memory because each element has a lot of pointers.
 * Besides that, this encoding can encode certain thing with very little space. E.g. let's say
 * you want to encode object like {@code {app: 1, type: 10234}}. You could convert it to JSON,
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
 * <pre>
 * number | bytes
 * ––––––––––––––––
 * 3      | [0000 0011]
 * 127    | [0111 1111]
 * 128    | [1000 0001] [1000 0000]
 * 10234  | [1000 0002] [0010 0111][1111 1010]
 * </pre>
 *
 * For binary blocks we use similar principle. First we encode length of the binary data
 * in the number format described above (as number of used bytes). After that we write binary data.
 * <pre>[length of first block][binary block] [length of second block] [binary block] ... [length of n block][binary block]</pre>
 *
 * Example:
 * <pre>
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
 * </pre>
 *
 * <b>Interface</b>
 * In many functions we pass offset instead of passing a subarray. We do this to allocate less objects
 * ({@code Uint8Array}'s are quite expensive).
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
		reducedLength += end - start
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
 * target must have enough space to fit encoded data (incl. length prefix). {@see calculateNeededSpace}.
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
 * Target should have enough space {@see calculateNeededSpaceForNumber}.
 * @param value the number to encode
 * @param target where to put encoded number
 * @param offset where to put encoded number
 * @returns {number} offset after the encoded number
 */
export function encodeNumberBlock(value: number, target: Uint8Array, offset: number): number {
	// If value is less than 127 (7 bits), just write it as is
	if (value <= 0x7f) {
		target[offset] = value
		return 1
	} else {
		// If number doesn't fit into seven bits, then first write it's length into this 7 bits
		// and then the number itself.
		// How many bytes we need to store the number
		const length = numberOfBytes(value)
		let remainingValue = value
		// Set highest bit to 1
		target[offset] = length | 0x80

		for (let i = 0; i < length; i++) {
			const bytePosition = offset + length - i

			// If what's left doesn't fit into this byte, split it
			if (remainingValue > 0xff) {
				// like shifting right by 8 but without overflows
				target[bytePosition] = remainingValue % 256
				remainingValue = Math.floor(remainingValue / 256)
			} else {
				// if it does fit, write it
				target[bytePosition] = remainingValue
			}
		}

		// One bit for length
		return length + 1
	}
}

/**
 * Read end decode binary block. Returned block shares buffer with {@param source}.
 * @param source Where to read data from
 * @param offset At which offset to read data from
 * @returns {Uint8Array} Decoded data (without length prefix)
 */
export function decodeBinaryBlock(source: Uint8Array, offset: number): Uint8Array {
	let blockLength = decodeNumberBlock(source, offset)
	let numberLength = calculateNeededSpaceForNumber(blockLength)
	return source.subarray(offset + numberLength, offset + numberLength + blockLength)
}

/**
 * Read and decode number block. We don't return the length of the encoded number to
 * not allocate anything. Check {@code source[0]} or use
 * {@link calculateNeededSpaceForNumber}.
 * @param source Where to read number from
 * @param offset At which offset to read number
 * @returns {number} Decoded number
 */
export function decodeNumberBlock(source: Uint8Array, offset: number): number {
	// Check the first bit. If it's 1, it's a long number, if it's not it's
	// a short one.
	const markerBit = source[offset] & 0x80

	if (markerBit === 0x80) {
		// Clear the first bit to get the length of number
		const numberLength = source[offset] & 0x7f
		let value = 0

		for (let i = 0; i < numberLength; i++) {
			// Like shifting left but without overflows
			value = value * 256
			value += source[offset + i + 1]
		}

		return value
	} else {
		// Just return the number
		return source[offset]
	}
}

/**
 * Precalculate how much space do we need to write encoded blocks of {@param data}.
 * @returns {number} Number of bytes which we need to write encoded data.
 */
export function calculateNeededSpace(data: Uint8Array[]): number {
	return data.reduce((acc, entry) => {
		// Prefix is just a length of data in bytes (in short or a long form)
		let lengthOfPrefix = calculateNeededSpaceForNumber(entry.length)
		return acc + entry.length + lengthOfPrefix
	}, 0)
}

/**
 * Find out how many bytes do we need to encode {@param value}
 */
export function calculateNeededSpaceForNumber(value: number): number {
	// If it's small, it fits into one byte
	// otherwise it's number of bytes to represent the number plus length
	return value <= 0x7f ? 1 : numberOfBytes(value) + 1
}

export function calculateNeededSpaceForNumbers(numbers: Array<number>): number {
	return numbers.reduce((acc, n) => acc + calculateNeededSpaceForNumber(n), 0)
}

/**
 * Number of bytes needed to encode the number
 */
export function numberOfBytes(number: number): number {
	return Math.ceil(Math.log2(number + 1) / 8)
}

/**
 * Read array of encoded numbers. Assumes that they're in the end of the {@param binaryNumbers}!
 * @param binaryNumbers Block with numbers encoded
 * @param offset At which offset to read numbers
 * @returns {Array<number>} Numbers which have been read
 */
export function decodeNumbers(binaryNumbers: Uint8Array, offset: number = 0): number[] {
	const numbers: number[] = []

	while (offset < binaryNumbers.length) {
		const number = decodeNumberBlock(binaryNumbers, offset)
		numbers.push(number)
		offset += calculateNeededSpaceForNumber(number)
	}

	return numbers
}

/**
 * Encode array of numbers. Doesn't write how many numbers there are.
 * @param numbers Numbers to encode
 * @param target Where to write them
 * @param offset At which offset they should be written
 */
export function encodeNumbers(numbers: number[], target: Uint8Array, offset: number = 0): void {
	for (const number of numbers) {
		offset += encodeNumberBlock(number, target, offset)
	}
}
