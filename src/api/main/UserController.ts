import {AccountType, GroupType, OperationType} from "../common/TutanotaConstants"
import type {Base64Url} from "@tutao/tutanota-utils"
import {downcast, first, mapAndFilterNull, neverNull, noOp, ofClass, promiseMap} from "@tutao/tutanota-utils"
import {MediaType} from "../common/EntityFunctions"
import {assertMainOrNode, getHttpOrigin, isDesktop} from "../common/Env"
import type {EntityUpdateData} from "./EventController"
import {isUpdateForTypeRef} from "./EventController"
import {NotFoundError} from "../common/error/RestError"
import {locator} from "./MainLocator"
import {isSameId} from "../common/utils/EntityUtils"
import {getWhitelabelCustomizations} from "../../misc/WhitelabelCustomizations"
import {EntityClient} from "../common/EntityClient"
import {CloseSessionService} from "../entities/sys/Services"
import {
	AccountingInfo, AccountingInfoTypeRef, createCloseSessionServicePost,
	Customer,
	CustomerInfo,
	CustomerInfoTypeRef,
	CustomerTypeRef,
	DomainInfo,
	GroupInfo, GroupInfoTypeRef,
	GroupMembership,
	User, UserTypeRef,
	WhitelabelConfig, WhitelabelConfigTypeRef
} from "../entities/sys/TypeRefs"
import {
	createUserSettingsGroupRoot,
	TutanotaProperties,
	TutanotaPropertiesTypeRef,
	UserSettingsGroupRoot,
	UserSettingsGroupRootTypeRef
} from "../entities/tutanota/TypeRefs"
import {typeModels as sysTypeModels} from "../entities/sys/TypeModels"

assertMainOrNode()

export interface IUserController {
	user: User
	userGroupInfo: GroupInfo
	props: TutanotaProperties
	sessionId: IdTuple
	accessToken: string
	readonly userSettingsGroupRoot: UserSettingsGroupRoot

	isGlobalAdmin(): boolean

	isGlobalOrLocalAdmin(): boolean

	isFreeAccount(): boolean

	isPremiumAccount(): boolean

	isInternalUser(): boolean

	loadCustomer(): Promise<Customer>

	loadCustomerInfo(): Promise<CustomerInfo>

	loadAccountingInfo(): Promise<AccountingInfo>

	getMailGroupMemberships(): GroupMembership[]

	getCalendarMemberships(): GroupMembership[]

	getUserMailGroupMembership(): GroupMembership

	getLocalAdminGroupMemberships(): GroupMembership[]

	getTemplateMemberships(): GroupMembership[]

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void>

	/**
	 * Delete the session (only if it's a non-persistent session
	 * @param sync whether or not to delete in the main thread. For example, will be true when logging out due to closing the tab
	 */
	deleteSession(sync: boolean): Promise<void>

	loadWhitelabelConfig(): Promise<| {
		whitelabelConfig: WhitelabelConfig
		domainInfo: DomainInfo
	}
		| null
		| undefined>

	isWhitelabelAccount(): Promise<boolean>
}

export class UserController implements IUserController {
	user: User
	userGroupInfo: GroupInfo
	props: TutanotaProperties
	sessionId: IdTuple
	accessToken: Base64Url
	persistentSession: boolean
	userSettingsGroupRoot: UserSettingsGroupRoot
	entityClient: EntityClient

	constructor(
		user: User,
		userGroupInfo: GroupInfo,
		sessionId: IdTuple,
		props: TutanotaProperties,
		accessToken: Base64Url,
		persistentSession: boolean,
		userSettingsGroupRoot: UserSettingsGroupRoot,
		entityClient: EntityClient,
	) {
		this.user = user
		this.userGroupInfo = userGroupInfo
		this.props = props
		this.sessionId = sessionId
		this.accessToken = accessToken
		this.persistentSession = persistentSession
		this.userSettingsGroupRoot = userSettingsGroupRoot
		this.entityClient = entityClient
	}

	/**
	 * Checks if the current user is an admin of the customer.
	 * @return True if the user is an admin
	 */
	isGlobalAdmin(): boolean {
		if (this.isInternalUser()) {
			return this.user.memberships.find(m => m.groupType === GroupType.Admin) != null
		} else {
			return false
		}
	}

	isGlobalOrLocalAdmin(): boolean {
		if (this.isInternalUser()) {
			return this.user.memberships.find(m => m.groupType === GroupType.Admin || m.groupType === GroupType.LocalAdmin) != null
		} else {
			return false
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
		return this.loadCustomer().then(customer => locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo))
	}

	loadAccountingInfo(): Promise<AccountingInfo> {
		return this.loadCustomerInfo().then(customerInfo => locator.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo))
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

	entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
		return promiseMap(updates, update => {
			const {instanceListId, instanceId, operation} = update

			if (operation === OperationType.UPDATE && isUpdateForTypeRef(UserTypeRef, update) && isSameId(this.user.userGroup.group, eventOwnerGroupId)) {
				return this.entityClient.load(UserTypeRef, this.user._id).then(updatedUser => {
					this.user = updatedUser
				})
			} else if (
				operation === OperationType.UPDATE &&
				isUpdateForTypeRef(GroupInfoTypeRef, update) &&
				isSameId(this.userGroupInfo._id, [neverNull(instanceListId), instanceId])
			) {
				return this.entityClient.load(GroupInfoTypeRef, this.userGroupInfo._id).then(updatedUserGroupInfo => {
					this.userGroupInfo = updatedUserGroupInfo
				})
			} else if (isUpdateForTypeRef(TutanotaPropertiesTypeRef, update) && operation === OperationType.UPDATE) {
				return this.entityClient.loadRoot(TutanotaPropertiesTypeRef, this.user.userGroup.group).then(props => {
					this.props = props
				})
			} else if (isUpdateForTypeRef(UserSettingsGroupRootTypeRef, update)) {
				return this.entityClient.load(UserSettingsGroupRootTypeRef, this.user.userGroup.group).then(userSettingsGroupRoot => {
					this.userSettingsGroupRoot = userSettingsGroupRoot
				})
			}

			return Promise.resolve()
		}).then(noOp)
	}

	async deleteSession(sync: boolean): Promise<void> {
		// in case the tab is closed we need to delete the session in the main thread (synchronous rest request)
		if (sync) {
			if (!this.persistentSession) {
				await this.deleteSessionSync()
			}
		} else {
			if (!this.persistentSession) {
				await locator.loginFacade.deleteSession(this.accessToken)
							 .catch((e) => console.log("Error ignored on Logout:", e))
			}
			await locator.worker.reset()
		}
	}

	deleteSessionSync(): Promise<void> {
		return new Promise((resolve, reject) => {
			const sendBeacon = navigator.sendBeacon // Save sendBeacon to variable to satisfy type checker

			if (sendBeacon) {
				try {
					const path = `${getHttpOrigin()}/rest/sys/${CloseSessionService}`
					const requestObject = createCloseSessionServicePost({
						accessToken: this.accessToken,
						sessionId: this.sessionId,
					})
					delete downcast(requestObject)["_type"] // Remove extra field which is not part of the data model

					// Send as Blob to be able to set content type otherwise sends 'text/plain'
					const queued = sendBeacon.call(
						navigator,
						path,
						new Blob([JSON.stringify(requestObject)], {
							type: MediaType.Json,
						}),
					)
					console.log("queued closing session: ", queued)
					resolve()
				} catch (e) {
					console.log("Failed to send beacon", e)
					reject(e)
				}
			} else {
				// Fall back to sync XHR if
				const path = "/rest/sys/session/" + this.sessionId[0] + "/" + this.sessionId[1]
				const xhr = new XMLHttpRequest()
				xhr.open("DELETE", getHttpOrigin() + path, false) // sync requests increase reliability when invoked in onunload

				xhr.setRequestHeader("accessToken", this.accessToken)
				xhr.setRequestHeader("v", sysTypeModels.Session.version)

				xhr.onload = function () {
					// XMLHttpRequestProgressEvent, but not needed
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

	async loadWhitelabelConfig(): Promise<| {
		whitelabelConfig: WhitelabelConfig
		domainInfo: DomainInfo
	}
		| null
		| undefined> {
		// The model allows for multiple domainInfos to have whitelabel configs
		// but in reality on the server only a single custom configuration is allowed
		// therefore the result of the filtering all domainInfos with no whitelabelConfig
		// can only be an array of length 0 or 1
		const customerInfo = await this.loadCustomerInfo()
		const domainInfoAndConfig = first(
			mapAndFilterNull(
				customerInfo.domainInfos,
				domainInfo =>
					domainInfo.whitelabelConfig && {
						domainInfo,
						whitelabelConfig: domainInfo.whitelabelConfig,
					},
			),
		)

		if (domainInfoAndConfig) {
			const whitelabelConfig = await locator.entityClient.load(WhitelabelConfigTypeRef, domainInfoAndConfig.whitelabelConfig)
			return {
				domainInfo: domainInfoAndConfig.domainInfo,
				whitelabelConfig,
			}
		}
	}
}

export type UserControllerInitData = {
	user: User
	userGroupInfo: GroupInfo
	sessionId: IdTuple
	accessToken: Base64Url
	persistentSession: boolean
}
// noinspection JSUnusedGlobalSymbols
// dynamically imported
export function initUserController(
	{
		user,
		userGroupInfo,
		sessionId,
		accessToken,
		persistentSession
	}: UserControllerInitData
): Promise<UserController> {
	const entityClient = locator.entityClient
	return Promise.all([
		entityClient.loadRoot(TutanotaPropertiesTypeRef, user.userGroup.group),
		entityClient.load(UserSettingsGroupRootTypeRef, user.userGroup.group).catch(
			ofClass(NotFoundError, () =>
				entityClient
					.setup(
						null,
						createUserSettingsGroupRoot({
							_ownerGroup: user.userGroup.group,
						})
					)
					.then(() => entityClient.load(UserSettingsGroupRootTypeRef, user.userGroup.group)),
			),
		),
	]).then(
		([props, userSettingsGroupRoot]) =>
			new UserController(user, userGroupInfo, sessionId, props, accessToken, persistentSession, userSettingsGroupRoot, entityClient),
	)
}