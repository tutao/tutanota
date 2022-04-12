import {GroupType} from "../../common/TutanotaConstants"
import {decryptKey} from "@tutao/tutanota-crypto"
import {assertNotNull, getFromMap} from "@tutao/tutanota-utils"
import {ProgrammingError} from "../../common/error/ProgrammingError"
import {createWebsocketLeaderStatus, GroupInfo, GroupMembership, User, WebsocketLeaderStatus} from "../../entities/sys/TypeRefs"

export interface AuthHeadersProvider {
	/**
	 * @return The map which contains authentication data for the logged in user.
	 */
	createAuthHeaders(): Dict
}

/** Holder for the user and session-related data on the worker side. */
export class UserFacade implements AuthHeadersProvider {
	private user: User | null = null
	private userGroupInfo: GroupInfo | null = null
	private accessToken: string | null = null
	/** A cache for decrypted keys of each group. Encrypted keys are stored on membership.symEncGKey. */
	private groupKeys: Map<Id, Aes128Key> = new Map()
	private leaderStatus!: WebsocketLeaderStatus

	constructor() {
		this.reset()
	}

	// Login process is somehow multi-step and we don't use a separate network stack for it. So we have to break up setters
	// 1. We need to download user. For that we need to set access token already.
	// 2. We need to download userGroupInfo. For that we need user and user group key.
	// so this leads to this steps in UserFacade:
	// 1. Access token is set
	// 2. User and user group key are set
	// 3. UserGroupInfo is set
	setUser(user: User, userPassphraseKey: Aes128Key) {
		this.user = user
		this.groupKeys.set(this.getUserGroupId(), decryptKey(userPassphraseKey, this.user.userGroup.symEncGKey))
	}

	updateUser(user: User) {
		if (this.user == null) {
			throw new ProgrammingError("Update user is called without logging in. This function is not for you.")
		}
		this.user = user
	}

	setUserGroupInfo(userGroupInfo: GroupInfo) {
		this.userGroupInfo = userGroupInfo
	}

	getUser(): User | null {
		return this.user
	}

	setAccessToken(accessToken: string | null) {
		this.accessToken = accessToken
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

	getUserGroupInfo(): GroupInfo {
		return assertNotNull(this.userGroupInfo)
	}

	getAllGroupIds(): Id[] {
		let groups = this.getLoggedInUser().memberships.map(membership => membership.group)
		groups.push(this.getLoggedInUser().userGroup.group)
		return groups
	}

	getUserGroupKey(): Aes128Key {
		// the userGroupKey is always written after the login to this.groupKeys
		return assertNotNull(this.groupKeys.get(this.getUserGroupId()), "User is not logged in")
	}

	getGroupKey(groupId: Id): Aes128Key {
		return getFromMap(this.groupKeys, groupId, () => {
			return decryptKey(this.getUserGroupKey(), this.getMembership(groupId).symEncGKey)
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
			return groupId === this.user.userGroup.group || this.user.memberships.find(m => m.group === groupId) != null
		}
	}

	getGroupId(groupType: GroupType): Id {
		if (groupType === GroupType.User) {
			return this.getUserGroupId()
		} else {
			let membership = this.getLoggedInUser().memberships.find(m => m.groupType === groupType)

			if (!membership) {
				throw new Error("could not find groupType " + groupType + " for user " + this.getLoggedInUser()._id)
			}

			return membership.group
		}
	}

	getGroupIds(groupType: GroupType): Id[] {
		return this.getLoggedInUser()
				   .memberships.filter(m => m.groupType === groupType)
				   .map(gm => gm.group)
	}

	isLoggedIn(): boolean {
		return this.user != null
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
		this.userGroupInfo = null
		this.accessToken = null
		this.groupKeys = new Map()
		this.leaderStatus = createWebsocketLeaderStatus({
			leaderStatus: false,
		})
	}
}