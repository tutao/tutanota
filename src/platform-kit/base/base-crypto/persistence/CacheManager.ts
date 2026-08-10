import { Group, User } from "@tutao/entities/sys"
import { PersistentEntity, TypeRef } from "@tutao/meta"

export type UserAndGroup = { user: User; group: Group }

export interface CacheManager {
	/**
	 * Refreshes group and user (because of the memberships) in the rest cache and updates the key cache if possible.
	 * @param groupId
	 */
	refreshKeyCache(groupId: Id): Promise<UserAndGroup>

	/**
	 * Refreshes a group in the rest cache.
	 * @param groupId
	 */
	reloadGroup(groupId: Id): Promise<Group>

	reloadUser(): Promise<User>

	/**
	 * Tries updating the user group key in the key cache by loading and decrypting the UserGroupKeyDistribution entity.
	 */
	tryUpdatingUserGroupKey(): Promise<void>

	/**
	 * Delete a cached entity. Sometimes this is necessary to do to ensure you always load the new version
	 */
	deleteFromCacheIfExists<T extends PersistentEntity<T>>(typeRef: TypeRef<T>, listId: Id | null, elementId: Id): Promise<void>
}
