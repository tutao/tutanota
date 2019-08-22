// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {worker} from "../api/main/WorkerClient"
import {deviceConfig} from "../misc/DeviceConfig"
import {
	AccessBlockedError,
	AccessDeactivatedError,
	AccessExpiredError,
	BadRequestError,
	ConnectionError,
	InternalServerError,
	NotAuthenticatedError,
	NotFoundError,
	TooManyRequestsError
} from "../api/common/error/RestError"
import {GENERATED_MIN_ID} from "../api/common/EntityFunctions"
import {base64ToUint8Array, base64UrlToBase64} from "../api/common/utils/Encoding"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {keyManager} from "../misc/KeyManager"
import {client} from "../misc/ClientDetector"
import {windowFacade} from "../misc/WindowFacade"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {CloseEventBusOption, Keys} from "../api/common/TutanotaConstants"
import {progressIcon} from "../gui/base/Icon"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {TextFieldN, Type as TextFieldType} from "../gui/base/TextFieldN"
import {CheckboxN} from "../gui/base/CheckboxN"
import {CancelledError} from "../api/common/error/CancelledError"
import {logins} from "../api/main/LoginController"
import {MessageBoxN} from "../gui/base/MessageBoxN"
import {Dialog} from "../gui/base/Dialog"
import {assertMainOrNode, LOGIN_TITLE} from "../api/Env"
import {renderPrivacyAndImprintLinks} from "./LoginView"
import {header} from "../gui/base/Header"
import type {PasswordChannelPhoneNumber} from "../api/entities/tutanota/PasswordChannelPhoneNumber"
import type {PhoneNumber} from "../api/entities/sys/PhoneNumber"

assertMainOrNode()

export class ExternalLoginView {

	_password: Stream<string>;
	_savePassword: Stream<boolean>;
	_helpText: TranslationKey;
	_errorMessageId: ?TranslationKey;
	_userId: Id;
	_salt: Uint8Array;
	view: Function;
	oncreate: Function;
	onremove: Function;
	_loading: ?Promise<void>;
	_phoneNumbers: PasswordChannelPhoneNumber[];
	_symKeyForPasswordTransmission: ?Aes128Key;
	_sendSmsAllowed: boolean;
	_autologinInProgress: boolean;

	constructor() {
		this._loading = null
		this._autologinInProgress = false
		this._errorMessageId = null
		this._helpText = 'emptyString_msg'

		this._password = stream("")
		this._savePassword = stream(false)
		this._phoneNumbers = []
		this._symKeyForPasswordTransmission = null
		this._sendSmsAllowed = false


		this._setupShortcuts()

		this.view = (): VirtualElement => {
			return m(".main-view", [
				m(header),
				m(".flex-center.scroll.pt-responsive", m(".flex-grow-shrink-auto.max-width-s.pt.pb.plr-l", this._getView()))
			])
		}
	}

	_getView(): Children {
		if (!this._loading || this._loading.isPending() || this._autologinInProgress) {
			return m("p.center", progressIcon())
		} else if (this._errorMessageId) {
			return m("p.center", m(MessageBoxN, {}, this._errorMessageId && lang.get(this._errorMessageId)))
		} else {
			return [
				this._phoneNumbers.length > 0 ? [
					m("small", lang.get(this._phoneNumbers.length == 1 ? "clickNumber_msg" : "chooseNumber_msg")),
					m(".mt", this._phoneNumbers.map((n: PhoneNumber) => m(ButtonN, {
						label: () => n.number,
						type: ButtonType.Login,
						click: () => this._sendSms(n._id)
					})))
				] : null,
				m(TextFieldN, {
					type: TextFieldType.Password,
					label: "password_label",
					helpLabel: () => lang.get("enterPresharedPassword_msg"),
					value: this._password
				}),
				m(CheckboxN, {
					label: () => lang.get("storePassword_action"),
					helpLabel: () => lang.get("onlyPrivateComputer_msg"),
					checked: this._savePassword
				}),
				m(".pt", m(ButtonN, {label: 'showMail_action', click: () => this._formLogin(), type: ButtonType.Login})),
				m("p.center.statusTextColor", m("small", lang.get(this._helpText))),
				renderPrivacyAndImprintLinks()
			]
		}
	}

	_setupShortcuts() {
		let shortcuts = [
			{
				key: Keys.RETURN,
				exec: () => this._formLogin(),
				help: "login_label"
			},
		]

		this.oncreate = () => keyManager.registerShortcuts(shortcuts)
		this.onremove = () => {
			this._password("")
			keyManager.unregisterShortcuts(shortcuts)
		}
	}

	updateUrl(args: Object) {
		let userIdLength = GENERATED_MIN_ID.length
		try {
			let id = decodeURIComponent(location.hash).substring(6) // cutoff #mail/ from #mail/KduzrgF----0S3BTO2gypfDMketWB_PbqQ
			this._userId = id.substring(0, userIdLength)
			this._salt = base64ToUint8Array(base64UrlToBase64(id.substring(userIdLength)))

			this._loading = this._loadAndSetPhoneNumbers()
			this._loading.then(() => {
				let credentials = deviceConfig.get(this._userId)
				if (credentials && args.noAutoLogin !== true) {
					this._autologin(credentials)
				} else {
					m.redraw()
				}
			})
		} catch (e) {
			this._errorMessageId = "invalidLink_msg"
			this._loading = Promise.reject()
			m.redraw()
		}
	}

	_autologin(credentials: Credentials): void {
		this._autologinInProgress = true
		showProgressDialog("login_msg", worker.initialized.then(() => {
			return this._handleSession(logins.resumeSession(credentials, this._salt), () => {
				this._autologinInProgress = false
			})
		}))
	}

	_formLogin() {
		let pw = this._password()
		if (pw === "") {
			this._helpText = 'loginFailed_msg'
		} else {
			this._helpText = 'login_msg'
			let clientIdentifier = client.browser + " " + client.device
			let persistentSession = this._savePassword()
			let createSessionPromise = logins.createExternalSession(this._userId, pw, this._salt, clientIdentifier, this._savePassword())
			                                 .then(newCredentials => {
				                                 this._password("")
				                                 let storedCredentials = deviceConfig.get(this._userId)
				                                 if (persistentSession) {
					                                 deviceConfig.set(newCredentials)
				                                 }
				                                 if (storedCredentials) { // delete persistent session (saved in deviceConfig) if a new session is created
					                                 return worker.deleteSession(storedCredentials.accessToken)
					                                              .then(() => {
						                                              if (!persistentSession) {
							                                              deviceConfig.delete(this._userId)
						                                              }
					                                              })
					                                              .catch(NotFoundError, e => console.log("session already deleted"))
				                                 }
			                                 })
			this._handleSession(showProgressDialog("login_msg", createSessionPromise), () => {
				// don't do anything additionally on errors
			})
		}
	}

	_handleSession(login: Promise<void>, errorAction: handler<void>): Promise<void> {
		return login.then(() => this._postLoginActions())
		            .then(() => {
			            m.route.set(`/mail${location.hash}`)
			            this._helpText = 'emptyString_msg'
		            })
		            .catch(AccessExpiredError, e => {
			            this._errorMessageId = 'expiredLink_msg'
			            return errorAction()
		            })
		            .catch(AccessBlockedError, e => {
			            this._helpText = 'loginFailedOften_msg'
			            return errorAction()
		            })
		            .catch(NotAuthenticatedError, e => {
			            this._helpText = 'invalidPassword_msg'
			            return errorAction()
		            })
		            .catch(AccessDeactivatedError, e => {
			            this._helpText = 'loginFailed_msg'
			            return errorAction()
		            })
		            .catch(TooManyRequestsError, e => {
			            this._helpText = 'tooManyAttempts_msg'
			            return errorAction()
		            })
		            .catch(CancelledError, () => {
			            this._helpText = 'emptyString_msg'
			            return errorAction()
		            })
		            .catch(ConnectionError, e => {
			            if (client.isIE()) {
				            // IE says it's error code 0 fore some reason
				            this._helpText = 'loginFailed_msg'
				            m.redraw()
				            return errorAction()
			            } else {
				            this._helpText = 'emptyString_msg'
				            throw e;
			            }
		            }).finally(() => m.redraw())
	}

	_postLoginActions() {
		// only show "Tutanota" after login if there is no custom title set
		if (document.title === LOGIN_TITLE) {
			document.title = "Tutanota"
		}
		windowFacade.addOnlineListener(() => {
			console.log("online")
			worker.tryReconnectEventBus(true, true, 2000)
		})
		windowFacade.addOfflineListener(() => {
			console.log("offline")
			worker.closeEventBus(CloseEventBusOption.Pause)
		})
		logins.loginComplete()
	}

	_loadAndSetPhoneNumbers(): Promise<void> {
		return worker.loadExternalPasswordChannels(this._userId, this._salt)
		             .then(passwordChannels => {
			             this._phoneNumbers = passwordChannels.phoneNumberChannels
			             this._sendSmsAllowed = true
		             })
		             .catch(AccessExpiredError, e => {
			             this._errorMessageId = 'expiredLink_msg'
		             })
		             .catch(NotAuthenticatedError, e => {
			             this._errorMessageId = 'invalidLink_msg'
		             })
		             .catch(BadRequestError, e => {
			             this._errorMessageId = 'invalidLink_msg'
		             })
		             .catch(ConnectionError, e => {
			             if (client.isIE()) {
				             // IE says it's error code 0 fore some reason
				             this._helpText = 'loginFailed_msg'
				             m.redraw()
			             } else {
				             this._helpText = 'emptyString_msg'
				             throw e;
			             }
		             }).finally(() => m.redraw())
	}

	_sendSms(phoneNumberId: Id): Promise<void> {
		if (!this._sendSmsAllowed) {
			return Dialog.error(this._helpText)
		}
		this._helpText = "sendingSms_msg"
		this._sendSmsAllowed = false
		m.redraw()
		return worker.sendExternalPasswordSms(this._userId, this._salt, phoneNumberId, lang.code, this._symKeyForPasswordTransmission)
		             .then(result => {
			             this._symKeyForPasswordTransmission = result.symKeyForPasswordTransmission
			             this._helpText = "smsSent_msg"
			             setTimeout(() => {
				             this._sendSmsAllowed = true
				             this._helpText = "smsResent_msg"
				             m.redraw()
			             }, 60000)
		             })
		             .catch(TooManyRequestsError, e => {
			             this._helpText = "smsSentOften_msg"
		             })
		             .catch(AccessExpiredError, e => {
			             this._errorMessageId = "expiredLink_msg"
		             })
		             .catch(InternalServerError, e => {
			             this._helpText = "smsError_msg"
		             })
		             .finally(() => m.redraw())
	}

}
