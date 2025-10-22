import { arrayHashUnsigned, downcast, promiseMap, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { stringToHashBucketFast, tensor1d } from "./tensorflow-custom"

export class HashingVectorizer {
	private readonly hasher: (tokens: Array<string>) => Promise<Array<number>> = this.tensorHash

	constructor(public readonly dimension: number = 2048) {}

	public async vectorize(tokens: ReadonlyArray<string>): Promise<number[]> {
		const vector = new Array(this.dimension).fill(0)

		const indexes = await this.hasher(downcast<Array<string>>(tokens))
		for (const index of indexes) {
			vector[index] += 1
		}

		return vector
	}

	public async transform(preprocessedMails: Array<ReadonlyArray<string>>): Promise<number[][]> {
		return await promiseMap(preprocessedMails, (preprocessedMail) => this.vectorize(preprocessedMail), { concurrency: 1 })
	}

	/**
	 * Best hasher for our use case (lowest amount of FP):
	 * Confusion Matrix:
	 * {
	 *   Predicted_Spam: { True_Positive: 76, False_Positive: 3 },
	 *   Predicted_Ham: { False_Negative: 13, True_Negative: 543 }
	 * }
	 */
	private async tensorHash(array: Array<string>): Promise<Array<number>> {
		const inputTensor = tensor1d(array, "string")
		const rankTensor = stringToHashBucketFast(inputTensor, this.dimension)
		const resultArray = (await rankTensor.array()) as Array<number>

		// When using the webgl backend we need to manually dispose @tensorflow tensors
		inputTensor.dispose()
		rankTensor.dispose()

		return resultArray
	}

	/**
	 * Fastest Hasher but not as accurate
	 * Confusion Matrix:
	 * {
	 *   Predicted_Spam: { True_Positive: 76, False_Positive: 5 },
	 *   Predicted_Ham: { False_Negative: 13, True_Negative: 541 }
	 * }
	 */
	public async unsignedHash(array: Array<string>): Promise<Array<number>> {
		return array.map((token) => arrayHashUnsigned(stringToUtf8Uint8Array(token)))
	}
}

// TODO think about using UInt8Array and UInt16Array if applicable
export type CompressedSparseVector = {
	indices: number[] // this can be UInt16 (max. 2048) (delta encoding still doesn't guarantee values would be below 256 so we cannot use it + UInt8?)
	rleValues: number[] // RLE-encoded values: [val, count, val, count, ...] (this can most likely be UInt8 [can we assume vals and counts are max 256?])
}

type FlatSparseVector = {
	indices: number[] // this can be UInt16 (max. 2048)
	values: number[] // this can most likely be UInt8 [can we assume vals are max 256?]
}

/**
 * Class for compressing and decompressing sparse numerical vectors using delta encoding
 * and run-length encoding techniques. This allows efficient storage and manipulation of
 * sparse data by reducing unnecessary memory usage.
 */
export class SparseVectorCompressor {
	constructor(private dimension: number = 2048) {}

	/**
	 * Compresses a given numerical vector into a CompressedSparseVector format using delta encoding and run-length encoding.
	 *
	 * @param vector The numerical vector to be compressed.
	 * @return A CompressedSparseVector object containing delta-encoded indices and run-length encoded values.
	 */
	public compressVector(vector: number[]): CompressedSparseVector {
		const { indices, values } = this.toFlatSparse(vector)
		const rleValues = this.rleEncode(values)
		return { indices: indices, rleValues }
	}

	/**
	 * Decompresses a compressed sparse vector into a dense numeric array.
	 *
	 * @param {CompressedSparseVector} compressed - The compressed sparse vector containing delta-encoded indices and run-length encoded values.
	 * @return {number[]} The decompressed dense numeric array.
	 */
	public decompressVector(compressed: CompressedSparseVector): number[] {
		const values = this.rleDecode(compressed.rleValues)
		return this.toDense({ indices: compressed.indices, values })
	}

	/**
	 * Converts a dense vector to flat sparse form: { indices, values }
	 */
	private toFlatSparse(vector: number[]): FlatSparseVector {
		const indices: number[] = []
		const values: number[] = []
		for (let i = 0; i < vector.length; i++) {
			const val = vector[i]
			if (val !== 0) {
				indices.push(i)
				values.push(val)
			}
		}
		return { indices, values }
	}

	/**
	 * Rebuilds a dense vector from flat sparse data.
	 */
	private toDense(flatSparseVector: FlatSparseVector): number[] {
		const { indices, values } = flatSparseVector
		const dense = new Array(this.dimension).fill(0)
		for (let i = 0; i < indices.length; i++) {
			dense[indices[i]] = values[i]
		}
		return dense
	}

	/**
	 * Run-length encode values: [val, count, val, count, ...]
	 */
	public rleEncode(values: number[]): number[] {
		const result: number[] = []
		let i = 0
		while (i < values.length) {
			let count = 1
			while (i + count < values.length && values[i] === values[i + count]) {
				count++
			}
			result.push(values[i], count)
			i += count
		}
		return result
	}

	/**
	 * Run-length decode back to flat values
	 */
	public rleDecode(rle: number[]): number[] {
		const values: number[] = []
		for (let i = 0; i < rle.length; i += 2) {
			const val = rle[i]
			const count = rle[i + 1]
			for (let j = 0; j < count; j++) {
				values.push(val)
			}
		}
		return values
	}
}

// Fixme move these to Encoding.ts
export function uint8ArrayToNumberArrayFixed(uint8: Uint8Array, bytesPerNumber: number = 2): number[] {
	if (uint8.length % bytesPerNumber !== 0) {
		throw new Error("Invalid Uint8Array length for fixed-size decoding")
	}

	const result: number[] = []
	for (let i = 0; i < uint8.length; i += bytesPerNumber) {
		let value = 0
		for (let j = 0; j < bytesPerNumber; j++) {
			value = (value << 8) | uint8[i + j]
		}
		result.push(value)
	}

	return result
}

export function numberArrayToUint8ArrayFixed(numbers: number[], bytesPerNumber: number = 2): Uint8Array {
	if (bytesPerNumber < 1 || bytesPerNumber > 8) {
		throw new Error("bytesPerNumber must be between 1 and 8")
	}

	const totalBytes = numbers.length * bytesPerNumber
	const result = new Uint8Array(totalBytes)

	for (const [index, num] of numbers.entries()) {
		if (!Number.isInteger(num) || num < 0) {
			throw new Error(`Only non-negative integers supported. Invalid: ${num}`)
		}

		let value = num
		const offset = index * bytesPerNumber

		for (let i = bytesPerNumber - 1; i >= 0; i--) {
			result[offset + i] = value & 0xff
			value >>= 8
		}

		if (value > 0) {
			throw new Error(`Number ${num} exceeds the range for ${bytesPerNumber} bytes`)
		}
	}

	return result
}
