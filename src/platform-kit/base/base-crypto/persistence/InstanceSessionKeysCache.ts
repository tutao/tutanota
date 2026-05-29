import { Entity } from "@tutao/meta"
import { InstanceSessionKey } from "@tutao/entities/sys"
import { Nullable } from "@tutao/utils"

export interface InstanceSessionKeysCache {
	/**
	 * Puts the InstanceSessionKeys into the cache and overrides existing entries
	 */
	put(mainInstance: Entity, instanceSessionKeys: Array<InstanceSessionKey>): void

	/**
	 * Return a cached InstanceSessionKeys or null if it is not cached.
	 */
	get(mainInstance: Entity): Nullable<Array<InstanceSessionKey>>

	delete(mainInstance: Entity): void
}
