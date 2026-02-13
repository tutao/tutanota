import { DEFAULT_VECTOR_MAX_LENGTH, MAX_WORD_FREQUENCY } from "./SpamMailProcessor"

/**
 * Example:
 *
 * const vector = [0,0,7,0,0,4,4,0,0]
 *
 * const compressedSparseVector = {
 *    indices: [2, 5, 6],
 *    values: [7, 4, 4]
 * }
 */
export type CompressedSparseVector = {
	indices: number[] // this can be UInt16 (max. 2048) (delta encoding still doesn't guarantee values would be below 256 so we cannot use it + UInt8?)
	values: number[] // values: [val, val, ...] (values are limited to [0..32] range
}

/**
 * Class for compressing and decompressing sparse numerical vectors using delta encoding
 * and run-length encoding techniques. This allows efficient storage and manipulation of
 * sparse data by reducing unnecessary memory usage.
 */
export class SparseVectorCompressor {
	constructor(public readonly dimension: number = DEFAULT_VECTOR_MAX_LENGTH) {}

	public compress(vector: number[]): Uint8Array {
		const compressedSparseVector = this.compressToCompressedSparseVector(vector)
		const result: number[] = new Array(compressedSparseVector.indices.length)

		for (let i = 0; i < compressedSparseVector.indices.length; i++) {
			const index = compressedSparseVector.indices[i]
			const value = compressedSparseVector.values[i]

			result[i] = ((index & 0x7ff) << 5) | (value & 0x1f)
		}
		return new Uint8Array(new Uint16Array(result).buffer)
	}

	public decompress(binary: Uint8Array, outputSize: number): number[] {
		const vector = new Array(outputSize).fill(0)
		const array = new Uint16Array(binary.buffer)

		for (let i = 0; i < array.length; i++) {
			const packedValue = array[i]
			const index = (packedValue >> 5) & 0x7ff // Extract 11 bits for index
			const value = packedValue & 0x1f // Extract 5 bits for value

			vector[index] = value
		}
		return vector
	}
	public encodeCompressedVectorLength(length: number): Uint8Array {
		let arr = new Uint8Array(2)
		arr[0] = length & 0xff
		arr[1] = (length >> 8) & 0xff
		return arr
	}

	public decodeCompressedVectorLength(encodedLength: Uint8Array): number {
		const lowerSignificantNumber = encodedLength[0]
		const higherSignificantNumber = encodedLength[1] << 8
		return lowerSignificantNumber + higherSignificantNumber
	}

	/**
	 * Converts a dense vector to flat sparse form: { indices, values }
	 */
	private compressToCompressedSparseVector(vector: number[]): CompressedSparseVector {
		const indices: number[] = []
		const values: number[] = []
		for (let i = 0; i < vector.length; i++) {
			const val = vector[i]
			if (val !== 0) {
				indices.push(i)
				values.push(Math.min(val, MAX_WORD_FREQUENCY))
			}
		}
		return { indices, values }
	}
}
