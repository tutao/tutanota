import { CustomCacheHandler } from "./CustomCacheHandler"
import { isSameId, sysTypeRefs } from "@tutao/typeRefs"
import { CacheStorage } from "../DefaultEntityRestCache"
import { difference } from "@tutao/utils"
import { SpamClassifierStorageFacade } from "../../facades/lazy/SpamClassifierStorageFacade"
import { GroupType } from "@tutao/appEnv"

/**
 * Handles tracking dropped memberships for users by clearing entities the user no longer has access to.
 */
export class CustomUserCacheHandler implements CustomCacheHandler<sysTypeRefs.User> {
	constructor(
		private readonly storage: CacheStorage,
		private readonly spamClassifierStorageFacade?: SpamClassifierStorageFacade,
	) {}

	async onBeforeCacheUpdate(newUser: sysTypeRefs.User) {
		const id = newUser._id
		const currentId = this.storage.getUserId()
		if (isSameId(currentId, id)) {
			const oldUser = await this.storage.get(sysTypeRefs.UserTypeRef, null, id)
			if (oldUser == null) {
				return
			}
			// When we are removed from a group, we just get an update for our user
			// with no membership on it. We need to clean up all the entities that
			// belong to that group since we shouldn't be able to access them anymore,
			// and we won't get any update or another chance to clean them up.
			const removedShips = difference(oldUser.memberships, newUser.memberships, (l, r) => l._id === r._id)
			for (const ship of removedShips) {
				console.log("Lost membership on ", ship._id, ship.groupType)
				await this.storage.deleteAllOwnedBy(ship.group)
				if (ship.groupType === GroupType.Mail) {
					await this.spamClassifierStorageFacade?.deleteSpamClassificationModel(ship.group)
				}
			}
		}
	}
}
