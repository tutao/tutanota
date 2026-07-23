import { Aes256Key, AesKey, cryptoUtils, CryptoWrapper, decryptKey, HkdfKeyDerivationDomains, SymmetricEncryptionScheme, VersionedKey } from "@tutao/crypto"
import { assertNotNull, KeyVersion } from "@tutao/utils"
import { ProgrammingError } from "@tutao/app-env"
import { isSameId } from "../../meta"
import { LoggedInUserProvider } from "@tutao/instance-pipeline"
import { createWebsocketLeaderStatus, GroupMembership, User, UserGroupKeyDistribution, WebsocketLeaderStatus } from "@tutao/entities/sys"
import { GroupType } from "../../../entities/sys/Utils"
import { LoginIncompleteError } from "@tutao/rest-client/error"
import { KeyCache } from "../base-crypto/persistence/KeyCache"

/** Holder for the user and session-related data on the worker side. */
export class UserFacade extends LoggedInUserProvider {
	private user: User | null = null
	private accessToken: string | null = null
	private leaderStatus!: WebsocketLeaderStatus
	private defaultSymmetricEncryptionScheme: SymmetricEncryptionScheme = SymmetricEncryptionScheme.AesCbc

	constructor(
		private readonly keyCache: KeyCache,
		private readonly cryptoWrapper: CryptoWrapper,
	) {
		super()
		this.reset()
	}

	getDefaultSymmetricEncryptionScheme(): SymmetricEncryptionScheme {
		return this.defaultSymmetricEncryptionScheme
	}

	useAeadEncryption(): void {
		this.defaultSymmetricEncryptionScheme = SymmetricEncryptionScheme.Aead
	}

	// Login process is somehow multistep, and we don't use a separate network stack for it. So we have to break up setters.
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
			version: cryptoUtils.parseKeyVersion(userGroupMembership.groupKeyVersion),
			object: decryptKey(userPassphraseKey, userGroupMembership.symEncGKey),
		}
		this.keyCache.setCurrentUserGroupKey(currentUserGroupKey)
		this.setUserDistKey(currentUserGroupKey.version, userPassphraseKey)
	}

	setUserDistKey(currentUserGroupKeyVersion: KeyVersion, userPassphraseKey: AesKey) {
		if (this.user == null) {
			throw new ProgrammingError("Invalid state: no user")
		}
		// Why this magic + 1? Because we don't have access to the new version number when calling this function so we compute it from the current one
		const newUserGroupKeyVersion = cryptoUtils.checkKeyVersionConstraints(currentUserGroupKeyVersion + 1)
		const userGroupMembership = this.user.userGroup
		const userDistKey = this.deriveUserDistKey(userGroupMembership.group, newUserGroupKeyVersion, userPassphraseKey)
		this.keyCache.setUserDistKey(userDistKey)
	}

	/**
	 * Derives a distribution to share the new user group key of the user to their other clients (apps, web etc.)
	 * @param userGroupId user group id of the logged-in user
	 * @param newUserGroupKeyVersion the new user group key version
	 * @param userPasswordKey current password key of the user
	 */
	deriveUserDistKey(userGroupId: Id, newUserGroupKeyVersion: KeyVersion, userPasswordKey: AesKey): Aes256Key {
		return this.cryptoWrapper.deriveKeyWithHkdf({
			salt: `userGroup: ${userGroupId}, newUserGroupKeyVersion: ${newUserGroupKeyVersion}`,
			key: userPasswordKey,
			// Formerly,this was not bound to the user group key version.
			context: HkdfKeyDerivationDomains.VersionedUserGroupKeyDistributionKey,
		})
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
			console.log(new Error().stack)
		}

		if (!membership) {
			throw new Error(`No membership with groupId ${groupId} found!`)
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
			// a valid applicationVersionSum and applicationTypesHash can only be provided by the server
			applicationVersionSum: null,
			applicationTypesHash: null,
		})
	}

	updateUserGroupKey(userGroupKeyDistribution: UserGroupKeyDistribution) {
		const userDistKey = this.keyCache.getUserDistKey()
		if (userDistKey == null) {
			console.log("could not update userGroupKey because distribution key is not available")
			return
		}
		let newUserGroupKeyBytes
		try {
			newUserGroupKeyBytes = decryptKey(userDistKey, userGroupKeyDistribution.distributionEncUserGroupKey)
		} catch (e) {
			// this may happen during offline storage synchronisation when the event queue contains user group key rotation and a password change.
			// We can ignore this error as we already have the latest user group key after connecting the offline client
			console.log(`Could not decrypt userGroupKeyUpdate`, e)
			return
		}
		const newUserGroupKey = {
			object: newUserGroupKeyBytes,
			version: cryptoUtils.parseKeyVersion(userGroupKeyDistribution.userGroupKeyVersion),
		}
		this.setNewUserGroupKey(newUserGroupKey)
	}

	/**
	 * Update the KeyCache with the newest user group key.
	 * NOTE: should only be used with a freshly generated key. For keys received from the server, use `updateUserGroupKey`
	 * @param userGroupKey
	 */
	public setNewUserGroupKey(userGroupKey: VersionedKey) {
		console.log(`updating userGroupKey. new version: ${userGroupKey.version}`)
		this.keyCache.setCurrentUserGroupKey(userGroupKey)
	}
}
