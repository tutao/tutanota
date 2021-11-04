// @flow

import type {SomeEntity} from "../../main/Entity"
import {downcast} from "@tutao/tutanota-utils"

/**
 * Checks if the given instance has an error in the _errors property which is usually written
 * if decryption fails for some reason in InstanceMapper.
 * @param instance the instance to check for errors.
 * @param key only returns true if there is an error for this key. Other errors will be ignored if the key is defined.
 * @returns {boolean} true if error was found (for the given key).
 */
export function hasError<K>(instance: SomeEntity, key: ?K): boolean {
	const downCastedInstance = downcast(instance)
	return !instance || (!!downCastedInstance._errors && (!key || !!downCastedInstance._errors.key))
}