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
	NotAuthenticatedError,
	NotFoundError,
	TooManyRequestsError
} from "../api/common/error/RestError"
import {base64ToUint8Array, base64UrlToBase64} from "../api/common/utils/Encoding"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {keyManager} from "../misc/KeyManager"
import {client} from "../misc/ClientDetector"
import {windowFacade} from "../misc/WindowFacade"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {CloseEventBusOption, Keys} from "../api/common/TutanotaConstants"
import {progressIcon} from "../gui/base/Icon"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {TextFieldN, Type as TextFieldType} from "../gui/base/TextFieldN"
import {CheckboxN} from "../gui/base/CheckboxN"
import {CancelledError} from "../api/common/error/CancelledError"
import {logins} from "../api/main/LoginController"
import {MessageBoxN} from "../gui/base/MessageBoxN"
import {assertMainOrNode, LOGIN_TITLE} from "../api/common/Env"
import {renderPrivacyAndImprintLinks} from "./LoginView"
import {header} from "../gui/base/Header"
import {GENERATED_MIN_ID} from "../api/common/utils/EntityUtils";
import {getLoginErrorMessage} from "../misc/LoginUtils"
import {ofClass} from "../api/common/utils/PromiseUtils"

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
	_symKeyForPasswordTransmission: ?Aes128Key;
	_autologinInProgress: boolean;

	constructor() {
		this._autologinInProgress = false
		this._errorMessageId = null
		this._helpText = 'emptyString_msg'

		this._password = stream("")
		this._savePassword = stream(false)
		this._symKeyForPasswordTransmission = null


		this._setupShortcuts()

		this.view = (): VirtualElement => {
			return m(".main-view", [
				m(header),
				m(".flex-center.scroll.pt-responsive", m(".flex-grow-shrink-auto.max-width-s.pt.pb.plr-l", this._getView()))
			])
		}
	}

	_getView(): Children {
		if (this._autologinInProgress) {
			return m("p.center", progressIcon())
		} else if (this._errorMessageId) {
			return m("p.center", m(MessageBoxN, {}, this._errorMessageId && lang.get(this._errorMessageId)))
		} else {
			return [
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

			let credentials = deviceConfig.get(this._userId)
			if (credentials && args.noAutoLogin !== true) {
				this._autologin(credentials)
			} else {
				m.redraw()
			}
		} catch (e) {
			this._errorMessageId = "invalidLink_msg"
			m.redraw()
		}
	}

	_autologin(credentials: Credentials): void {
		this._autologinInProgress = true
		showProgressDialog("login_msg", worker.initialized.then(() => {
			return this._handleSession(logins.resumeSession(credentials, this._salt), () => {
				this._autologinInProgress = false
				m.redraw()
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
				                                 // For external users userId is used instead of email address
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
					                                              .catch(ofClass(NotFoundError, e => console.log("session already deleted")))
				                                 }
			                                 })
			this._handleSession(showProgressDialog("login_msg", createSessionPromise), () => {
				// don't do anything additionally on errors
			})
		}
	}

	_handleSession(login: Promise<void>, errorAction: () => void): Promise<void> {
		return login.then(() => this._postLoginActions())
		            .then(() => {
			            m.route.set(`/mail${location.hash}`)
			            this._helpText = 'emptyString_msg'
		            })
		            .catch(e => {
			            const messageId = getLoginErrorMessage(e, true)
			            if (e instanceof AccessExpiredError) {
				            this._errorMessageId = messageId
			            } else {
				            this._helpText = messageId
			            }
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
}
