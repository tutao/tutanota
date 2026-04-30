import { SomeEntity, sysTypeRefs, TypeRef } from "@tutao/typerefs"

export interface CacheManagementInterface {
	/**
	 * Refreshes group and user (because of the memberships) in the rest cache and updates the key cache if possible.
	 * @param groupId
	 */
	refreshKeyCache(groupId: Id): Promise<{ user: sysTypeRefs.User; group: sysTypeRefs.Group }>

	/**
	 * Refreshes a group in the rest cache.
	 * @param groupId
	 */
	reloadGroup(groupId: Id): Promise<sysTypeRefs.Group>

	reloadUser(): Promise<sysTypeRefs.User>

	/**
	 * Tries updating the user group key in the key cache by loading and decrypting the UserGroupKeyDistribution entity.
	 */
	tryUpdatingUserGroupKey(): Promise<void>

	/**
	 * Delete a cached entity. Sometimes this is necessary to do to ensure you always load the new version
	 */
	deleteFromCacheIfExists<T extends SomeEntity>(typeRef: TypeRef<T>, listId: Id | null, elementId: Id): Promise<void>
}
