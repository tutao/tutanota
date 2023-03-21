import m, { Component } from "mithril"
import type { IPostLoginAction, LoggedInEvent } from "../api/main/LoginController"
import { isAdminClient, isApp, isDesktop, LOGIN_TITLE, Mode } from "../api/common/Env"
import { assertNotNull, neverNull, noOp, ofClass } from "@tutao/tutanota-utils"
import { windowFacade } from "../misc/WindowFacade"
import { checkApprovalStatus } from "../misc/LoginUtils"
import { locator } from "../api/main/MainLocator"
import { ReceiveInfoService } from "../api/entities/tutanota/Services"
import { InfoLink, lang } from "../misc/LanguageViewModel"
import { getHourCycle } from "../misc/Formatter"
import type { OutOfOfficeNotification } from "../api/entities/tutanota/TypeRefs.js"
import { createReceiveInfoServiceData } from "../api/entities/tutanota/TypeRefs.js"
import { isNotificationCurrentlyActive, loadOutOfOfficeNotification } from "../misc/OutOfOfficeNotificationUtils"
import * as notificationOverlay from "../gui/base/NotificationOverlay"
import { ButtonType } from "../gui/base/Button.js"
import { themeController } from "../gui/theme"
import { Dialog } from "../gui/base/Dialog"
import { CloseEventBusOption, Const } from "../api/common/TutanotaConstants"
import { showMoreStorageNeededOrderDialog } from "../misc/SubscriptionDialogs"
import { notifications } from "../gui/Notifications"
import { CustomerInfoTypeRef, CustomerPropertiesTypeRef } from "../api/entities/sys/TypeRefs.js"
import { LockedError } from "../api/common/error/RestError"
import type { CredentialsProvider } from "../misc/credentials/CredentialsProvider.js"
import { usingKeychainAuthentication } from "../misc/credentials/CredentialsProviderFactory"
import type { ThemeCustomizations } from "../misc/WhitelabelCustomizations"
import { getThemeCustomizations } from "../misc/WhitelabelCustomizations"
import { CredentialEncryptionMode } from "../misc/credentials/CredentialEncryptionMode"
import { SecondFactorHandler } from "../misc/2fa/SecondFactorHandler"
import { SessionType } from "../api/common/SessionType"
import { StorageBehavior } from "../misc/UsageTestModel.js"
import type { WebsocketConnectivityModel } from "../misc/WebsocketConnectivityModel.js"

/**
 * This is a collection of all things that need to be initialized/global state to be set after a user has logged in successfully.
 */

export class PostLoginActions implements IPostLoginAction {
	constructor(
		private readonly credentialsProvider: CredentialsProvider,
		public secondFactorHandler: SecondFactorHandler,
		private readonly connectivityModel: WebsocketConnectivityModel,
	) {}

	async onPartialLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {
		// We establish websocket connection even for temporary sessions because we need to get updates e.g. during signup
		windowFacade.addOnlineListener(() => {
			console.log(new Date().toISOString(), "online - try reconnect")
			if (locator.logins.isFullyLoggedIn()) {
				// When we try to connect after receiving online event it might not succeed so we delay reconnect attempt by 2s
				this.connectivityModel.tryReconnect(true, true, 2000)
			} else {
				// log in user
				locator.logins.retryAsyncLogin()
			}
		})
		windowFacade.addOfflineListener(() => {
			console.log(new Date().toISOString(), "offline - pause event bus")
			this.connectivityModel.close(CloseEventBusOption.Pause)
		})

		// only show "Tutanota" after login if there is no custom title set
		if (!locator.logins.getUserController().isInternalUser()) {
			if (document.title === LOGIN_TITLE) {
				document.title = "Tutanota"
			}

			return
		} else {
			let postLoginTitle = document.title === LOGIN_TITLE ? "Tutanota" : document.title
			document.title = neverNull(locator.logins.getUserController().userGroupInfo.mailAddress) + " - " + postLoginTitle
		}
		notifications.requestPermission()

		if (
			loggedInEvent.sessionType === SessionType.Persistent &&
			usingKeychainAuthentication() &&
			this.credentialsProvider.getCredentialsEncryptionMode() == null
		) {
			// If the encryption mode is not selected, we opt user into automatic mode.
			// We keep doing it here for now to have some flexibility if we want to show some other option here in the future.
			await this.credentialsProvider.setCredentialsEncryptionMode(CredentialEncryptionMode.DEVICE_LOCK)
		}

		lang.updateFormats({
			// partial
			hourCycle: getHourCycle(locator.logins.getUserController().userSettingsGroupRoot),
		})

		if (isApp() || isDesktop()) {
			// don't wait for it, just invoke
			locator.fileApp.clearFileData().catch((e) => console.log("Failed to clean file data", e))
		}
	}

	async onFullLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {
		if (loggedInEvent.sessionType === SessionType.Temporary || !locator.logins.getUserController().isInternalUser()) {
			return
		}

		// Do not wait
		this.fullLoginAsyncActions()
	}

	private async fullLoginAsyncActions() {
		await checkApprovalStatus(locator.logins, true)
		await this.showUpgradeReminder()
		await this.checkStorageWarningLimit()

		this.secondFactorHandler.setupAcceptOtherClientLoginListener()

		if (!isAdminClient()) {
			// If it failed during the partial login due to missing cache entries we will give it another spin here. If it didn't fail then it's just a noop
			await locator.mailModel.init()
			await locator.calendarModel.init()
			await this.remindActiveOutOfOfficeNotification()
		}

		if (isApp() || isDesktop()) {
			locator.pushService.register()
			await this.maybeSetCustomTheme()
		}

		if (locator.logins.isGlobalAdminUserLoggedIn() && !isAdminClient()) {
			const receiveInfoData = createReceiveInfoServiceData({
				language: lang.code,
			})
			locator.serviceExecutor.post(ReceiveInfoService, receiveInfoData)
		}

		this.enforcePasswordChange()

		const usageTestModel = locator.usageTestModel
		await usageTestModel.init()

		usageTestModel.setStorageBehavior(StorageBehavior.Persist)
		// Load only up-to-date (not older than 1h) assignments here and make a request for that.
		// There should not be a lot of re-rendering at this point since assignments for new tests are usually fetched right after a client version update.
		locator.usageTestController.setTests(await usageTestModel.loadActiveUsageTests())

		// Needs to be called after UsageTestModel.init() if the UsageOptInNews is live! (its isShown() requires an initialized UsageTestModel)
		await locator.newsModel.loadNewsIds()

		// Redraw to render usage tests and news, among other things that may have changed.
		m.redraw()
	}

	private deactivateOutOfOfficeNotification(notification: OutOfOfficeNotification): Promise<void> {
		notification.enabled = false
		return locator.entityClient.update(notification)
	}

	private remindActiveOutOfOfficeNotification(): Promise<void> {
		return loadOutOfOfficeNotification().then((notification) => {
			if (notification && isNotificationCurrentlyActive(notification, new Date())) {
				const notificationMessage: Component = {
					view: () => {
						return m("", lang.get("outOfOfficeReminder_label"))
					},
				}
				notificationOverlay.show(
					notificationMessage,
					{
						label: "close_alt",
					},
					[
						{
							label: "deactivate_action",
							click: () => this.deactivateOutOfOfficeNotification(notification),
							type: ButtonType.Primary,
						},
					],
				)
			}
		})
	}

	private async maybeSetCustomTheme(): Promise<any> {
		const domainInfoAndConfig = await locator.logins.getUserController().loadWhitelabelConfig()

		if (domainInfoAndConfig && domainInfoAndConfig.whitelabelConfig.jsonTheme) {
			const customizations: ThemeCustomizations = getThemeCustomizations(domainInfoAndConfig.whitelabelConfig)

			// jsonTheme is stored on WhitelabelConfig as an empty json string ("{}", or whatever JSON.stringify({}) gives you)
			// so we can't just check `!whitelabelConfig.jsonTheme`
			if (Object.keys(customizations).length > 0) {
				customizations.themeId = domainInfoAndConfig.domainInfo.domain
				const previouslySavedThemes = await themeController.getCustomThemes()
				const newTheme = themeController.assembleTheme(customizations)
				await themeController.updateSavedThemeDefinition(newTheme)
				const isExistingTheme = previouslySavedThemes.includes(domainInfoAndConfig.domainInfo.domain)

				if (!isExistingTheme && (await Dialog.confirm("whitelabelThemeDetected_msg"))) {
					await themeController.setThemeId(newTheme.themeId)
				} else {
					// If the theme has changed we want to reload it, otherwise this is no-op
					await themeController.reloadTheme()
				}
			}
		}
	}

	private async checkStorageWarningLimit(): Promise<void> {
		if (!locator.logins.getUserController().isGlobalAdmin()) {
			return
		}

		const customerId = assertNotNull(locator.logins.getUserController().user.customer)
		const usedStorage = await locator.customerFacade.readUsedCustomerStorage(customerId)
		if (Number(usedStorage) > Const.MEMORY_GB_FACTOR * Const.MEMORY_WARNING_FACTOR) {
			const availableStorage = await locator.customerFacade.readAvailableCustomerStorage(customerId)
			if (Number(usedStorage) > Number(availableStorage) * Const.MEMORY_WARNING_FACTOR) {
				showMoreStorageNeededOrderDialog(locator.logins, "insufficientStorageWarning_msg")
			}
		}
	}

	private showUpgradeReminder(): Promise<void> {
		if (locator.logins.getUserController().isFreeAccount() && env.mode !== Mode.App) {
			return locator.logins
				.getUserController()
				.loadCustomer()
				.then((customer) => {
					return locator.entityClient.load(CustomerPropertiesTypeRef, neverNull(customer.properties)).then((properties) => {
						return locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo).then((customerInfo) => {
							if (
								properties.lastUpgradeReminder == null &&
								customerInfo.creationTime.getTime() + Const.UPGRADE_REMINDER_INTERVAL < new Date().getTime()
							) {
								let message = lang.get("premiumOffer_msg")
								let title = lang.get("upgradeReminderTitle_msg")
								return Dialog.reminder(title, message, InfoLink.PremiumProBusiness)
									.then((confirm) => {
										if (confirm) {
											import("../subscription/UpgradeSubscriptionWizard").then((wizard) => wizard.showUpgradeWizard())
										}
									})
									.then(() => {
										properties.lastUpgradeReminder = new Date()
										locator.entityClient.update(properties).catch(ofClass(LockedError, noOp))
									})
							}
						})
					})
				})
		} else {
			return Promise.resolve()
		}
	}

	private enforcePasswordChange(): void {
		if (locator.logins.getUserController().user.requirePasswordUpdate) {
			import("../settings/login/ChangePasswordDialogs.js").then(({ showChangeOwnPasswordDialog }) => {
				return showChangeOwnPasswordDialog(false)
			})
		}
	}
}
