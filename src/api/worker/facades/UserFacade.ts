import { GroupType } from "../../common/TutanotaConstants"
import { AesKey, decryptKey } from "@tutao/tutanota-crypto"
import { assertNotNull, getFromMap } from "@tutao/tutanota-utils"
import { ProgrammingError } from "../../common/error/ProgrammingError"
import { createWebsocketLeaderStatus, GroupMembership, User, WebsocketLeaderStatus } from "../../entities/sys/TypeRefs"
import { LoginIncompleteError } from "../../common/error/LoginIncompleteError"
import { VersionedKey } from "../crypto/CryptoFacade.js"

export interface AuthDataProvider {
	/**
	 * @return The map which contains authentication data for the logged in user.
	 */
	createAuthHeaders(): Dict

	isFullyLoggedIn(): boolean
}

/** Holder for the user and session-related data on the worker side. */
export class UserFacade implements AuthDataProvider {
	private user: User | null = null
	private accessToken: string | null = null
	/** A cache for decrypted keys of each group. Encrypted keys are stored on membership.symEncGKey. */
	private currentGroupKeys: Map<Id, VersionedKey> = new Map()
	private leaderStatus!: WebsocketLeaderStatus

	constructor() {
		this.reset()
	}

	// Login process is somehow multi-step and we don't use a separate network stack for it. So we have to break up setters.
	// 1. We need to download user. For that we need to set access token already (to authenticate the request for the server as its passed in headers).
	// 2. We need to get group keys. For that we need to unlock userGroupKey with userPasspharseKey
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
		this.currentGroupKeys.set(this.getUserGroupId(), {
			version: Number(userGroupMembership.groupKeyVersion),
			object: decryptKey(userPassphraseKey, userGroupMembership.symEncGKey),
		})
	}

	updateUser(user: User) {
		if (this.user == null) {
			throw new ProgrammingError("Update user is called without logging in. This function is not for you.")
		}
		this.user = user
	}

	getUser(): User | null {
		return this.user
	}

	/**
	 * @return The map which contains authentication data for the logged in user.
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

	getUserGroupKey(): VersionedKey {
		// the userGroupKey is always written after the login to this.groupKeys
		//if the user has only logged in offline this has not happened
		const userGroupKey = this.currentGroupKeys.get(this.getUserGroupId())
		if (userGroupKey == null) {
			if (this.isPartiallyLoggedIn()) {
				throw new LoginIncompleteError("userGroupKey not available")
			} else {
				throw new ProgrammingError("Invalid state: userGroupKey is not available")
			}
		}
		return userGroupKey
	}

	getCurrentGroupKey(groupId: Id): VersionedKey {
		return getFromMap(this.currentGroupKeys, groupId, () => {
			const groupMembership = this.getMembership(groupId)
			// TODO make sure we have the right user group version
			return {
				version: Number(groupMembership.groupKeyVersion),
				object: decryptKey(this.getUserGroupKey().object, groupMembership.symEncGKey),
			}
		})
	}

	getMembership(groupId: Id): GroupMembership {
		let membership = this.getLoggedInUser().memberships.find((g: GroupMembership) => g.group === groupId)

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
		// We have userGroupKey and we can decrypt any other key - we are good to go
		return this.currentGroupKeys.size > 0
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
		this.currentGroupKeys = new Map()
		this.leaderStatus = createWebsocketLeaderStatus({
			leaderStatus: false,
		})
	}
}
