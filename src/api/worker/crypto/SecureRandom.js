// @flow
import {random} from "./Randomizer"
import {assertWorkerOrNode} from "../../Env"

assertWorkerOrNode()

/**
 * This is the adapter to the PRNG interface required by JSBN.
 * @constructor
 */
export class SecureRandom {

	/**
	 * Only this function is used by jsbn for getting random bytes. Each byte is a value between 0 and 255.
	 * @param array An array to fill with random bytes. The length of the array defines the number of bytes to create.
	 */
	nextBytes(array: number[]) {
		let bytes = random.generateRandomData(array.length)
		for (var i = 0; i < array.length; i++) {
			array[i] = bytes[i];
		}
	}
}