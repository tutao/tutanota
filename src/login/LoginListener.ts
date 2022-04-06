import m, {Component} from "mithril"
import type {LoggedInEvent, LoginEventHandler} from "../api/main/LoginController"
import {logins} from "../api/main/LoginController"
import {isAdminClient, isApp, isDesktop, LOGIN_TITLE, Mode} from "../api/common/Env"
import {assertNotNull, neverNull, noOp, ofClass} from "@tutao/tutanota-utils"
import {windowFacade} from "../misc/WindowFacade"
import {checkApprovalStatus} from "../misc/LoginUtils"
import {locator} from "../api/main/MainLocator"
import {ReceiveInfoService} from "../api/entities/tutanota/Services"
import {InfoLink, lang} from "../misc/LanguageViewModel"
import {getHourCycle} from "../misc/Formatter"
import type {OutOfOfficeNotification} from "../api/entities/tutanota/OutOfOfficeNotification"
import {isNotificationCurrentlyActive, loadOutOfOfficeNotification} from "../misc/OutOfOfficeNotificationUtils"
import * as notificationOverlay from "../gui/base/NotificationOverlay"
import {ButtonType} from "../gui/base/ButtonN"
import {themeController} from "../gui/theme"
import {Dialog} from "../gui/base/Dialog"
import {CloseEventBusOption, Const} from "../api/common/TutanotaConstants"
import {showMoreStorageNeededOrderDialog} from "../misc/SubscriptionDialogs"
import {notifications} from "../gui/Notifications"
import {createReceiveInfoServiceData} from "../api/entities/tutanota/ReceiveInfoServiceData"
import {CustomerPropertiesTypeRef} from "../api/entities/sys/CustomerProperties"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {LockedError} from "../api/common/error/RestError"
import type {CredentialsDeletedEvent, ICredentialsProvider} from "../misc/credentials/CredentialsProvider"
import {CREDENTIALS_DELETED_EVENT} from "../misc/credentials/CredentialsProvider"
import {usingKeychainAuthentication} from "../misc/credentials/CredentialsProviderFactory"
import type {ThemeCustomizations} from "../misc/WhitelabelCustomizations"
import {getThemeCustomizations} from "../misc/WhitelabelCustomizations"
import {CredentialEncryptionMode} from "../misc/credentials/CredentialEncryptionMode"
import {SecondFactorHandler} from "../misc/2fa/SecondFactorHandler"
import {SessionType} from "../api/common/SessionType"
import {TtlBehavior} from "../misc/UsageTestModel"

export async function registerLoginListener(
	credentialsProvider: ICredentialsProvider,
	secondFactorHandler: SecondFactorHandler,
) {
	logins.registerHandler(new LoginListener(credentialsProvider, secondFactorHandler))
}

/**
 * This is a collection of all things that need to be initialized/global state to be set after a user has logged in successfully.
 */

class LoginListener implements LoginEventHandler {
	constructor(
		public readonly credentialsProvider: ICredentialsProvider,
		public secondFactorHandler: SecondFactorHandler,
	) {
	}

	async onLoginSuccess(loggedInEvent: LoggedInEvent): Promise<void> {
		// We establish websocket connection even for temporary sessions because we need to get updates e.g. during singup
		windowFacade.addOnlineListener(() => {
			console.log(new Date().toISOString(), "online - try reconnect")
			// When we try to connect after receiving online event it might not succeed so we delay reconnect attempt by 2s
			locator.worker.tryReconnectEventBus(true, true, 2000)
		})
		windowFacade.addOfflineListener(() => {
			console.log(new Date().toISOString(), "offline - pause event bus")
			locator.worker.closeEventBus(CloseEventBusOption.Pause)
		})

		if (loggedInEvent.sessionType === SessionType.Temporary) {
			return
		}

		// only show "Tutanota" after login if there is no custom title set
		if (!logins.getUserController().isInternalUser()) {
			if (document.title === LOGIN_TITLE) {
				document.title = "Tutanota"
			}

			return
		} else {
			let postLoginTitle = document.title === LOGIN_TITLE ? "Tutanota" : document.title
			document.title = neverNull(logins.getUserController().userGroupInfo.mailAddress) + " - " + postLoginTitle
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

		locator.usageTestController.addTests(await locator.usageTestModel.loadActiveUsageTests(TtlBehavior.PossiblyOutdated))

		// Do not wait
		this.asyncActions()
	}

	private async asyncActions() {
		await checkApprovalStatus(logins, true)
		await this.showUpgradeReminder()
		await this.checkStorageWarningLimit()

		this.secondFactorHandler.setupAcceptOtherClientLoginListener()

		if (!isAdminClient()) {
			await locator.mailModel.init()
			await locator.calendarModel.init()
			await this.remindActiveOutOfOfficeNotification()
		}

		if (isApp() || isDesktop()) {
			// don't wait for it, just invoke
			locator.fileApp.clearFileData().catch(e => console.log("Failed to clean file data", e))
			locator.pushService.register()
			await this.maybeSetCustomTheme()
		}

		if (logins.isGlobalAdminUserLoggedIn() && !isAdminClient()) {
			const receiveInfoData = createReceiveInfoServiceData({
				language: lang.code,
			})
			await locator.serviceExecutor.post(ReceiveInfoService, receiveInfoData)
		}

		lang.updateFormats({
			hourCycle: getHourCycle(logins.getUserController().userSettingsGroupRoot),
		})

		// Get any tests, as soon as possible even if they are stale
		locator.usageTestController.addTests(await locator.usageTestModel.loadActiveUsageTests(TtlBehavior.UpToDateOnly))

		this.enforcePasswordChange()

		if (isDesktop()) {
			locator.interWindowEventBus.events.map(async (event) => {
				if (event.name === CREDENTIALS_DELETED_EVENT) {
					if ((event as CredentialsDeletedEvent).userId === logins.getUserController().user._id) {
						await logins.logout(false)
						await windowFacade.reload({noAutoLogin: true})
					}
				}
			})
		}
	}

	private deactivateOutOfOfficeNotification(notification: OutOfOfficeNotification): Promise<void> {
		notification.enabled = false
		return locator.entityClient.update(notification)
	}

	private remindActiveOutOfOfficeNotification(): Promise<void> {
		return loadOutOfOfficeNotification().then(notification => {
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
		const domainInfoAndConfig = await logins.getUserController().loadWhitelabelConfig()

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

	private checkStorageWarningLimit(): Promise<void> {
		if (!logins.getUserController().isGlobalAdmin()) {
			return Promise.resolve()
		}

		const customerId = assertNotNull(logins.getUserController().user.customer)
		return locator.customerFacade.readUsedCustomerStorage(customerId).then(usedStorage => {
			if (Number(usedStorage) > Const.MEMORY_GB_FACTOR * Const.MEMORY_WARNING_FACTOR) {
				return locator.customerFacade.readAvailableCustomerStorage(customerId).then(availableStorage => {
					if (Number(usedStorage) > Number(availableStorage) * Const.MEMORY_WARNING_FACTOR) {
						showMoreStorageNeededOrderDialog(logins, "insufficientStorageWarning_msg")
					}
				})
			}
		})
	}

	private showUpgradeReminder(): Promise<void> {
		if (logins.getUserController().isFreeAccount() && env.mode !== Mode.App) {
			return logins
				.getUserController()
				.loadCustomer()
				.then(customer => {
					return locator.entityClient.load(CustomerPropertiesTypeRef, neverNull(customer.properties)).then(properties => {
						return locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo).then(customerInfo => {
							if (
								properties.lastUpgradeReminder == null &&
								customerInfo.creationTime.getTime() + Const.UPGRADE_REMINDER_INTERVAL < new Date().getTime()
							) {
								let message = lang.get("premiumOffer_msg")
								let title = lang.get("upgradeReminderTitle_msg")
								return Dialog.reminder(title, message, InfoLink.PremiumProBusiness)
											 .then(confirm => {
												 if (confirm) {
													 import("../subscription/UpgradeSubscriptionWizard").then(wizard => wizard.showUpgradeWizard())
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
		if (logins.getUserController().user.requirePasswordUpdate) {
			import("../settings/PasswordForm").then(({PasswordForm}) => {
				return PasswordForm.showChangeOwnPasswordDialog(false)
			})
		}
	}
}