// @flow
import {AccountType, GroupType, OperationType} from "../common/TutanotaConstants"
import {load, loadRoot} from "./Entity"
import {neverNull} from "../common/utils/Utils"
import {CustomerTypeRef} from "../entities/sys/Customer"
import {UserTypeRef} from "../entities/sys/User"
import {isSameId} from "../common/EntityFunctions"
import {GroupInfoTypeRef} from "../entities/sys/GroupInfo"
import {assertMainOrNode, getHttpOrigin} from "../Env"
import {TutanotaPropertiesTypeRef} from "../entities/tutanota/TutanotaProperties"
import {_TypeModel as SessionModelType} from "../entities/sys/Session"
import type {EntityUpdateData} from "./EventController"
import {isUpdateForTypeRef} from "./EventController"
import {UserSettingsGroupRootTypeRef} from "../entities/tutanota/UserSettingsGroupRoot"
import {SysService} from "../entities/sys/Services"
import {createCloseSessionServicePost} from "../entities/sys/CloseSessionServicePost"
import {worker} from "./WorkerClient"

assertMainOrNode()

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
	isGlobalAdmin() {
		if (this.isInternalUser()) {
			return this.user.memberships.find(m => m.groupType === GroupType.Admin) != null
		} else {
			return false;
		}
	}

	isGlobalOrLocalAdmin() {
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
		if (this.persistentSession) return Promise.resolve()
		if (sync) {
			return this.deleteSessionSync()
		} else {
			return worker.deleteSession(this.accessToken).then(() => worker.reset())
		}
	}


	deleteSessionSync() {
		return new Promise((resolve, reject) => {
			const sendBeacon = navigator.sendBeacon // Save sendBeacon to variable to satisfy type checker
			if (sendBeacon) {
				try {
					const path = `${getHttpOrigin()}/rest/sys/${SysService.CloseSessionService}`
					const requestObject = createCloseSessionServicePost({
						accessToken: this.accessToken,
						sessionId: this.sessionId
					})
					delete requestObject["_type"] // Remove extra field which is not part of the data model
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
