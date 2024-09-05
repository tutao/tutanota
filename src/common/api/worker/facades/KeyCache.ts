import { getFromMap, neverNull } from "@tutao/tutanota-utils"
import { User } from "../../entities/sys/TypeRefs.js"
import { VersionedKey } from "../crypto/CryptoWrapper.js"
import { Aes256Key } from "@tutao/tutanota-crypto"

/**
 * A cache for decrypted current keys of each group. Encrypted keys are stored on membership.symEncGKey.
 * */
export class KeyCache {
	private currentGroupKeys: Map<Id, Promise<VersionedKey>> = new Map<Id, Promise<VersionedKey>>()
	// the user group key is password encrypted and stored on a special membership
	// also it is used to decrypt the rest of the keys therefore it requires some special handling
	private currentUserGroupKey: VersionedKey | null = null
	// the new user group key will be re-encrypted with this key to distribute the rotated user group key without asking for the password
	private userGroupKeyDistributionKey: Aes256Key | null = null

	setCurrentUserGroupKey(newUserGroupKey: VersionedKey) {
		if (this.currentUserGroupKey != null && this.currentUserGroupKey.version > newUserGroupKey.version) {
			console.log("Tried to set an outdated user group key")
			return
		}
		this.currentUserGroupKey = newUserGroupKey
	}

	getCurrentUserGroupKey(): VersionedKey | null {
		return this.currentUserGroupKey
	}

	setUserGroupKeyDistributionKey(userGroupKeyDistributionKey: Aes256Key) {
		this.userGroupKeyDistributionKey = userGroupKeyDistributionKey
	}

	getUserGroupKeyDistributionKey(): Aes256Key | null {
		return this.userGroupKeyDistributionKey
	}

	/**
	 *
	 * @param groupId MUST NOT be the user group id
	 * @param keyLoader a function to load and decrypt the group key if it is not cached
	 */
	getCurrentGroupKey(groupId: Id, keyLoader: () => Promise<VersionedKey>): Promise<VersionedKey> {
		return getFromMap(this.currentGroupKeys, groupId, async () => {
			return keyLoader()
		})
	}

	reset() {
		this.currentGroupKeys = new Map<Id, Promise<VersionedKey>>()
		this.currentUserGroupKey = null
		this.userGroupKeyDistributionKey = null
	}

	/**
	 * Clears keys from the cache which are outdated or where we do no longer hava a membership.
	 * An outdated user membership is ignored and should be processed by the UserGroupKeyDistribution update.
	 * @param user updated user with up-to-date memberships
	 */
	async removeOutdatedGroupKeys(user: User) {
		const currentUserGroupKeyVersion = neverNull(this.getCurrentUserGroupKey()).version
		const receivedUserGroupKeyVersion = Number(user.userGroup.groupKeyVersion)
		if (receivedUserGroupKeyVersion > currentUserGroupKeyVersion) {
			//we just ignore this as the same batch MUST have a UserGroupKeyDistribution entity event update
			console.log(`Received user update with new user group key version: ${currentUserGroupKeyVersion} -> ${receivedUserGroupKeyVersion}`)
		}

		const newCurrentGroupKeyCache = new Map<Id, Promise<VersionedKey>>()
		for (const membership of user.memberships) {
			const cachedGroupKey = this.currentGroupKeys.get(membership.group)
			if (cachedGroupKey != null && Number(membership.groupKeyVersion) === (await cachedGroupKey).version) {
				await getFromMap(newCurrentGroupKeyCache, membership.group, () => cachedGroupKey)
			}
		}
		this.currentGroupKeys = newCurrentGroupKeyCache
	}
}
