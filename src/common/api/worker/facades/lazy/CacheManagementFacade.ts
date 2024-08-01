import { Group, GroupKeyTypeRef, GroupTypeRef, User, UserGroupKeyDistributionTypeRef, UserTypeRef } from "../../../entities/sys/TypeRefs.js"
import { EntityClient } from "../../../common/EntityClient.js"
import { assertWorkerOrNode } from "../../../common/Env.js"
import { UserFacade } from "../UserFacade.js"
import { DefaultEntityRestCache } from "../../rest/DefaultEntityRestCache.js"
import { isSameId } from "../../../common/utils/EntityUtils.js"

assertWorkerOrNode()

/**
 * This facade is responsible for handling cases where we need to manually update an entity in the rest cache.
 * It is also suitable to manually ensure consistency between the rest cache and the key cache.
 */
export class CacheManagementFacade {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly cachingEntityClient: EntityClient,
		private readonly entityRestCache: DefaultEntityRestCache,
	) {}

	/**
	 * Refreshes group and user (because of the memberships) in the rest cache and updates the key cache if possible.
	 * @param groupId
	 */
	async refreshKeyCache(groupId: Id): Promise<{ user: User; group: Group }> {
		const group = await this.reloadGroup(groupId)
		const user = await this.reloadUser()
		if (isSameId(groupId, this.userFacade.getUserGroupId())) {
			await this.tryUpdatingUserGroupKey()
		}
		return { user, group }
	}

	/**
	 * Refreshes a group in the rest cache.
	 * @param groupId
	 */
	async reloadGroup(groupId: Id): Promise<Group> {
		await this.entityRestCache.deleteFromCacheIfExists(GroupKeyTypeRef, null, groupId)
		return await this.cachingEntityClient.load(GroupTypeRef, groupId)
	}

	/*
	 * Deletes the logged-in user from the cache, and reloads and returns the new user object.
	 * Is used to ensure we have the latest version, there can be times when the object becomes a little outdated, resulting in errors.
	 * It also ensures that the key cache is updated.
	 */
	async reloadUser(): Promise<User> {
		const userId = this.userFacade.getLoggedInUser()._id

		await this.entityRestCache.deleteFromCacheIfExists(UserTypeRef, null, userId)

		const user = await this.cachingEntityClient.load(UserTypeRef, userId)
		await this.userFacade.updateUser(user) // updates the key cache too

		return user
	}

	/**
	 * Tries updating the user group key in the key cache by loading and decrypting the UserGroupKeyDistribution entity.
	 */
	async tryUpdatingUserGroupKey() {
		// this handles updates of the user group key which is also stored on the user as a membership
		// we might not have access to the password to decrypt it, though. therefore we handle it here
		try {
			// Note that UserGroupKeyDistribution is never cached in the rest cache. no need to delete it
			const userGroupKeyDistribution = await this.cachingEntityClient.load(UserGroupKeyDistributionTypeRef, this.userFacade.getUserGroupId())
			this.userFacade.updateUserGroupKey(userGroupKeyDistribution)
		} catch (e) {
			// we do not want to fail here, as this update might be an outdated entity update
			// in case we only process updates after a longer period of being offline
			// in such case we should have set the correct user group key already during the regular login
			console.log("Could not update user group key", e)
		}
	}
}
