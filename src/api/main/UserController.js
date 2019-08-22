// @flow
import {AccountType, GroupType, OperationType} from "../common/TutanotaConstants"
import {load, loadRoot, setup} from "./Entity"
import {downcast, neverNull} from "../common/utils/Utils"
import type {Customer} from "../entities/sys/Customer"
import {CustomerTypeRef} from "../entities/sys/Customer"
import type {User} from "../entities/sys/User"
import {UserTypeRef} from "../entities/sys/User"
import {isSameId} from "../common/EntityFunctions"
import type {GroupInfo} from "../entities/sys/GroupInfo"
import {GroupInfoTypeRef} from "../entities/sys/GroupInfo"
import {assertMainOrNode, getHttpOrigin} from "../Env"
import type {TutanotaProperties} from "../entities/tutanota/TutanotaProperties"
import {TutanotaPropertiesTypeRef} from "../entities/tutanota/TutanotaProperties"
import {_TypeModel as SessionModelType} from "../entities/sys/Session"
import type {EntityUpdateData} from "./EventController"
import {isUpdateForTypeRef} from "./EventController"
import type {UserSettingsGroupRoot} from "../entities/tutanota/UserSettingsGroupRoot"
import {createUserSettingsGroupRoot, UserSettingsGroupRootTypeRef} from "../entities/tutanota/UserSettingsGroupRoot"
import {SysService} from "../entities/sys/Services"
import {createCloseSessionServicePost} from "../entities/sys/CloseSessionServicePost"
import {worker} from "./WorkerClient"
import type {GroupMembership} from "../entities/sys/GroupMembership"
import {NotFoundError} from "../common/error/RestError"

assertMainOrNode()

export interface IUserController {
	user: User;
	userGroupInfo: GroupInfo;
	props: TutanotaProperties;
	sessionId: IdTuple;
	accessToken: string;
	+userSettingsGroupRoot: UserSettingsGroupRoot;

	isGlobalAdmin(): boolean;

	isGlobalOrLocalAdmin(): boolean;

	isFreeAccount(): boolean;

	isPremiumAccount(): boolean;

	isOutlookAccount(): boolean;

	isInternalUser(): boolean;

	loadCustomer(): Promise<Customer>;

	getMailGroupMemberships(): GroupMembership[];

	getCalendarMemberships(): GroupMembership[];

	getUserMailGroupMembership(): GroupMembership;

	getLocalAdminGroupMemberships(): GroupMembership[];

	entityEventsReceived($ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void>;

	deleteSession(sync: boolean): Promise<void>;
}

export class UserController implements IUserController {
	user: User;
	userGroupInfo: GroupInfo;
	props: TutanotaProperties;
	sessionId: IdTuple;
	accessToken: Base64Url;
	persistentSession: boolean;
	userSettingsGroupRoot: UserSettingsGroupRoot;

	constructor(user: User, userGroupInfo: GroupInfo, sessionId: IdTuple, props: TutanotaProperties, accessToken: Base64Url, persistentSession: boolean,
	            userSettingsGroupRoot: UserSettingsGroupRoot) {
		this.user = user
		this.userGroupInfo = userGroupInfo
		this.props = props
		this.sessionId = sessionId
		this.accessToken = accessToken
		this.persistentSession = persistentSession
		this.userSettingsGroupRoot = userSettingsGroupRoot
	}

	/**
	 * Checks if the current user is an admin of the customer.
	 * @return True if the user is an admin
	 */
	isGlobalAdmin(): boolean {
		if (this.isInternalUser()) {
			return this.user.memberships.find(m => m.groupType === GroupType.Admin) != null
		} else {
			return false;
		}
	}

	isGlobalOrLocalAdmin(): boolean {
		if (this.isInternalUser()) {
			return this.user.memberships.find(m => m.groupType === GroupType.Admin || m.groupType
				=== GroupType.LocalAdmin) != null
		} else {
			return false;
		}
	}

	/**
	 * Checks if the account type of the logged in user is FREE.
	 * @returns True if the account type is FREE otherwise false
	 */
	isFreeAccount(): boolean {
		return this.user.accountType === AccountType.FREE
	}


	isPremiumAccount(): boolean {
		return this.user.accountType === AccountType.PREMIUM
	}

	isOutlookAccount(): boolean {
		return this.user.accountType === AccountType.STARTER
	}

	/**
	 * Provides the information if an internal user is logged in.
	 * @return True if an internal user is logged in, false if no user or an external user is logged in.
	 */
	isInternalUser(): boolean {
		return this.user.accountType !== AccountType.EXTERNAL
	}

	loadCustomer(): Promise<Customer> {
		return load(CustomerTypeRef, neverNull(this.user.customer))
	}


	getMailGroupMemberships(): GroupMembership[] {
		return this.user.memberships.filter(membership => membership.groupType === GroupType.Mail)
	}

	getCalendarMemberships(): GroupMembership[] {
		return this.user.memberships.filter(membership => membership.groupType === GroupType.Calendar)
	}

	getUserMailGroupMembership(): GroupMembership {
		return this.getMailGroupMemberships()[0]
	}

	getLocalAdminGroupMemberships(): GroupMembership[] {
		return this.user.memberships.filter(membership => membership.groupType === GroupType.LocalAdmin)
	}

	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
		return Promise.each(updates, (update) => {
			const {instanceListId, instanceId, operation} = update
			if (operation === OperationType.UPDATE && isUpdateForTypeRef(UserTypeRef, update)
				&& isSameId(this.user.userGroup.group, eventOwnerGroupId)) {
				return load(UserTypeRef, this.user._id).then(updatedUser => {
					this.user = updatedUser
				})
			} else if (operation === OperationType.UPDATE && isUpdateForTypeRef(GroupInfoTypeRef, update)
				&& isSameId(this.userGroupInfo._id, [neverNull(instanceListId), instanceId])) {
				return load(GroupInfoTypeRef, this.userGroupInfo._id).then(updatedUserGroupInfo => {
					this.userGroupInfo = updatedUserGroupInfo
				})
			} else if (isUpdateForTypeRef(TutanotaPropertiesTypeRef, update) && operation === OperationType.UPDATE) {
				return loadRoot(TutanotaPropertiesTypeRef, this.user.userGroup.group).then(props => {
					this.props = props
				})
			} else if (isUpdateForTypeRef(UserSettingsGroupRootTypeRef, update)) {
				return load(UserSettingsGroupRootTypeRef, this.user.userGroup.group).then((userSettingsGroupRoot) => {
					this.userSettingsGroupRoot = userSettingsGroupRoot
				})
			}
			return Promise.resolve()
		}).return()
	}

	deleteSession(sync: boolean): Promise<void> {
		if (sync) {
			// in case the tab is closed we need to delete the session in the main thread (synchronous rest request)
			return this.persistentSession ? Promise.resolve() : this.deleteSessionSync()
		} else {
			const deletePromise = this.persistentSession ? Promise.resolve() : worker.deleteSession(this.accessToken)
			return deletePromise.then(() => worker.reset())
		}
	}


	deleteSessionSync(): Promise<void> {
		return new Promise((resolve, reject) => {
			const sendBeacon = navigator.sendBeacon // Save sendBeacon to variable to satisfy type checker
			if (sendBeacon) {
				try {
					const path = `${getHttpOrigin()}/rest/sys/${SysService.CloseSessionService}`
					const requestObject = createCloseSessionServicePost({
						accessToken: this.accessToken,
						sessionId: this.sessionId
					})
					delete downcast(requestObject)["_type"] // Remove extra field which is not part of the data model
					const queued = sendBeacon.call(navigator, path, JSON.stringify(requestObject))
					console.log("queued closing session: ", queued)
					resolve()
				} catch (e) {
					console.log("Failed to send beacon", e)
					reject(e)
				}
			} else {
				// Fall back to sync XHR if
				const path = '/rest/sys/session/' + this.sessionId[0] + "/" + this.sessionId[1]
				const xhr = new XMLHttpRequest()
				xhr.open("DELETE", getHttpOrigin() + path, false) // sync requests increase reliability when invoked in onunload
				xhr.setRequestHeader('accessToken', this.accessToken)
				xhr.setRequestHeader('v', SessionModelType.version)
				xhr.onload = function () { // XMLHttpRequestProgressEvent, but not needed
					if (xhr.status === 200) {
						console.log("deleted session")
						resolve()
					} else if (xhr.status === 401) {
						console.log("authentication failed => session is already deleted")
						resolve()
					} else {
						console.error("could not delete session " + xhr.status)
						reject(new Error("could not delete session " + xhr.status))
					}
				}
				xhr.onerror = function () {
					console.error("failed to request delete session")
					reject(new Error("failed to request delete session"))
				}
				xhr.send()
			}
		})
	}
}

export type UserControllerInitData = {
	user: User, userGroupInfo: GroupInfo, sessionId: IdTuple, accessToken: Base64Url, persistentSession: boolean
}

// noinspection JSUnusedGlobalSymbols
// dynamically imported
export function initUserController(
	{user, userGroupInfo, sessionId, accessToken, persistentSession}: UserControllerInitData
): Promise<UserController> {
	return Promise
		.all([
			loadRoot(TutanotaPropertiesTypeRef, user.userGroup.group),
			load(UserSettingsGroupRootTypeRef, user.userGroup.group)
				.catch(NotFoundError, () =>
					setup(null, Object.assign(createUserSettingsGroupRoot(), {
						_ownerGroup: user.userGroup.group
					}))
						.then(() => load(UserSettingsGroupRootTypeRef, user.userGroup.group)))
		])
		.then(([props, userSettingsGroupRoot]) =>
			new UserController(user, userGroupInfo, sessionId, props, accessToken, persistentSession, userSettingsGroupRoot)
		)
}
