import { GroupType } from "../../common/TutanotaConstants"
import { AesKey, decryptKey, hkdf, KEY_LENGTH_BYTES_AES_256, keyToUint8Array, sha256Hash, uint8ArrayToKey } from "@tutao/tutanota-crypto"
import { assertNotNull, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { ProgrammingError } from "../../common/error/ProgrammingError"
import { createWebsocketLeaderStatus, GroupMembership, User, UserGroupKeyDistribution, WebsocketLeaderStatus } from "../../entities/sys/TypeRefs"
import { LoginIncompleteError } from "../../common/error/LoginIncompleteError"
import { VersionedKey } from "../crypto/CryptoFacade.js"
import { isSameId } from "../../common/utils/EntityUtils.js"
import { KeyCache } from "./KeyCache.js"

export interface AuthDataProvider {
	/**
	 * @return The map which contains authentication data for the logged-in user.
	 */
	createAuthHeaders(): Dict

	isFullyLoggedIn(): boolean
}

const USER_GROUP_KEY_DISTRIBUTION_KEY_INFO = "userGroupKeyDistributionKey"

/** Holder for the user and session-related data on the worker side. */
export class UserFacade implements AuthDataProvider {
	private user: User | null = null
	private accessToken: string | null = null
	private leaderStatus!: WebsocketLeaderStatus

	constructor(private readonly keyCache: KeyCache) {
		this.reset()
	}

	// Login process is somehow multi-step, and we don't use a separate network stack for it. So we have to break up setters.
	// 1. We need to download user. For that we need to set access token already (to authenticate the request for the server as it is passed in headers).
	// 2. We need to get group keys. For that we need to unlock userGroupKey with userPassphraseKey
	// so this leads to this steps in UserFacade:
	// 1. Access token is set
	// 2. User is set
	// 3. UserGroupKey is unlocked
	setAccessToken(accessToken: string | null) {
		this.accessToken = accessToken
	}

	getAccessToken(): string | null {
		return this.accessToken
	}

	setUser(user: User) {
		if (this.accessToken == null) {
			throw new ProgrammingError("invalid state: no access token")
		}
		this.user = user
	}

	unlockUserGroupKey(userPassphraseKey: AesKey) {
		if (this.user == null) {
			throw new ProgrammingError("Invalid state: no user")
		}
		const userGroupMembership = this.user.userGroup
		const currentUserGroupKey = {
			version: Number(userGroupMembership.groupKeyVersion),
			object: decryptKey(userPassphraseKey, userGroupMembership.symEncGKey),
		}
		this.keyCache.setCurrentUserGroupKey(currentUserGroupKey)
		this.setUserGroupKeyDistributionKey(userPassphraseKey)
	}

	setUserGroupKeyDistributionKey(userPassphraseKey: number[]) {
		if (this.user == null) {
			throw new ProgrammingError("Invalid state: no user")
		}
		const userGroupMembership = this.user.userGroup
		const userGroupKeyDistributionKey = this.deriveUserGroupKeyDistributionKey(userGroupMembership.group, userPassphraseKey)
		this.keyCache.setUserGroupKeyDistributionKey(userGroupKeyDistributionKey)
	}

	deriveUserGroupKeyDistributionKey(userGroupId: Id, userPassphraseKey: number[]): AesKey {
		// we prepare a key to encrypt potential user group key rotations with
		// when passwords are changed clients are logged-out of other sessions
		// this key is only needed by the logged-in clients, so it should be reliable enough to assume that userPassphraseKey is in sync
		const userGroupIdHash = sha256Hash(stringToUtf8Uint8Array(userGroupId))
		// we bind this to userGroupId and the domain separator USER_GROUP_KEY_DISTRIBUTION_KEY_INFO
		// the hkdf salt does not have to be secret but should be unique per user and carry some additional entropy which sha256 ensures
		return uint8ArrayToKey(
			hkdf(userGroupIdHash, keyToUint8Array(userPassphraseKey), stringToUtf8Uint8Array(USER_GROUP_KEY_DISTRIBUTION_KEY_INFO), KEY_LENGTH_BYTES_AES_256),
		)
	}

	async updateUser(user: User) {
		if (this.user == null) {
			throw new ProgrammingError("Update user is called without logging in. This function is not for you.")
		}
		this.user = user
		await this.keyCache.removeOutdatedGroupKeys(user)
	}

	getUser(): User | null {
		return this.user
	}

	/**
	 * @return The map which contains authentication data for the logged-in user.
	 */
	createAuthHeaders(): Dict {
		return this.accessToken
			? {
					accessToken: this.accessToken,
			  }
			: {}
	}

	getUserGroupId(): Id {
		return this.getLoggedInUser().userGroup.group
	}

	getAllGroupIds(): Id[] {
		let groups = this.getLoggedInUser().memberships.map((membership) => membership.group)
		groups.push(this.getLoggedInUser().userGroup.group)
		return groups
	}

	getCurrentUserGroupKey(): VersionedKey {
		// the userGroupKey is always written after the login to this.currentUserGroupKey
		//if the user has only logged in offline this has not happened
		const currentUserGroupKey = this.keyCache.getCurrentUserGroupKey()
		if (currentUserGroupKey == null) {
			if (this.isPartiallyLoggedIn()) {
				throw new LoginIncompleteError("userGroupKey not available")
			} else {
				throw new ProgrammingError("Invalid state: userGroupKey is not available")
			}
		}
		return currentUserGroupKey
	}

	getMembership(groupId: Id): GroupMembership {
		let membership = this.getLoggedInUser().memberships.find((g: GroupMembership) => isSameId(g.group, groupId))

		if (!membership) {
			throw new Error(`No group with groupId ${groupId} found!`)
		}

		return membership
	}

	hasGroup(groupId: Id): boolean {
		if (!this.user) {
			return false
		} else {
			return groupId === this.user.userGroup.group || this.user.memberships.some((m) => m.group === groupId)
		}
	}

	getGroupId(groupType: GroupType): Id {
		if (groupType === GroupType.User) {
			return this.getUserGroupId()
		} else {
			let membership = this.getLoggedInUser().memberships.find((m) => m.groupType === groupType)

			if (!membership) {
				throw new Error("could not find groupType " + groupType + " for user " + this.getLoggedInUser()._id)
			}

			return membership.group
		}
	}

	getGroupIds(groupType: GroupType): Id[] {
		return this.getLoggedInUser()
			.memberships.filter((m) => m.groupType === groupType)
			.map((gm) => gm.group)
	}

	isPartiallyLoggedIn(): boolean {
		return this.user != null
	}

	isFullyLoggedIn(): boolean {
		// We have userGroupKey, and we can decrypt any other key - we are good to go
		return this.keyCache.getCurrentUserGroupKey() != null
	}

	getLoggedInUser(): User {
		return assertNotNull(this.user)
	}

	setLeaderStatus(status: WebsocketLeaderStatus) {
		this.leaderStatus = status
		console.log("New leader status set:", status.leaderStatus)
	}

	isLeader(): boolean {
		return this.leaderStatus.leaderStatus
	}

	reset() {
		this.user = null
		this.accessToken = null
		this.keyCache.reset()
		this.leaderStatus = createWebsocketLeaderStatus({
			leaderStatus: false,
		})
	}

	updateUserGroupKey(userGroupKeyDistribution: UserGroupKeyDistribution) {
		const userGroupKeyDistributionKey = this.keyCache.getUserGroupKeyDistributionKey()
		if (userGroupKeyDistributionKey == null) {
			console.log("could not update userGroupKey because distribution key is not available")
			return
		}
		let newUserGroupKeyBytes
		try {
			newUserGroupKeyBytes = decryptKey(userGroupKeyDistributionKey, userGroupKeyDistribution.distributionEncUserGroupKey)
		} catch (e) {
			// this may happen during offline storage synchronisation when the event queue contains user group key rotation and a password change.
			// We can ignore this error as we already have the latest user group key after connecting the offline client
			console.log(`Could not decrypt userGroupKeyUpdate`, e)
			return
		}
		const newUserGroupKey = {
			object: newUserGroupKeyBytes,
			version: Number(userGroupKeyDistribution.userGroupKeyVersion),
		}
		console.log(`updating userGroupKey. new version: ${userGroupKeyDistribution.userGroupKeyVersion}`)
		this.keyCache.setCurrentUserGroupKey(newUserGroupKey)
	}
}
