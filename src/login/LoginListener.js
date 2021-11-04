// @flow
import m from "mithril"
import type {LoggedInEvent, LoginEventHandler} from "../api/main/LoginController"
import {logins, SessionType} from "../api/main/LoginController"
import {isAdminClient, isApp, isDesktop, LOGIN_TITLE, Mode} from "../api/common/Env"
import {assertNotNull, neverNull, noOp, ofClass} from "@tutao/tutanota-utils"
import {windowFacade} from "../misc/WindowFacade"
import {checkApprovalStatus} from "../misc/LoginUtils"
import {secondFactorHandler} from "../misc/SecondFactorHandler"
import {locator} from "../api/main/MainLocator"
import {serviceRequestVoid} from "../api/main/Entity"
import {TutanotaService} from "../api/entities/tutanota/Services"
import {HttpMethod} from "../api/common/EntityFunctions"
import {lang} from "../misc/LanguageViewModel"
import {getHourCycle} from "../misc/Formatter"
import type {OutOfOfficeNotification} from "../api/entities/tutanota/OutOfOfficeNotification"
import {isNotificationCurrentlyActive, loadOutOfOfficeNotification} from "../misc/OutOfOfficeNotificationUtils"
import * as notificationOverlay from "../gui/base/NotificationOverlay"
import {ButtonType} from "../gui/base/ButtonN"
import type {Theme} from "../gui/theme"
import {themeController} from "../gui/theme"
import {Dialog} from "../gui/base/Dialog"
import {CloseEventBusOption, Const} from "../api/common/TutanotaConstants"
import {showMoreStorageNeededOrderDialog} from "../misc/SubscriptionDialogs"
import {notifications} from "../gui/Notifications"
import {createReceiveInfoServiceData} from "../api/entities/tutanota/ReceiveInfoServiceData"
import {CustomerPropertiesTypeRef} from "../api/entities/sys/CustomerProperties"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {LockedError} from "../api/common/error/RestError"
import type {ICredentialsProvider} from "../misc/credentials/CredentialsProvider"
import {showCredentialsEncryptionModeDialog} from "../gui/dialogs/SelectCredentialsEncryptionModeDialog"
import {usingKeychainAuthentication} from "../misc/credentials/CredentialsProviderFactory"

export async function registerLoginListener(credentialsProvider: ICredentialsProvider) {
	logins.registerHandler(new LoginListener(credentialsProvider))
}

/**
 * This is a collection of all things that need to be initialized/global state to be set after a user has logged in successfully.
 */
class LoginListener implements LoginEventHandler {
	+_credentialsProvider: ICredentialsProvider


	constructor(credentialsProvider: ICredentialsProvider) {
		this._credentialsProvider = credentialsProvider
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
			let postLoginTitle = (document.title === LOGIN_TITLE) ? "Tutanota" : document.title
			document.title = neverNull(logins.getUserController().userGroupInfo.mailAddress) + " - " + postLoginTitle
		}

		notifications.requestPermission()


		if (loggedInEvent.sessionType === SessionType.Persistent
			&& await usingKeychainAuthentication()
			&& this._credentialsProvider.getCredentialsEncryptionMode() == null
		) {
			await showCredentialsEncryptionModeDialog(this._credentialsProvider)
		}

		// Do not wait
		this.asyncActions()
	}

	async asyncActions() {
		await checkApprovalStatus(logins, true)

		await this._showUpgradeReminder()
		await this._checkStorageWarningLimit()
		secondFactorHandler.setupAcceptOtherClientLoginListener()
		if (!isAdminClient()) {
			await locator.mailModel.init()
			await locator.calendarModel.init()
			await this._remindActiveOutOfOfficeNotification()
		}
		if (isApp() || isDesktop()) {
			// don't wait for it, just invoke
			import("../native/common/FileApp")
				.then(({fileApp}) => fileApp.clearFileData())
				.catch((e) => console.log("Failed to clean file data", e))

			import("../native/main/PushServiceApp").then(({pushServiceApp}) => pushServiceApp.register())

			await this._maybeSetCustomTheme()
		}
		if (logins.isGlobalAdminUserLoggedIn() && !isAdminClient()) {
			const receiveInfoData = createReceiveInfoServiceData({language: lang.code})
			await serviceRequestVoid(TutanotaService.ReceiveInfoService, HttpMethod.POST, receiveInfoData)
		}
		lang.updateFormats({
			hourCycle: getHourCycle(logins.getUserController().userSettingsGroupRoot)
		})
		this._enforcePasswordChange()
	}

	_deactivateOutOfOfficeNotification(notification: OutOfOfficeNotification): Promise<void> {
		notification.enabled = false
		return locator.entityClient.update(notification)
	}

	_remindActiveOutOfOfficeNotification(): Promise<void> {
		return loadOutOfOfficeNotification().then((notification) => {
			if (notification && isNotificationCurrentlyActive(notification, new Date())) {
				const notificationMessage: MComponent<void> = {
					view: () => {
						return m("", lang.get("outOfOfficeReminder_label"))
					}
				}
				notificationOverlay.show(notificationMessage, {label: "close_alt"}, [
					{
						label: "deactivate_action",
						click: () => this._deactivateOutOfOfficeNotification(notification),
						type: ButtonType.Primary
					}
				])

			}
		})
	}

	async _maybeSetCustomTheme(): Promise<*> {
		const domainInfoAndConfig = await logins.getUserController().loadWhitelabelConfig()
		if (domainInfoAndConfig && domainInfoAndConfig.whitelabelConfig.jsonTheme) {
			const newTheme: Theme = JSON.parse(domainInfoAndConfig.whitelabelConfig.jsonTheme)

			// jsonTheme is stored on WhitelabelConfig as an empty json string ("{}", or whatever JSON.stringify({}) gives you)
			// so we can't just check `!whitelabelConfig.jsonTheme` or something like this
			if (Object.keys(newTheme).length > 0) {
				newTheme.themeId = domainInfoAndConfig.domainInfo.domain
				const previouslySavedThemes = await themeController.getCustomThemes()
				await themeController.updateSavedThemeDefinition(newTheme)
				const isExistingTheme = previouslySavedThemes.includes(domainInfoAndConfig.domainInfo.domain)
				if (!isExistingTheme && await Dialog.confirm("whitelabelThemeDetected_msg")) {
					await themeController.setThemeId(newTheme.themeId)
				} else {
					// If the theme has changed we want to reload it, otherwise this is no-op
					await themeController.reloadTheme()
				}
			}
		}
	}

	_checkStorageWarningLimit(): Promise<void> {
		if (!logins.getUserController().isGlobalAdmin()) {
			return Promise.resolve()
		}
		const customerId = assertNotNull(logins.getUserController().user.customer)
		return locator.customerFacade.readUsedCustomerStorage(customerId).then(usedStorage => {
			if (Number(usedStorage) > (Const.MEMORY_GB_FACTOR * Const.MEMORY_WARNING_FACTOR)) {
				return locator.customerFacade.readAvailableCustomerStorage(customerId).then(availableStorage => {
					if (Number(usedStorage) > (Number(availableStorage) * Const.MEMORY_WARNING_FACTOR)) {
						showMoreStorageNeededOrderDialog(logins, "insufficientStorageWarning_msg")
					}
				})
			}
		})
	}

	_showUpgradeReminder(): Promise<void> {
		if (logins.getUserController().isFreeAccount() && env.mode !== Mode.App) {
			return logins.getUserController().loadCustomer().then(customer => {
				return locator.entityClient.load(CustomerPropertiesTypeRef, neverNull(customer.properties)).then(properties => {
					return locator.entityClient.load(CustomerInfoTypeRef, customer.customerInfo).then(customerInfo => {
						if (properties.lastUpgradeReminder == null && (customerInfo.creationTime.getTime()
							+ Const.UPGRADE_REMINDER_INTERVAL) < new Date().getTime()) {
							let message = lang.get("premiumOffer_msg")
							let title = lang.get("upgradeReminderTitle_msg")
							return Dialog.reminder(title, message, lang.getInfoLink("premiumProBusiness_link")).then(confirm => {
								if (confirm) {
									import("../subscription/UpgradeSubscriptionWizard").then((wizard) => wizard.showUpgradeWizard())
								}
							}).then(() => {
								properties.lastUpgradeReminder = new Date()
								locator.entityClient.update(properties).catch(ofClass(LockedError, noOp))
							})
						}
					})
				})
			});
		} else {
			return Promise.resolve();
		}
	}

	_enforcePasswordChange(): void {
		if (logins.getUserController().user.requirePasswordUpdate) {
			import("../settings/PasswordForm").then(({PasswordForm}) => {
				return PasswordForm.showChangeOwnPasswordDialog(false)
			})
		}
	}
}