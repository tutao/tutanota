//@flow
import m from "mithril"
import {worker} from "../api/main/WorkerClient"
import {Dialog} from "../gui/base/Dialog"
import {
	AccessBlockedError,
	AccessDeactivatedError,
	AccessExpiredError,
	BadRequestError,
	LockedError,
	NotAuthenticatedError,
	NotFoundError,
	TooManyRequestsError
} from "../api/common/error/RestError"
import {load, serviceRequestVoid, update} from "../api/main/Entity"
import {assertMainOrNode, isAdminClient, isApp, isDesktop, LOGIN_TITLE, Mode} from "../api/common/Env"
import {CloseEventBusOption, Const} from "../api/common/TutanotaConstants"
import {CustomerPropertiesTypeRef} from "../api/entities/sys/CustomerProperties"
import {neverNull, noOp} from "../api/common/utils/Utils"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {lang} from "../misc/LanguageViewModel"
import {windowFacade} from "../misc/WindowFacade"
import {logins} from "../api/main/LoginController"
import type {LoginView} from "./LoginView"
import {deviceConfig} from "../misc/DeviceConfig"
import {client} from "../misc/ClientDetector"
import {secondFactorHandler} from "../misc/SecondFactorHandler"
import {showProgressDialog} from "../gui/ProgressDialog"
import {themeId} from "../gui/theme"
import {CancelledError} from "../api/common/error/CancelledError"
import {notifications} from "../gui/Notifications"
import {isMailAddress} from "../misc/FormatValidator"
import {createReceiveInfoServiceData} from "../api/entities/tutanota/ReceiveInfoServiceData"
import {HttpMethod} from "../api/common/EntityFunctions"
import {TutanotaService} from "../api/entities/tutanota/Services"
import {locator} from "../api/main/MainLocator"
import {checkApprovalStatus, getLoginErrorMessage} from "../misc/LoginUtils"
import {getHourCycle} from "../misc/Formatter"
import * as notificationOverlay from "../gui/base/NotificationOverlay"
import {ButtonType} from "../gui/base/ButtonN"
import {isNotificationCurrentlyActive, loadOutOfOfficeNotification} from "../api/main/OutOfOfficeNotificationUtils"
import type {OutOfOfficeNotification} from "../api/entities/tutanota/OutOfOfficeNotification"
import {showMoreStorageNeededOrderDialog} from "../misc/SubscriptionDialogs"

assertMainOrNode()

export interface ILoginViewController {
	formLogin(): void;

	autologin(credentials: Credentials): void;

	deleteCredentialsNotLoggedIn(credentials: Credentials): Promise<void>;

	migrateDeviceConfig(oldCredentials: Object[]): Promise<void>;

	loadSignupWizard(): Promise<{+show: Function}>;
}

export class LoginViewController implements ILoginViewController {
	view: LoginView;
	_loginPromise: Promise<void>;

	constructor(view: LoginView) {
		this.view = view;
		this._loginPromise = Promise.resolve()

		if (isApp()) {
			worker.initialized.then(() => {

				themeId.map((theme) => {
					import("../native/main/SystemApp").then(({changeColorTheme}) => changeColorTheme(theme))
				})
			})
		}
	}

	autologin(credentials: Credentials): void {
		if (this._loginPromise.isPending()) return
		this.view.invalidCredentials = false
		this.view.accessExpired = false
		this._loginPromise = showProgressDialog("login_msg", worker.initialized.then(() => {
			return this._handleSession(logins.resumeSession(credentials), () => {
				this.view._showLoginForm(credentials.mailAddress)
			})
		}))
	}


	migrateDeviceConfig(oldCredentials: Object[]): Promise<void> {
		return worker.initialized.then(() => Promise.each(oldCredentials, c => {
			return worker.decryptUserPassword(c.userId, c.deviceToken, c.encryptedPassword)
			             .then(userPw => {
				             if (isMailAddress(c.mailAddress, true)) { // do not migrate credentials of external users
					             return logins.createSession(c.mailAddress, userPw, client.getIdentifier(), true, false)
					                          .then(newCredentials => {
						                          deviceConfig.set(newCredentials)
					                          })
					                          .finally(() => logins.logout(false))
				             }
			             })
			             .catch(ignored => {
				             console.log(ignored)
				             // prevent reloading the page by ErrorHandler
			             })
		})).return()
	}

	formLogin(): void {
		if (this._loginPromise.isPending()) return
		let mailAddress = this.view.mailAddress()
		let pw = this.view.password()
		if (mailAddress === "" || pw === "") {
			this.view.helpText = lang.get('loginFailed_msg')
		} else {
			this.view.helpText = lang.get('login_msg')
			this.view.invalidCredentials = false
			this.view.accessExpired = false
			let persistentSession = this.view.savePassword()
			this._loginPromise = logins.createSession(mailAddress, pw, client.getIdentifier(), persistentSession, true)
			                           .then(newCredentials => {
				                           let storedCredentials = deviceConfig.get(mailAddress)
				                           if (persistentSession) {
					                           deviceConfig.set(newCredentials)
				                           }
				                           if (storedCredentials) {
					                           return worker.deleteSession(storedCredentials.accessToken)
					                                        .then(() => {
						                                        if (!persistentSession) {
							                                        deviceConfig.delete(mailAddress)
						                                        }
					                                        })
					                                        .catch(NotFoundError, e => console.log("session already deleted"))
				                           }
			                           }).finally(() => secondFactorHandler.closeWaitingForSecondFactorDialog())
			this._handleSession(showProgressDialog("login_msg", this._loginPromise), () => {
			})
		}
	}


	recoverLogin(emailAddress: string, recoverCode: string, newPassword: string): Promise<void> {
		return worker.recoverLogin(emailAddress, recoverCode, newPassword, client.getIdentifier())
	}

	resetSecondFactors(mailAddress: string, password: string, recoverCode: string): Promise<void> {
		return worker.resetSecondFactors(mailAddress, password, recoverCode)
	}

	_handleSession(login: Promise<void>, errorAction: () => void): Promise<void> {
		return login.then(() => this._enforcePasswordChange())
		            .then(() => logins.loadCustomizations())
		            .then(() => this._postLoginActions())
		            .then(() => {
			            m.route.set(this.view._requestedPath)
			            this.view.helpText = lang.get('emptyString_msg')
			            m.redraw()
		            })
		            .catch(e => {
			            this.view.helpText = lang.get(getLoginErrorMessage(e, false))
			            this.view.invalidCredentials = e instanceof BadRequestError || e instanceof NotAuthenticatedError
			            this.view.accessExpired = e instanceof AccessExpiredError

			            m.redraw()

			            // any other kind of error we forward on to the global error handler
			            if (e instanceof BadRequestError
				            || e instanceof NotAuthenticatedError
				            || e instanceof AccessExpiredError
				            || e instanceof AccessBlockedError
				            || e instanceof AccessDeactivatedError
				            || e instanceof TooManyRequestsError
				            || e instanceof CancelledError) {
				            return errorAction()
			            } else {
				            throw e
			            }
		            })

	}

	_enforcePasswordChange(): void {
		if (logins.getUserController().user.requirePasswordUpdate) {
			import("../settings/PasswordForm").then(({PasswordForm}) => {
				return PasswordForm.showChangeOwnPasswordDialog(false)
			})
		}
	}

	_postLoginActions() {
		notifications.requestPermission()
		// only show "Tutanota" after login if there is no custom title set
		let postLoginTitle = (document.title === LOGIN_TITLE) ? "Tutanota" : document.title
		document.title = neverNull(logins.getUserController().userGroupInfo.mailAddress) + " - " + postLoginTitle

		windowFacade.addOnlineListener(() => {
			console.log(new Date().toISOString(), "online - try reconnect")
			// When we try to connect after receiving online event it might not succeed so we delay reconnect attempt by 2s
			worker.tryReconnectEventBus(true, true, 2000)
		})
		windowFacade.addOfflineListener(() => {
			console.log(new Date().toISOString(), "offline - pause event bus")
			worker.closeEventBus(CloseEventBusOption.Pause)
		})
		if ((env.mode === Mode.App || env.mode === Mode.Desktop) && !isAdminClient()) {
			import("../native/main/PushServiceApp").then(({pushServiceApp}) => pushServiceApp.register())
		}

		// do not return the promise. loading of dialogs can be executed in parallel
		checkApprovalStatus(true)
			.then(() => {
				return this._showUpgradeReminder()
			})
			.then(() => {
				return this._checkStorageWarningLimit()
			})
			.then(() => {
				secondFactorHandler.setupAcceptOtherClientLoginListener()
			})
			.then(() => {
				if (!isAdminClient()) {
					return locator.mailModel.init()
				}
			})
			.then(() => logins.loginComplete()).then(() => {
			if (isApp() || isDesktop()) {
				// don't wait for it, just invoke
				import("../native/common/FileApp")
					.then(({fileApp}) => fileApp.clearFileData())
					.catch((e) => console.log("Failed to clean file data", e))
			}
		})
			.then(() => {
				if (logins.isGlobalAdminUserLoggedIn() && !isAdminClient()) {
					let receiveInfoData = createReceiveInfoServiceData()
					receiveInfoData.language = lang.code
					return serviceRequestVoid(TutanotaService.ReceiveInfoService, HttpMethod.POST, receiveInfoData)
				}
			})
			.then(() => {
				if (!isAdminClient()) {
					return locator.calendarModel.init()
				}
			})
			.then(() => {
				lang.updateFormats({
					hourCycle: getHourCycle(logins.getUserController().userSettingsGroupRoot)
				})
			})
			.then(() => {
				if (!isAdminClient()) {
					return this._remindActiveOutOfOfficeNotification()
				}
			})
	}

	_deactivateOutOfOfficeNotification(notification: OutOfOfficeNotification): Promise<void> {
		notification.enabled = false
		return locator.entityClient.update(notification)
	}

	_remindActiveOutOfOfficeNotification(): Promise<void> {
		return loadOutOfOfficeNotification().then((notification) => {
			if (notification && isNotificationCurrentlyActive(notification, new Date())) {
				const notificationMessage: Component = {
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

	_showUpgradeReminder(): Promise<void> {
		if (logins.getUserController().isFreeAccount() && env.mode !== Mode.App) {
			return logins.getUserController().loadCustomer().then(customer => {
				return load(CustomerPropertiesTypeRef, neverNull(customer.properties)).then(properties => {
					return load(CustomerInfoTypeRef, customer.customerInfo).then(customerInfo => {
						if (properties.lastUpgradeReminder == null && (customerInfo.creationTime.getTime()
							+ Const.UPGRADE_REMINDER_INTERVAL) < new Date().getTime()) {
							let message = lang.get("premiumOffer_msg")
							let title = lang.get("upgradeReminderTitle_msg")
							return Dialog.reminder(title, message, lang.getInfoLink("premiumProBusiness_link")).then(confirm => {
								if (confirm) {
									import("../subscription/UpgradeSubscriptionWizard").then((wizard) => wizard.showUpgradeWizard())
								}
							}).then(function () {
								properties.lastUpgradeReminder = new Date()
								update(properties).catch(LockedError, noOp)
							})
						}
					})
				})
			});
		} else {
			return Promise.resolve();
		}

	}

	_checkStorageWarningLimit(): Promise<void> {
		if (logins.getUserController().isOutlookAccount() || !logins.getUserController().isGlobalAdmin()) {
			return Promise.resolve()
		}
		return worker.readUsedCustomerStorage().then(usedStorage => {
			if (Number(usedStorage) > (Const.MEMORY_GB_FACTOR * Const.MEMORY_WARNING_FACTOR)) {
				return worker.readAvailableCustomerStorage().then(availableStorage => {
					if (Number(usedStorage) > (Number(availableStorage) * Const.MEMORY_WARNING_FACTOR)) {
						showMoreStorageNeededOrderDialog(logins, "insufficientStorageWarning_msg")
					}
				})
			}
		})
	}

	deleteCredentialsNotLoggedIn(credentials: Credentials): Promise<void> {
		return worker.initialized.then(() => {
			worker.deleteSession(credentials.accessToken)
			      .then(() => {
				      // not authenticated error is caught in worker
				      deviceConfig.delete(credentials.mailAddress)
				      this.view.setKnownCredentials(deviceConfig.getAllInternal());
			      })
		})
	}

	loadSignupWizard(): Promise<{+show: () => any}> {
		return worker.initialized
		             .then(() => import("../subscription/UpgradeSubscriptionWizard")
			             .then((wizard) => wizard.loadSignupWizard()))
	}
}
