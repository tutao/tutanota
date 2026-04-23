import { assertNotNull, Nullable } from "@tutao/utils"
import { Entity, sysTypeRefs } from "@tutao/typerefs"

/**
 * This caches instanceSessionKeys (payload to UpdateInstanceSessionKeyService) for instances with bucketKeys
 */
export class InstanceSessionKeysCache {
	// string representation of the Id | IdTuple of the instance with the bucket key -> InstanceSessionKeys for the main and the child instances
	private readonly cache: Map<string, Array<sysTypeRefs.InstanceSessionKey>> = new Map<string, Array<sysTypeRefs.InstanceSessionKey>>()
	constructor() {}

	/**
	 * Puts the InstanceSessionKeys into the cache and overrides existing entries
	 */
	put(mainInstance: Entity, instanceSessionKeys: Array<sysTypeRefs.InstanceSessionKey>) {
		const lookupKey = this.makeLookupKey(mainInstance)
		this.cache.set(lookupKey, instanceSessionKeys)
	}

	/**
	 * Return a cached InstanceSessionKeys or null if it is not cached.
	 */
	get(mainInstance: Entity): Nullable<Array<sysTypeRefs.InstanceSessionKey>> {
		const lookupKey = this.makeLookupKey(mainInstance)
		return this.cache.get(lookupKey) ?? null
	}

	delete(mainInstance: Entity) {
		const lookupKey = this.makeLookupKey(mainInstance)
		this.cache.delete(lookupKey)
	}

	private makeLookupKey(mainInstance: Entity): string {
		return assertNotNull(mainInstance["_id"]).toString()
	}
}
