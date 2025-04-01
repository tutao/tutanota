import sjcl from "../internal/sjcl.js"
import { uint8ArrayToBitArray } from "./Utils.js"

function assertByte(n: number): number {
	if (n < 0 || n > 255) throw new Error("number is not in the byte range")
	else return n
}

/**
 * Compares two bytes in constant time.
 * @param leftByte A number in the range 0-255, i.e., a byte
 * @param rightByte A number in the range 0-255, i.e., a byte
 */
export function constantTimeByteEquals(leftByte: number, rightByte: number): boolean {
	const left = assertByte(leftByte)
	const right = assertByte(rightByte)

	// see https://stackoverflow.com/questions/17603487/how-does-constanttimebyteeq-work

	let res = ~(left ^ right)
	res = res & 255 // zero out everything left of our byte
	// >>> ensures the left-most bits will be filled with zeroes, as opposed to whatever value
	// was at the left, like *some* bit shifters do (looking at you, >>)
	res &= res >>> 4
	res &= res >>> 2
	res &= res >>> 1

	return res === 1
}

/**
 * Compares two Uint8Arrays in constant time.
 * The only short-circuit is on the length, because this is intended to be used on fixed length arrays.
 * @param left
 * @param right
 */
export function constantTimeUint8ArrayEqualsWithFancyByteLevelConstantTimeness(left: Uint8Array, right: Uint8Array): boolean {
	if (left.length !== right.length) {
		return false
	}
	let acc = true
	for (let i = 0; i < left.length; i++) {
		// evaluate byte comparison first so as not to short-circuit the whole thing
		acc = constantTimeByteEquals(left[i], right[i]) && acc
	}
	return acc
}

/**
 * Compares two Uint8Arrays in ~~constant time~~ a predictable amount of time via SJCL.
 * @param left
 * @param right
 */
export function constantTimeUint8ArrayEquals(left: Uint8Array, right: Uint8Array): boolean {
	return sjcl.bitArray.equal(uint8ArrayToBitArray(left), uint8ArrayToBitArray(right))
}
