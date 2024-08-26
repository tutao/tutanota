import { AccountType, FeatureType, GroupType, LegacyPlans, OperationType, PlanType } from "../common/TutanotaConstants"
import type { Base64Url } from "@tutao/tutanota-utils"
import { assertNotNull, downcast, first, mapAndFilterNull, neverNull, ofClass } from "@tutao/tutanota-utils"
import { MediaType } from "../common/EntityFunctions"
import { assertMainOrNode, getApiBaseUrl, isDesktop } from "../common/Env"

import { NotFoundError } from "../common/error/RestError"
import { locator } from "./CommonLocator"
import { elementIdPart, isSameId, listIdPart } from "../common/utils/EntityUtils"
import { getWhitelabelCustomizations } from "../../misc/WhitelabelCustomizations"
import { EntityClient } from "../common/EntityClient"
import { CloseSessionService, PlanService } from "../entities/sys/Services"
import {
	AccountingInfo,
	AccountingInfoTypeRef,
	createCloseSessionServicePost,
	Customer,
	CustomerInfo,
	CustomerInfoTypeRef,
	CustomerProperties,
	CustomerPropertiesTypeRef,
	CustomerTypeRef,
	DomainInfo,
	GroupInfo,
	GroupInfoTypeRef,
	GroupMembership,
	PlanConfiguration,
	User,
	UserTypeRef,
	WhitelabelConfig,
	WhitelabelConfigTypeRef,
} from "../entities/sys/TypeRefs"
import {
	createUserSettingsGroupRoot,
	TutanotaProperties,
	TutanotaPropertiesTypeRef,
	UserSettingsGroupRoot,
	UserSettingsGroupRootTypeRef,
} from "../entities/tutanota/TypeRefs"
import { typeModels as sysTypeModels } from "../entities/sys/TypeModels"
import { SessionType } from "../common/SessionType"
import { IServiceExecutor } from "../common/ServiceRequest.js"
import { isCustomizationEnabledForCustomer } from "../common/utils/CustomerUtils.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../common/utils/EntityUpdateUtils.js"

assertMainOrNode()

export class UserController {
	private planConfig: PlanConfiguration | null

	constructor(
		// should be readonly but is needed for a workaround in CalendarModel
		public user: User,
		private _userGroupInfo: GroupInfo,
		public readonly sessionId: IdTuple,
		private _props: TutanotaProperties,
		public readonly accessToken: Base64Url,
		private _userSettingsGroupRoot: UserSettingsGroupRoot,
		public readonly sessionType: SessionType,
		/** Which identifier (e.g. email address) was used to create the session. */
		public readonly loginUsername: string,
		private readonly entityClient: EntityClient,
		private readonly serviceExecutor: IServiceExecutor,
	) {
		this.planConfig = null
	}

	get userId(): Id {
		return this.user._id
	}

	get props(): TutanotaProperties {
		return this._props
	}

	get userGroupInfo(): GroupInfo {
		return this._userGroupInfo
	}

	get userSettingsGroupRoot(): UserSettingsGroupRoot {
		return this._userSettingsGroupRoot
	}

	/**
	 * Checks if the current user is an admin of the customer.
	 * @return True if the user is an admin
	 */
	isGlobalAdmin(): boolean {
		if (this.isInternalUser()) {
			return this.user.memberships.some((m) => m.groupType === GroupType.Admin)
		} else {
			return false
		}
	}

	/**
	 * Checks if the account type of the logged-in user is FREE.
	 * @returns True if the account type is FREE otherwise false
	 */
	isFreeAccount(): boolean {
		return this.user.accountType === AccountType.FREE
	}

	isPremiumAccount(): boolean {
		return this.user.accountType === AccountType.PAID
	}

	/**
	 * Provides the information if an internal user is logged in.
	 * @return True if an internal user is logged in, false if no user or an external user is logged in.
	 */
	isInternalUser(): boolean {
		return this.user.accountType !== AccountType.EXTERNAL
	}

	loadCustomer(): Promise<Customer> {
		return this.entityClient.load(CustomerTypeRef, neverNull(this.user.customer))
	}

	async loadCustomerInfo(): Promise<CustomerInfo> {
		const customer = await this.loadCustomer()
		return await this.entityClient.load(CustomerInfoTypeRef, customer.customerInfo)
	}

	async loadCustomerProperties(): Promise<CustomerProperties> {
		const customer = await this.loadCustomer()
		return await this.entityClient.load(CustomerPropertiesTypeRef, assertNotNull(customer.properties))
	}

	async getPlanType(): Promise<PlanType> {
		const customerInfo = await this.loadCustomerInfo()
		return downcast(customerInfo.plan)
	}

	async getPlanConfig(): Promise<PlanConfiguration> {
		if (this.planConfig === null) {
			const planServiceGetOut = await this.serviceExecutor.get(PlanService, null)
			this.planConfig = planServiceGetOut.config
		}
		return downcast(this.planConfig)
	}

	isLegacyPlan(type: PlanType): boolean {
		return LegacyPlans.includes(type)
	}

	async isNewPaidPlan(): Promise<boolean> {
		const type = await this.getPlanType()
		return !this.isLegacyPlan(type) && type !== PlanType.Free
	}

	async useLegacyBookingItem(): Promise<boolean> {
		const customerInfo = await this.loadCustomerInfo()
		const type: PlanType = downcast(customerInfo.plan)
		return !(this.isLegacyPlan(type) && customerInfo.customPlan == null) && type !== PlanType.Free
	}

	/**
	 * Checks if the current plan allows adding users and groups.
	 */
	async canHaveUsers(): Promise<boolean> {
		const customer = await this.loadCustomer()
		const planType = await this.getPlanType()
		const planConfig = await this.getPlanConfig()

		return this.isLegacyPlan(planType) || planConfig.multiUser || isCustomizationEnabledForCustomer(customer, FeatureType.MultipleUsers)
	}

	async loadAccountingInfo(): Promise<AccountingInfo> {
		const customerInfo = await this.loadCustomerInfo()
		return await this.entityClient.load(AccountingInfoTypeRef, customerInfo.accountingInfo)
	}

	getMailGroupMemberships(): GroupMembership[] {
		return this.user.memberships.filter((membership) => membership.groupType === GroupType.Mail)
	}

	getContactGroupMemberships(): GroupMembership[] {
		return this.user.memberships.filter((membership) => membership.groupType === GroupType.Contact)
	}

	getCalendarMemberships(): GroupMembership[] {
		return this.user.memberships.filter((membership) => membership.groupType === GroupType.Calendar)
	}

	getUserMailGroupMembership(): GroupMembership {
		return this.getMailGroupMemberships()[0]
	}

	getTemplateMemberships(): GroupMembership[] {
		return this.user.memberships.filter((membership) => membership.groupType === GroupType.Template)
	}

	getContactListMemberships(): GroupMembership[] {
		return this.user.memberships.filter((membership) => membership.groupType === GroupType.ContactList)
	}

	/**
	 * Returns true if the given update is an update on the user instance of the logged in user and the update event is sent for the user group.
	 * There are two updates for the user instance sent if the logged in user is an admin:, one for the user group and one for the admin group.
	 * We only want to process it once, so we skip the admin group update
	 *
	 * Attention: Modules that act on user updates, e.g. for changed group memberships, need to use this function in their entityEventsReceived listener.
	 * Only then it is guaranteed that the user in the user controller has been updated. The update event for the admin group might come first, so if a module
	 * reacts on that one the user controller is not updated yet.
	 */
	isUpdateForLoggedInUserInstance(update: EntityUpdateData, eventOwnerGroupId: Id): boolean {
		return (
			update.operation === OperationType.UPDATE &&
			isUpdateForTypeRef(UserTypeRef, update) &&
			isSameId(this.user._id, update.instanceId) &&
			isSameId(this.user.userGroup.group, eventOwnerGroupId)
		) // only include updates for the user group here
	}

	async entityEventsReceived(updates: ReadonlyArray<EntityUpdateData>, eventOwnerGroupId: Id): Promise<void> {
		for (const update of updates) {
			const { instanceListId, instanceId, operation } = update
			if (this.isUpdateForLoggedInUserInstance(update, eventOwnerGroupId)) {
				this.user = await this.entityClient.load(UserTypeRef, this.user._id)
			} else if (
				operation === OperationType.UPDATE &&
				isUpdateForTypeRef(GroupInfoTypeRef, update) &&
				isSameId(this.userGroupInfo._id, [neverNull(instanceListId), instanceId])
			) {
				this._userGroupInfo = await this.entityClient.load(GroupInfoTypeRef, this._userGroupInfo._id)
			} else if (isUpdateForTypeRef(TutanotaPropertiesTypeRef, update) && operation === OperationType.UPDATE) {
				this._props = await this.entityClient.loadRoot(TutanotaPropertiesTypeRef, this.user.userGroup.group)
			} else if (isUpdateForTypeRef(UserSettingsGroupRootTypeRef, update)) {
				this._userSettingsGroupRoot = await this.entityClient.load(UserSettingsGroupRootTypeRef, this.user.userGroup.group)
			} else if (isUpdateForTypeRef(CustomerInfoTypeRef, update)) {
				if (operation === OperationType.CREATE) {
					// After premium upgrade customer info is deleted and created with new id. We want to make sure that it's cached for offline login.
					await this.entityClient.load(CustomerInfoTypeRef, [update.instanceListId, update.instanceId])
				}
				// cached plan config might be outdated now
				this.planConfig = null
			}
		}
	}

	/**
	 * Delete the session (only if it's a non-persistent session
	 * @param sync whether or not to delete in the main thread. For example, will be true when logging out due to closing the tab
	 */
	async deleteSession(sync: boolean): Promise<void> {
		// in case the tab is closed we need to delete the session in the main thread (synchronous rest request)
		if (sync) {
			if (this.sessionType !== SessionType.Persistent) {
				await this.deleteSessionSync()
			}
		} else {
			if (this.sessionType !== SessionType.Persistent) {
				await locator.loginFacade.deleteSession(this.accessToken).catch((e) => console.log("Error ignored on Logout:", e))
			}
			await locator.worker.reset()
		}
	}

	deleteSessionSync(): Promise<void> {
		return new Promise((resolve, reject) => {
			const sendBeacon = navigator.sendBeacon // Save sendBeacon to variable to satisfy type checker

			if (sendBeacon) {
				try {
					const apiUrl = new URL(getApiBaseUrl(locator.domainConfigProvider().getCurrentDomainConfig()))
					apiUrl.pathname += `/rest/sys/${CloseSessionService.name.toLowerCase()}`
					const requestObject = createCloseSessionServicePost({
						accessToken: this.accessToken,
						sessionId: this.sessionId,
					})
					delete downcast(requestObject)["_type"] // Remove extra field which is not part of the data model

					// Send as Blob to be able to set content type otherwise sends 'text/plain'
					const queued = sendBeacon.call(
						navigator,
						apiUrl,
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
				// Fall back to sync XHR if Beacon API is not available (which it should be everywhere by now but maybe it is suppressed somehow)
				const apiUrl = new URL(getApiBaseUrl(locator.domainConfigProvider().getCurrentDomainConfig()))
				apiUrl.pathname += `/rest/sys/session/${listIdPart(this.sessionId)}/${elementIdPart(this.sessionId)}`
				const xhr = new XMLHttpRequest()
				xhr.open("DELETE", apiUrl, false) // sync requests increase reliability when invoked in onunload

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
		return customerInfo.domainInfos.some((domainInfo) => domainInfo.whitelabelConfig)
	}

	async loadWhitelabelConfig(): Promise<
		| {
				whitelabelConfig: WhitelabelConfig
				domainInfo: DomainInfo
		  }
		| null
		| undefined
	> {
		// The model allows for multiple domainInfos to have whitelabel configs
		// but in reality on the server only a single custom configuration is allowed
		// therefore the result of the filtering all domainInfos with no whitelabelConfig
		// can only be an array of length 0 or 1
		const customerInfo = await this.loadCustomerInfo()
		const domainInfoAndConfig = first(
			mapAndFilterNull(
				customerInfo.domainInfos,
				(domainInfo) =>
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
	sessionType: SessionType
	loginUsername: string
}
// noinspection JSUnusedGlobalSymbols
// dynamically imported
export async function initUserController({
	user,
	userGroupInfo,
	sessionId,
	accessToken,
	sessionType,
	loginUsername,
}: UserControllerInitData): Promise<UserController> {
	const entityClient = locator.entityClient
	const [props, userSettingsGroupRoot] = await Promise.all([
		entityClient.loadRoot(TutanotaPropertiesTypeRef, user.userGroup.group),
		entityClient.load(UserSettingsGroupRootTypeRef, user.userGroup.group).catch(
			ofClass(NotFoundError, () =>
				entityClient
					.setup(
						null,
						createUserSettingsGroupRoot({
							_ownerGroup: user.userGroup.group,
							startOfTheWeek: "0",
							timeFormat: "0",
							groupSettings: [],
							usageDataOptedIn: null,
						}),
					)
					.then(() => entityClient.load(UserSettingsGroupRootTypeRef, user.userGroup.group)),
			),
		),
	])
	return new UserController(
		user,
		userGroupInfo,
		sessionId,
		props,
		accessToken,
		userSettingsGroupRoot,
		sessionType,
		loginUsername,
		entityClient,
		locator.serviceExecutor,
	)
}
