import type {HttpMethodEnum} from "../../src/api/common/EntityFunctions"
import type {EntropySrcEnum} from "../../src/api/common/TutanotaConstants"
import {TypeRef} from "../../src/api/common/utils/TypeRef";

/**
 * This Interface provides an abstraction of the random number generator implementation.
 */
interface ClientRandomizer {
	/**
	 * Adds entropy to the random number generator algorithm
	 * @param number Any number value.
	 * @param entropy The amount of entropy in the number in bit.
	 * @param source The source of the number. One of RandomizerInterface.ENTROPY_SRC_*.
	 */
	addEntropy(number: number, entropy: number, source: EntropySrcEnum): void;

	/**
	 * Verifies if the randomizer is ready to serve.
	 * @return true, if it is ready, false otherwise.
	 */
	isReady(): boolean;

	/**
	 * Generates random data. The function initRandomDataGenerator must have been called prior to the first call to this function.
	 * @param nbrOfBytes The number of bytes the random data shall have.
	 * @return A hex coded string of random data.
	 * @throws {CryptoError} if the randomizer is not seeded (isReady == false)
	 */
	generateRandomData(nbrOfBytes: number): Uint8Array;
}

interface ProgressListener {
	upload(percent: number): void;

	download(percent: number): void;
}

interface EventBusListener {
	/**
	 * Notifies the listener that new data has been received.
	 * @param data The update notification.
	 */
	notifyNewDataReceived(data: EntityUpdate): void;

	/**
	 * Notifies a listener about the reconnect event,
	 */
	notifyReconnected(): void;
}


