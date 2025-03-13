import { CustomCacheHandler } from "./CustomCacheHandler"
import { User, UserTypeRef } from "../../../entities/sys/TypeRefs"
import { CacheStorage } from "../DefaultEntityRestCache"
import { isSameId } from "../../../common/utils/EntityUtils"
import { difference } from "@tutao/tutanota-utils"

/**
 * Handles tracking dropped memberships for users by clearing entities the user no longer has access to.
 */
export class CustomUserCacheHandler implements CustomCacheHandler<User> {
	constructor(private readonly storage: CacheStorage) {}

	async onBeforeUpdate(newUser: User) {
		const id = newUser._id
		const currentId = this.storage.getUserId()
		if (isSameId(currentId, id)) {
			const oldUser = await this.storage.get(UserTypeRef, null, id)
			if (oldUser == null) {
				return
			}
			// When we are removed from a group we just get an update for our user
			// with no membership on it. We need to clean up all the entities that
			// belong to that group since we shouldn't be able to access them anymore
			// and we won't get any update or another chance to clean them up.
			const removedShips = difference(oldUser.memberships, newUser.memberships, (l, r) => l._id === r._id)
			for (const ship of removedShips) {
				console.log("Lost membership on ", ship._id, ship.groupType)
				await this.storage.deleteAllOwnedBy(ship.group)
			}
		}
	}
}
