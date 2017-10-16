// @flow
import m from "mithril"
import {TextField, Type} from "../gui/base/TextField"
import {Checkbox} from "../gui/base/Checkbox"
import {Button, ButtonType} from "../gui/base/Button"
import {worker} from "../api/main/WorkerClient"
import {deviceConfig} from "../misc/DeviceConfig"
import {
	NotAuthenticatedError,
	ConnectionError,
	AccessBlockedError,
	AccessDeactivatedError
} from "../api/common/error/RestError"
import {createCustomerProperties} from "../api/entities/sys/CustomerProperties"
import {GENERATED_MIN_ID, HttpMethod} from "../api/common/EntityFunctions"
import {base64UrlToBase64, base64ToUint8Array} from "../api/common/utils/Encoding"
import {ExternalPropertiesReturnTypeRef} from "../api/entities/sys/ExternalPropertiesReturn"
import {SysService} from "../api/entities/sys/Services"
import {serviceRequest} from "../api/main/Entity"
import {lang} from "../misc/LanguageViewModel"
import {keyManager, Keys} from "../misc/KeyManager"
import {client} from "../misc/ClientDetector"
import {windowFacade} from "../misc/WindowFacade"
import {showProgressDialog} from "../gui/base/ProgressDialog"

export class ExternalLoginView {

	mailAddress: TextField;
	password: TextField;
	helpText: string;
	savePassword: Checkbox;
	_requestedPath: string; // redirect to this path after successful login (defined in app.js)
	_errorMessageId: ?string;
	_userId: Id;
	_salt: Uint8Array;
	_saltHash: Base64Url;
	view: Function;
	_visibleCredentials: Credentials[];
	_isDeleteCredentials: boolean;
	_id: string;
	oncreate: Function;
	onbeforeremove: Function;

	constructor() {
		this._errorMessageId = null
		this.helpText = lang.get('emptyString_msg')
		this.password = new TextField("password_label", () => lang.get("enterPresharedPassword_msg"))
			.setType(Type.Password)
		this.savePassword = new Checkbox("storePassword_action", () => lang.get("onlyPrivateComputer_msg"))

		let loginButton = new Button('showMail_action', () => this._formLogin()).setType(ButtonType.Login)

		this._setupShortcuts()

		this.view = (): VirtualElement => {
			return m(".main-view.flex-center.scroll.pt-responsive", [
				m(".flex-grow-shrink-auto.max-width-s.pt.pb.plr-l", !this._errorMessageId ? [
						m(this.password),
						m(this.savePassword),
						m(".pt", m(loginButton)),
						m("p.center.statusTextColor", m("small", this.helpText))
					] : m("p.center", lang.get(this._errorMessageId)))
			])
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
		this.onbeforeremove = () => keyManager.unregisterShortcuts(shortcuts)
	}

	updateUrl(args: Object) {
		if (args.requestedPath) {
			this._requestedPath = args.requestedPath
		} else {
			this._requestedPath = '/mail'
		}

		let userIdLength = GENERATED_MIN_ID.length
		let id = decodeURIComponent(location.hash).substring(6) // cutoff #mail/ from #mail/KduzrgF----0S3BTO2gypfDMketWB_PbqQ
		this._userId = id.substring(0, userIdLength)
		this._salt = base64ToUint8Array(base64UrlToBase64(id.substring(userIdLength)))
		//this._saltHash = base64ToBase64Url(uint8ArrayToBase64(hash(this._salt)))

		let credentials = deviceConfig.get(this._userId)
		if (credentials) {
			this._autologin(credentials)
		}
	}

	_showLoginForm(mailAddress: string) {
		this._visibleCredentials = [];
		m.redraw()
	}

	_autologin(credentials: Credentials): void {
		showProgressDialog("login_msg", worker.initialized.then(() => {
			return this._handleSession(worker.resumeSession(credentials, this._salt), () => {
				this._showLoginForm(credentials.mailAddress)
			})
		}))
	}

	_formLogin() {
		let pw = this.password.value()
		if (pw == "") {
			this.helpText = lang.get('loginFailed_msg')
		} else {
			this.helpText = lang.get('login_msg')
			let clientIdentifier = client.browser + " " + client.device
			let createSessionPromise = Promise.resolve()
			// TODO: put auth headers into body of password channel resource
			// serviceRequest(TutanotaService.PasswordChannelResource, HttpMethod.GET, null, PasswordChannelReturnTypeRef)
			// .catch(NotAuthenticatedError, e => {
			// 	this.helpText = lang.get('invalidLink_msg')
			// })
			// .catch(BadRequestError, e => {
			// 	this.helpText = lang.get('invalidLink_msg')
			// }).catch(ConnectionError, e => {
			// 	this.helpText = lang.get('emptyString_msg')
			// 	throw e;
				.then(passwordChannels => {
					// TODO add phone number handling
					return worker.createExternalSession(this._userId, pw, this._salt, clientIdentifier, this.savePassword.checked())
				}).then(newCredentials => {
					this.password.value("")
					let storedCredentials = deviceConfig.get(this._userId)
					if (newCredentials) {
						deviceConfig.set(newCredentials)
					}
					if (storedCredentials) {
						return worker.deleteSession(storedCredentials.accessToken)
							.then(() => {
								if (!newCredentials) {
									deviceConfig.delete(this._userId)
								}
							})
					}
				})
			this._handleSession(showProgressDialog("login_msg", createSessionPromise), () => {
			})
		}
	}

	_handleSession(login: Promise<void>, errorAction: handler<void>): Promise<void> {
		return login.then(() => this._postLoginActions())
			.then(() => {
				m.route.set(`/mail${location.hash}`)
				this.helpText = lang.get('emptyString_msg')
				m.redraw()
			})
			.catch(AccessBlockedError, e => {
				this.helpText = lang.get('loginFailedOften_msg')
				m.redraw()
				return errorAction()
			})
			.catch(NotAuthenticatedError, e => {
				this.helpText = lang.get('invalidPassword_msg')
				m.redraw()
				return errorAction()
			})
			.catch(AccessDeactivatedError, e => {
				this.helpText = lang.get('loginFailed_msg')
				m.redraw()
				return errorAction()
			})
			.catch(ConnectionError, e => {
				this.helpText = lang.get('emptyString_msg')
				m.redraw()
				throw e;
			})
	}

	_postLoginActions() {
		windowFacade.addOnlineListener(() => {
			console.log("online")
			worker.tryReconnectEventBus()
		})
		windowFacade.addOfflineListener(() => {
			console.log("offline")
		})
		return serviceRequest(SysService.ExternalPropertiesService, HttpMethod.GET, null, ExternalPropertiesReturnTypeRef).then(data => {
			let props = createCustomerProperties()
			//TODO: set welcome message
		})

	}
}
