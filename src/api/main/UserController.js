// @flow
import {AccountType, GroupType, OperationType} from "../common/TutanotaConstants"
import {load, loadRoot, setup} from "./Entity"
import {downcast, neverNull, noOp} from "@tutao/tutanota-utils"
import type {Customer} from "../entities/sys/Customer"
import {CustomerTypeRef} from "../entities/sys/Customer"
import type {User} from "../entities/sys/User"
import {UserTypeRef} from "../entities/sys/User"
import {MediaType} from "../common/EntityFunctions"
import type {GroupInfo} from "../entities/sys/GroupInfo"
import {GroupInfoTypeRef} from "../entities/sys/GroupInfo"
import {assertMainOrNode, getHttpOrigin, isDesktop} from "../common/Env"
import type {TutanotaProperties} from "../entities/tutanota/TutanotaProperties"
import {TutanotaPropertiesTypeRef} from "../entities/tutanota/TutanotaProperties"
import {_TypeModel as SessionModelType} from "../entities/sys/Session"
import type {EntityUpdateData} from "./EventController"
import {isUpdateForTypeRef} from "./EventController"
import type {UserSettingsGroupRoot} from "../entities/tutanota/UserSettingsGroupRoot"
import {createUserSettingsGroupRoot, UserSettingsGroupRootTypeRef} from "../entities/tutanota/UserSettingsGroupRoot"
import {SysService} from "../entities/sys/Services"
import {createCloseSessionServicePost} from "../entities/sys/CloseSessionServicePost"
import type {GroupMembership} from "../entities/sys/GroupMembership"
import {NotFoundError} from "../common/error/RestError"
import type {CustomerInfo} from "../entities/sys/CustomerInfo"
import {CustomerInfoTypeRef} from "../entities/sys/CustomerInfo"
import type {AccountingInfo} from "../entities/sys/AccountingInfo"
import {AccountingInfoTypeRef} from "../entities/sys/AccountingInfo"
import {locator} from "./MainLocator"
import {isSameId} from "../common/utils/EntityUtils";
import {ofClass, promiseMap} from "@tutao/tutanota-utils"
import type {WhitelabelConfig} from "../entities/sys/WhitelabelConfig"
import {first, mapAndFilterNull} from "@tutao/tutanota-utils"
import type {DomainInfo} from "../entities/sys/DomainInfo"
import {getWhitelabelCustomizations} from "../../misc/WhitelabelCustomizations"
import type {Base64Url} from "@tutao/tutanota-utils/"

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

	isInternalUser(): boolean;

	loadCustomer(): Promise<Customer>;

	loadCustomerInfo(): Promise<CustomerInfo>;

	loadAccountingInfo(): Promise<AccountingInfo>;

	getMailGroupMemberships(): GroupMembership[];

	getCalendarMemberships(): GroupMembership[];

	getUserMailGroupMembership(): GroupMembership;

	getLocalAdminGroupMemberships(): GroupMembership[];

	getTemplateMemberships(): GroupMembership[];

	entityEventsReceived($ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void>;

	deleteSession(sync: boolean): Promise<void>;

	loadWhitelabelConfig(): Promise<?{whitelabelConfig: WhitelabelConfig, domainInfo: DomainInfo}>;

	isWhitelabelAccount(): Promise<boolean>;
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

	/**
	 * Provides the information if an internal user is logged in.
	 * @return True if an internal user is logged in, false if no user or an external user is logged in.
	 */
	isInternalUser(): boolean {
		return this.user.accountType !== AccountType.EXTERNAL
	}

	loadCustomer(): Promise<Customer> {
		return locator.entityClient.load(CustomerTypeRef, neverNull(this.user.customer))
	}

	loadCustomerInfo(): Promise<CustomerInfo> {
		return this.loadCustomer()
		           .then(customer => locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo))
	}

	loadAccountingInfo(): Promise<AccountingInfo> {
		return this.loadCustomerInfo()
		           .then(customerInfo => locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo))
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

	getTemplateMemberships(): GroupMembership[] {
		return this.user.memberships.filter(membership => membership.groupType === GroupType.Template)
	}


	entityEventsReceived(updates: $ReadOnlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
		return promiseMap(updates, (update) => {
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
		}).then(noOp)
	}

	deleteSession(sync: boolean): Promise<void> {
		if (sync) {
			// in case the tab is closed we need to delete the session in the main thread (synchronous rest request)
			return this.persistentSession ? Promise.resolve() : this.deleteSessionSync()
		} else {
			const deletePromise = this.persistentSession ? Promise.resolve() : locator.loginFacade.deleteSession(this.accessToken)
			return deletePromise.then(() => locator.worker.reset())
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
					// Send as Blob to be able to set content type otherwise sends 'text/plain'
					const queued = sendBeacon.call(navigator, path,
						new Blob([JSON.stringify(requestObject)], {type: MediaType.Json}));
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

	async isWhitelabelAccount(): Promise<boolean> {

		// isTutanotaDomain always returns true on desktop
		if (!isDesktop()) {
			return !!getWhitelabelCustomizations(window)
		}

		const customerInfo = await this.loadCustomerInfo()
		return customerInfo.domainInfos.some(domainInfo => domainInfo.whitelabelConfig)
	}

	async loadWhitelabelConfig(): Promise<?{whitelabelConfig: WhitelabelConfig, domainInfo: DomainInfo}> {

		// The model allows for multiple domainInfos to have whitelabel configs
		// but in reality on the server only a single custom configuration is allowed
		// therefore the result of the filtering all domainInfos with no whitelabelConfig
		// can only be an array of length 0 or 1
		const customerInfo = await this.loadCustomerInfo()
		const domainInfoAndConfig = first(mapAndFilterNull(customerInfo.domainInfos, (domainInfo => domainInfo.whitelabelConfig && {
			domainInfo,
			whitelabelConfig: domainInfo.whitelabelConfig
		})))
		if (domainInfoAndConfig) {
			const {WhitelabelConfigTypeRef} = await import("./../entities/sys/WhitelabelConfig")
			const whitelabelConfig = await locator.entityClient.load(WhitelabelConfigTypeRef, domainInfoAndConfig.whitelabelConfig)
			return {
				domainInfo: domainInfoAndConfig.domainInfo,
				whitelabelConfig,
			}
		}
	}
}

export type UserControllerInitData = {
	user: User,
	userGroupInfo: GroupInfo,
	sessionId: IdTuple,
	accessToken: Base64Url,
	persistentSession: boolean,
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
				.catch(ofClass(NotFoundError, () =>
					setup(null, Object.assign(createUserSettingsGroupRoot(), {
						_ownerGroup: user.userGroup.group
					}))
						.then(() => load(UserSettingsGroupRootTypeRef, user.userGroup.group))))
		])
		.then(([props, userSettingsGroupRoot]) =>
			new UserController(user, userGroupInfo, sessionId, props, accessToken, persistentSession, userSettingsGroupRoot)
		)
}
