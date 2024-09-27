import m, { Component } from "mithril"
import type { LoggedInEvent, PostLoginAction } from "../api/main/LoginController"
import { LoginController } from "../api/main/LoginController"
import { isAdminClient, isApp, isDesktop, LOGIN_TITLE } from "../api/common/Env"
import { assertNotNull, defer, delay, neverNull, noOp, ofClass } from "@tutao/tutanota-utils"
import { windowFacade } from "../misc/WindowFacade.js"
import { checkApprovalStatus } from "../misc/LoginUtils.js"
import { locator } from "../api/main/CommonLocator"
import { ReceiveInfoService } from "../api/entities/tutanota/Services"
import { lang } from "../misc/LanguageViewModel.js"
import { getHourCycle } from "../misc/Formatter.js"
import { createReceiveInfoServiceData, OutOfOfficeNotification } from "../api/entities/tutanota/TypeRefs.js"
import { isNotificationCurrentlyActive, loadOutOfOfficeNotification } from "../misc/OutOfOfficeNotificationUtils.js"
import * as notificationOverlay from "../gui/base/NotificationOverlay"
import { ButtonType } from "../gui/base/Button.js"
import { Dialog } from "../gui/base/Dialog"
import { CloseEventBusOption, Const, SecondFactorType } from "../api/common/TutanotaConstants"
import { showMoreStorageNeededOrderDialog } from "../misc/SubscriptionDialogs.js"
import { notifications } from "../gui/Notifications"
import { LockedError } from "../api/common/error/RestError"
import { CredentialsProvider, usingKeychainAuthenticationWithOptions } from "../misc/credentials/CredentialsProvider.js"
import type { ThemeCustomizations } from "../misc/WhitelabelCustomizations.js"
import { getThemeCustomizations } from "../misc/WhitelabelCustomizations.js"
import { CredentialEncryptionMode } from "../misc/credentials/CredentialEncryptionMode.js"
import { SecondFactorHandler } from "../misc/2fa/SecondFactorHandler.js"
import { SessionType } from "../api/common/SessionType"
import { StorageBehavior } from "../misc/UsageTestModel.js"
import type { WebsocketConnectivityModel } from "../misc/WebsocketConnectivityModel.js"
import { DateProvider } from "../api/common/DateProvider.js"
import { createCustomerProperties, CustomerTypeRef, SecondFactorTypeRef } from "../api/entities/sys/TypeRefs.js"
import { EntityClient } from "../api/common/EntityClient.js"
import { shouldShowStorageWarning, shouldShowUpgradeReminder } from "./PostLoginUtils.js"
import { UserManagementFacade } from "../api/worker/facades/lazy/UserManagementFacade.js"
import { CustomerFacade } from "../api/worker/facades/lazy/CustomerFacade.js"
import { deviceConfig } from "../misc/DeviceConfig.js"
import { ThemeController } from "../gui/ThemeController.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../api/common/utils/EntityUpdateUtils.js"

/**
 * This is a collection of all things that need to be initialized/global state to be set after a user has logged in successfully.
 */

export class PostLoginActions implements PostLoginAction {
	constructor(
		private readonly credentialsProvider: CredentialsProvider,
		public secondFactorHandler: SecondFactorHandler,
		private readonly connectivityModel: WebsocketConnectivityModel,
		private readonly logins: LoginController,
		private readonly dateProvider: DateProvider,
		private readonly entityClient: EntityClient,
		private readonly userManagementFacade: UserManagementFacade,
		private readonly customerFacade: CustomerFacade,
		private readonly themeController: ThemeController,
		private readonly showSetupWizard: () => unknown,
		private readonly appPartialLoginSuccessActions: () => unknown,
		private readonly syncExternalCalendars: () => unknown,
	) {}

	async onPartialLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {
		// We establish websocket connection even for temporary sessions because we need to get updates e.g. during signup
		windowFacade.addOnlineListener(() => {
			console.log(new Date().toISOString(), "online - try reconnect")
			if (this.logins.isFullyLoggedIn()) {
				// When we try to connect after receiving online event it might not succeed so we delay reconnect attempt by 2s
				this.connectivityModel.tryReconnect(true, true, 2000)
			} else {
				// log in user
				this.logins.retryAsyncLogin()
			}
		})
		windowFacade.addOfflineListener(() => {
			console.log(new Date().toISOString(), "offline - pause event bus")
			this.connectivityModel.close(CloseEventBusOption.Pause)
		})

		// only show "Tuta Mail" after login if there is no custom title set
		if (!this.logins.getUserController().isInternalUser()) {
			if (document.title === LOGIN_TITLE) {
				document.title = "Tuta Mail"
			}

			return
		} else {
			let postLoginTitle = document.title === LOGIN_TITLE ? "Tuta Mail" : document.title
			document.title = neverNull(this.logins.getUserController().userGroupInfo.mailAddress) + " - " + postLoginTitle
		}
		notifications.requestPermission()

		if (
			loggedInEvent.sessionType === SessionType.Persistent &&
			usingKeychainAuthenticationWithOptions() &&
			(await this.credentialsProvider.getCredentialEncryptionMode()) == null
		) {
			// If the encryption mode is not selected, we opt user into automatic mode.
			// We keep doing it here for now to have some flexibility if we want to show some other option here in the future.
			await this.credentialsProvider.setCredentialEncryptionMode(CredentialEncryptionMode.DEVICE_LOCK)
		}

		lang.updateFormats({
			// partial
			hourCycle: getHourCycle(this.logins.getUserController().userSettingsGroupRoot),
		})

		// We already have user data to load themes
		if (isApp() || isDesktop()) {
			await this.storeNewCustomThemes()
		}
	}

	async onFullLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {
		if (loggedInEvent.sessionType === SessionType.Temporary || !this.logins.getUserController().isInternalUser()) {
			return
		}

		// Do not wait
		this.fullLoginAsyncActions()

		this.showSetupWizardIfNeeded()
	}

	// Runs the user approval check after the user has been updated or after a timeout
	private checkApprovalAfterSync(): Promise<void> {
		// Create a promise we will use to track the completion of the below listener
		const listenerDeferral = defer<void>()
		// Add an event listener to run the check after any customer entity update
		const listener = async (updates: ReadonlyArray<EntityUpdateData>) => {
			// Get whether the entity update contains the customer
			const customer = this.logins.getUserController().user.customer
			const isCustomerUpdate: boolean = updates.some((update) => isUpdateForTypeRef(CustomerTypeRef, update) && update.instanceId === customer)
			if (customer != null && isCustomerUpdate) {
				listenerDeferral.resolve()
			}
		}
		locator.eventController.addEntityListener(listener)

		// Timeout if the entity update does not arrive or takes too long to arrive
		const timeoutPromise = delay(2000)

		// Remove the listener and start the approval check depending on whether a customer update or the timeout resolves first.
		return Promise.race([listenerDeferral.promise, timeoutPromise]).then(() => {
			locator.eventController.removeEntityListener(listener)
			checkApprovalStatus(this.logins, true)
		})
	}

	private async fullLoginAsyncActions() {
		this.checkApprovalAfterSync() // Not awaiting so this is run in parallel
		await this.showUpgradeReminderIfNeeded()
		await this.checkStorageLimit()

		this.secondFactorHandler.setupAcceptOtherClientLoginListener()

		if (!isAdminClient()) {
			// If it failed during the partial login due to missing cache entries we will give it another spin here. If it didn't fail then it's just a noop
			await locator.mailboxModel.init()
			const calendarModel = await locator.calendarModel()
			await calendarModel.init()
			await this.remindActiveOutOfOfficeNotification()
		}

		if (isApp() || isDesktop()) {
			// Do not try to register for notifications while the setup dialog
			// is being shown because we might not have a permission yet and
			// we don't want to ask for it while dialog is shown, we will ask in
			// the dialog anyway.
			// After dialog is finished or dismissed the setup is "complete".
			if ((isApp() && deviceConfig.getIsSetupComplete()) || isDesktop()) {
				// Await the push service registration so `storePushIdentifierLocally()` can set the extended notification mode on Android
				// before `loadNewsIds()` runs the `isShown()` check of the `RichNotificationsNews` news item
				await locator.pushService.register()
			} else {
				console.log("Skipping registering for notifications while setup dialog is shown")
			}

			this.syncExternalCalendars()
		}

		if (this.logins.isGlobalAdminUserLoggedIn() && !isAdminClient()) {
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
		return this.entityClient.update(notification)
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

	private async storeNewCustomThemes(): Promise<void> {
		const domainInfoAndConfig = await this.logins.getUserController().loadWhitelabelConfig()
		if (domainInfoAndConfig && domainInfoAndConfig.whitelabelConfig.jsonTheme) {
			const customizations: ThemeCustomizations = getThemeCustomizations(domainInfoAndConfig.whitelabelConfig)
			// jsonTheme is stored on WhitelabelConfig as an empty json string ("{}", or whatever JSON.stringify({}) gives you)
			// so we can't just check `!whitelabelConfig.jsonTheme`
			if (Object.keys(customizations).length > 0) {
				// Custom theme is missing themeId, so we update it with the whitelabel domain
				if (!customizations.themeId) {
					customizations.themeId = domainInfoAndConfig.domainInfo.domain
				}

				await this.themeController.storeCustomThemeForCustomizations(customizations)

				// Update the already loaded custom themes to their latest version
				const previouslySavedThemes = await this.themeController.getCustomThemes()
				const isExistingTheme = previouslySavedThemes.includes(domainInfoAndConfig.domainInfo.domain)
				if (isExistingTheme) {
					await this.themeController.reloadTheme()
				}
			}
		}
	}

	private async checkStorageLimit(): Promise<void> {
		if (await shouldShowStorageWarning(this.logins.getUserController(), this.userManagementFacade, this.customerFacade)) {
			await showMoreStorageNeededOrderDialog("insufficientStorageWarning_msg")
		}
	}

	private async showUpgradeReminderIfNeeded(): Promise<void> {
		if (await shouldShowUpgradeReminder(this.logins.getUserController(), new Date(this.dateProvider.now()))) {
			const confirmed = await Dialog.reminder(lang.get("upgradeReminderTitle_msg"), lang.get("premiumOffer_msg"))
			if (confirmed) {
				const wizard = await import("../subscription/UpgradeSubscriptionWizard.js")
				await wizard.showUpgradeWizard(this.logins)
			}

			const newCustomerProperties = createCustomerProperties(await this.logins.getUserController().loadCustomerProperties())
			newCustomerProperties.lastUpgradeReminder = new Date(this.dateProvider.now())
			this.entityClient.update(newCustomerProperties).catch(ofClass(LockedError, noOp))
		}
	}

	private async enforcePasswordChange(): Promise<void> {
		if (this.logins.getUserController().user.requirePasswordUpdate) {
			const { showChangeOwnPasswordDialog } = await import("../settings/login/ChangePasswordDialogs.js")
			await showChangeOwnPasswordDialog(false)
		}

		if (location.hostname === Const.DEFAULT_APP_DOMAIN) {
			const user = this.logins.getUserController().user
			const secondFactors = await this.entityClient.loadAll(SecondFactorTypeRef, assertNotNull(user.auth).secondFactors)
			const webauthnFactors = secondFactors.filter((f) => f.type === SecondFactorType.webauthn || f.type === SecondFactorType.u2f)
			// If there are webauthn factors but none of them are for the default domain, show a message
			if (webauthnFactors.length > 0 && !webauthnFactors.some((f) => f.u2f && f.u2f?.appId == Const.WEBAUTHN_RP_ID)) {
				const dialog = Dialog.confirmMultiple("noKeysForThisDomain_msg", [
					{
						label: "skip_action",
						type: ButtonType.Secondary,
						click: () => dialog.close(),
					},
					{
						label: "settings_label",
						type: ButtonType.Primary,
						click: () => {
							dialog.close()
							m.route.set("/settings/login")
						},
					},
				])
			}
		}
	}

	// Show the onboarding wizard if this is the first time the app has been opened since install
	private async showSetupWizardIfNeeded(): Promise<void> {
		const isSetupComplete = deviceConfig.getIsSetupComplete()
		if (isApp() && !isSetupComplete) {
			await this.showSetupWizard()
		}
	}
}
