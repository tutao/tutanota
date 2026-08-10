import { assertNotNull, Nullable } from "../../../utils"
import { PersistentEntity } from "../../../meta/EntityTypes"
import { InstanceSessionKey } from "@tutao/entities/sys"

/**
 * This caches instanceSessionKeys (payload to UpdateInstanceSessionKeyService) for instances with bucketKeys
 */
export class InstanceSessionKeysCache {
	// string representation of the Id | IdTuple of the instance with the bucket key -> InstanceSessionKeys for the main and the child instances
	private readonly cache: Map<string, Array<InstanceSessionKey>> = new Map<string, Array<InstanceSessionKey>>()
	constructor() {}

	/**
	 * Puts the InstanceSessionKeys into the cache and overrides existing entries
	 */
	put<T extends PersistentEntity<T>>(mainInstance: T, instanceSessionKeys: Array<InstanceSessionKey>) {
		const lookupKey = this.makeLookupKey(mainInstance)
		this.cache.set(lookupKey, instanceSessionKeys)
	}

	/**
	 * Return a cached InstanceSessionKeys or null if it is not cached.
	 */
	get<T extends PersistentEntity<T>>(mainInstance: T): Nullable<Array<InstanceSessionKey>> {
		const lookupKey = this.makeLookupKey(mainInstance)
		return this.cache.get(lookupKey) ?? null
	}

	delete<T extends PersistentEntity<T>>(mainInstance: T) {
		const lookupKey = this.makeLookupKey(mainInstance)
		this.cache.delete(lookupKey)
	}

	private makeLookupKey<T extends PersistentEntity<T>>(mainInstance: T): string {
		return assertNotNull(mainInstance["_id"]).toString()
	}
}
