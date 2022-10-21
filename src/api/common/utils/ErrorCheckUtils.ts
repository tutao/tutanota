import {downcast} from "@tutao/tutanota-utils"
import {Entity} from "../EntityTypes"
import {ConnectionError} from "../error/RestError.js"
import {LoginIncompleteError} from "../error/LoginIncompleteError.js"

/**
 * Checks if the given instance has an error in the _errors property which is usually written
 * if decryption fails for some reason in InstanceMapper.
 * @param instance the instance to check for errors.
 * @param key only returns true if there is an error for this key. Other errors will be ignored if the key is defined.
 * @returns {boolean} true if error was found (for the given key).
 */
export function hasError<K>(instance: Entity, key?: K): boolean {
	const downCastedInstance = downcast(instance)
	return !instance || (!!downCastedInstance._errors && (!key || !!downCastedInstance._errors.key))
}

/**
 * Checks whether {@param e} is an error that can error before we are fully logged in and connected.
 */
export function isOfflineError(e: Error) {
	return e instanceof ConnectionError || e instanceof LoginIncompleteError
}