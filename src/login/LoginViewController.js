//@flow
import m from "mithril"
import {worker} from "../api/main/WorkerClient"
import {Dialog} from "../gui/base/Dialog"
import {
	NotAuthenticatedError,
	AccessBlockedError,
	AccessDeactivatedError,
	ConnectionError
} from "../api/common/error/RestError"
import {load, update} from "../api/main/Entity"
import {Mode} from "../api/Env"
import {Const} from "../api/common/TutanotaConstants"
import {CustomerPropertiesTypeRef} from "../api/entities/sys/CustomerProperties"
import {neverNull} from "../api/common/utils/Utils"
import {CustomerInfoTypeRef} from "../api/entities/sys/CustomerInfo"
import {lang} from "../misc/LanguageViewModel"
import {checkApprovalStatus} from "../misc/ErrorHandlerImpl"
import {windowFacade} from "../misc/WindowFacade"
import {pushServiceApp} from "../native/PushServiceApp"
import {logins} from "../api/main/LoginController"
import {LoginView} from "./LoginView"
import {PasswordForm} from "../settings/PasswordForm"
import {deviceConfig} from "../misc/DeviceConfig"
import {client} from "../misc/ClientDetector"
import {secondFactorHandler} from "./SecondFactorHandler"

export class LoginViewController {
	view: LoginView;

	constructor(view: LoginView) {
		this.view = view;
	}

	_autologin(credentials: Credentials): void {
		Dialog.progress("login_msg", worker.initialized.then(() => {
			return this._handleSession(worker.resumeSession(credentials), () => {
				this.view._showLoginForm(credentials.mailAddress)
			})
		}))
	}

	_formLogin(): void {
		let mailAddress = this.view.mailAddress.value()
		let pw = this.view.password.value()
		if (mailAddress == "" || pw == "") {
			this.view.helpText = lang.get('loginFailed_msg')
		} else {
			this.view.helpText = lang.get('login_msg')
			let createSessionPromise = worker.createSession(mailAddress, pw, client.getIdentifier(), this.view.savePassword.checked())
				.then(newCredentials => {
					this.view.password.value("")
					let storedCredentials = deviceConfig.get(mailAddress)
					if (newCredentials) {
						deviceConfig.set(newCredentials)
					}
					if (storedCredentials) {
						return worker.deleteSession(storedCredentials.accessToken)
							.then(() => {
								if (!newCredentials) {
									deviceConfig.delete(mailAddress)
								}
							})
					}
				}).finally(() => secondFactorHandler.closeWaitingForSecondFactorDialog())
			this._handleSession(Dialog.progress("login_msg", createSessionPromise), () => {
			})
		}
	}

	_handleSession(login: Promise<void>, errorAction: handler<void>): Promise<void> {
		return login.then(() => this._enforcePasswordChange())
			.then(() => this._postLoginActions())
			.then(() => {
				m.route.set(this.view._requestedPath)
				this.view.helpText = lang.get('emptyString_msg')
			})
			.catch(AccessBlockedError, e => {
				this.view.helpText = lang.get('loginFailedOften_msg')
				return errorAction()
			})
			.catch(NotAuthenticatedError, e => {
				this.view.helpText = lang.get('loginFailed_msg')
				return errorAction()
			})
			.catch(AccessDeactivatedError, e => {
				this.view.helpText = lang.get('loginFailed_msg')
				return errorAction()
			})
			.catch(ConnectionError, e => {
				this.view.helpText = lang.get('emptyString_msg')
				throw e;
			})
	}

	_enforcePasswordChange() {
		if (logins.getUserController().user.requirePasswordUpdate) {
			return PasswordForm.showChangeOwnPasswordDialog(false)
		}
	}

	_postLoginActions() {
		document.title = neverNull(logins.getUserController().userGroupInfo.mailAddress) + " - Tutanota"

		windowFacade.addOnlineListener(() => {
			console.log("online")
			worker.tryReconnectEventBus()
		})
		windowFacade.addOfflineListener(() => {
			console.log("offline")
		})

		if (env.mode == Mode.App) {
			pushServiceApp.register()
		}
		// do not return the promise. loading of dialogs can be executed in parallel
		checkApprovalStatus(true).then(() => {
			return this._showUpgradeReminder()
		}).then(() => {
			return this._checkStorageWarningLimit()
		}).then(() => {
			if (logins.getUserController().isInternalUser()) {
				// run this async
				worker.getContactController().lazyContacts.getAsync()
			}
		}).then(() => {
			secondFactorHandler.setupAcceptOtherClientLoginListener()
		})
	}

	_showUpgradeReminder(): Promise<void> {
		if (logins.getUserController().isFreeAccount() && env.mode != Mode.App) {
			return logins.getUserController().loadCustomer().then(customer => {
				return load(CustomerPropertiesTypeRef, neverNull(customer.properties)).then(properties => {
					return load(CustomerInfoTypeRef, customer.customerInfo).then(customerInfo => {
						if (properties.lastUpgradeReminder == null && (customerInfo.creationTime.getTime() + Const.UPGRADE_REMINDER_INTERVAL) < new Date().getTime()) {
							let message = lang.get("premiumOffer_msg") + " " + lang.get("moreInfo_msg")
							let title = lang.get("upgradeReminderTitle_msg")
							return Dialog.reminder(title, message, "https://tutanota.com/pricing").then(confirm => {
								if (confirm) {
									// TODO: Navigate to premium upgrade
									//tutao.locator.navigator.settings();
									//tutao.locator.settingsViewModel.show(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_PAYMENT);
								}
							}).then(function () {
								properties.lastUpgradeReminder = new Date()
								update(properties)
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
		if (logins.getUserController().isOutlookAccount()) {
			return Promise.resolve();
		}
		if (logins.getUserController().isAdmin()) {
			return worker.readUsedCustomerStorage().then(usedStorage => {
				if (Number(usedStorage) > (Const.MEMORY_GB_FACTOR * Const.MEMORY_WARNING_FACTOR)) {
					return worker.readAvailableCustomerStorage().then(availableStorage => {
						if (Number(usedStorage) > (Number(availableStorage) * Const.MEMORY_WARNING_FACTOR)) {
							return Dialog.error("insufficientStorageWarning_msg").then(() => {
								// TODO naviagate to admin storage
								//tutao.locator.navigator.settings();
								//tutao.locator.settingsViewModel.show(tutao.tutanota.ctrl.SettingsViewModel.DISPLAY_ADMIN_STORAGE);
							})
						}
					})
				}
			})
		} else {
			return Promise.resolve();
		}

	}

	_deleteCredentialsNotLoggedIn(credentials: Credentials): Promise<void> {
		return worker.deleteSession(credentials.accessToken)
			.then(() => {
				// not authenticated error is caught in worker
				deviceConfig.delete(credentials.mailAddress)
				this.view._visibleCredentials = deviceConfig.getAllInternal();
				m.redraw()
			})
	}
}