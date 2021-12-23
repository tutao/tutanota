// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {
	AccessBlockedError,
	AccessDeactivatedError,
	AccessExpiredError,
	BadRequestError,
	NotAuthenticatedError,
	TooManyRequestsError
} from "../api/common/error/RestError"
import {base64ToUint8Array, base64UrlToBase64} from "@tutao/tutanota-utils"
import type {TranslationText} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import {keyManager} from "../misc/KeyManager"
import {client} from "../misc/ClientDetector"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {Keys} from "../api/common/TutanotaConstants"
import {progressIcon} from "../gui/base/Icon"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {TextFieldN, Type as TextFieldType} from "../gui/base/TextFieldN"
import {CheckboxN} from "../gui/base/CheckboxN"
import {CancelledError} from "../api/common/error/CancelledError"
import {logins, SessionType} from "../api/main/LoginController"
import {MessageBoxN} from "../gui/base/MessageBoxN"
import {renderPrivacyAndImprintLinks} from "./LoginView"
import {header} from "../gui/base/Header"
import {GENERATED_MIN_ID} from "../api/common/utils/EntityUtils";
import {getLoginErrorMessage} from "../misc/LoginUtils"
import {locator} from "../api/main/MainLocator"
import type {ICredentialsProvider} from "../misc/credentials/CredentialsProvider"
import {assertMainOrNode} from "../api/common/Env"
import type {Credentials} from "../misc/credentials/Credentials"

assertMainOrNode()

export class ExternalLoginView {
	+_credentialsProvider: ICredentialsProvider
	_password: Stream<string>;
	_savePassword: Stream<boolean>;
	_helpText: TranslationText;
	_errorMessageId: ?TranslationText;
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

		this._credentialsProvider = locator.credentialsProvider

		this._setupShortcuts()

		this.view = (): Children => {
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
			return m("p.center", m(MessageBoxN, {}, this._errorMessageId && lang.getMaybeLazy(this._errorMessageId)))
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
				m("p.center.statusTextColor", m("small", lang.getMaybeLazy(this._helpText))),
				renderPrivacyAndImprintLinks()
			]
		}
	}

	_setupShortcuts() {
		let shortcuts = [
			{
				key: Keys.RETURN,
				exec: () => {
					this._formLogin()
				},
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

			this._credentialsProvider.getCredentialsByUserId(this._userId).then((credentials) => {
				if (credentials && args.noAutoLogin !== true) {
					this._autologin(credentials)
				} else {
					m.redraw()
				}
			})
		} catch (e) {
			this._errorMessageId = "invalidLink_msg"
			m.redraw()
		}
	}

	_autologin(credentials: Credentials): void {
		this._autologinInProgress = true
		showProgressDialog("login_msg",
			this._handleSession(logins.resumeSession(credentials, this._salt), () => {
				this._autologinInProgress = false
				m.redraw()
			})
		)
	}

	async _formLogin() {
		if (this._password() === "") {
			this._helpText = 'loginFailed_msg'
		} else {
			this._helpText = 'login_msg'

			const createSessionPromise = this._doFormLogin()

			this._handleSession(showProgressDialog("login_msg", createSessionPromise), () => {
				// don't do anything additionally on errors
			})
		}
	}

	async _doFormLogin() {
		const pw = this._password()
		let clientIdentifier = client.browser + " " + client.device
		let persistentSession = this._savePassword()
		const sessionType = persistentSession ? SessionType.Persistent : SessionType.Login
		const newCredentials = await logins.createExternalSession(this._userId, pw, this._salt, clientIdentifier, sessionType)
		this._password("")
		let storedCredentials = await this._credentialsProvider.getCredentialsByUserId(this._userId)
		// For external users userId is used instead of email address
		if (persistentSession) {
			await this._credentialsProvider.store(newCredentials)
		}
		if (storedCredentials) { // delete persistent session if a new session is created
			await logins.deleteOldSession(storedCredentials)
			if (!persistentSession) {
				await this._credentialsProvider.deleteByUserId(this._userId)
			}
		}
	}

	_handleSession(login: Promise<void>, errorAction: () => void): Promise<void> {
		return login
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
}
