// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {TextField, Type} from "../gui/base/TextField"
import {Checkbox} from "../gui/base/Checkbox"
import {Button} from "../gui/base/Button"
import {client} from "../misc/ClientDetector"
import {assertMainOrNode, isApp, isDesktop, isTutanotaDomain} from "../api/Env"
import {lang} from "../misc/LanguageViewModel"
import {asyncImport, neverNull} from "../api/common/utils/Utils"
import {deviceConfig} from "../misc/DeviceConfig"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {themeId} from "../gui/theme"
import {keyManager} from "../misc/KeyManager"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {BootstrapFeatureType, Keys} from "../api/common/TutanotaConstants"
import {base64ToUint8Array, base64UrlToBase64, utf8Uint8ArrayToString} from "../api/common/utils/Encoding"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {windowFacade} from "../misc/WindowFacade"
import {DeviceType} from "../misc/ClientConstants"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {show} from "./RecoverLoginDialog"
import {header} from "../gui/base/Header"

assertMainOrNode()

export class LoginView {

	targetPath: string;
	mailAddress: TextField;
	password: TextField;
	helpText: string;
	invalidCredentials: boolean;
	savePassword: Checkbox;
	loginButton: Button;
	appButtons: Button[];
	_requestedPath: string; // redirect to this path after successful login (defined in app.js)
	view: Function;
	_knownCredentials: Credentials[];
	_showingKnownCredentials: boolean;
	_isDeleteCredentials: boolean;
	_viewController: Promise<ILoginViewController>;
	oncreate: Function;
	onremove: Function;
	permitAutoLogin: boolean;
	_showingSignup: boolean;
	_formsUpdateStream: ?Stream<*>;

	constructor() {
		this.targetPath = '/mail'
		this._requestedPath = this.targetPath

		this.mailAddress = new TextField('mailAddress_label')
			.setType(Type.Email)
		this.mailAddress.autocomplete = "username"
		this.helpText = lang.get('emptyString_msg')
		this.password = new TextField("password_label")
			.setType(Type.Password)
		this.password.autocomplete = "password"
		this.savePassword = new Checkbox(() => lang.get("storePassword_action"), () => lang.get("onlyPrivateComputer_msg"))
		if (!client.localStorage()) {
			this.savePassword.setDisabled("functionNotSupported_msg")
		}

		this.appButtons = [
			new Button('appInfoAndroidImageAlt_alt',
				() => this.openUrl("https://play.google.com/store/apps/details?id=de.tutao.tutanota"),
				() => BootIcons.Android)
				.setIsVisibleHandler(() => client.isDesktopDevice() || client.device === DeviceType.ANDROID)
				.setType(ButtonType.ActionLarge),

			new Button('appInfoIosImageAlt_alt',
				() => this.openUrl("https://itunes.apple.com/app/tutanota/id922429609?mt=8&uo=4&at=10lSfb"),
				() => BootIcons.Apple)
				.setIsVisibleHandler(() => client.isDesktopDevice() ||
					(client.device === DeviceType.IPAD || client.device === DeviceType.IPHONE))
				.setType(ButtonType.ActionLarge),

			new Button('appInfoFDroidImageAlt_alt', () => this.openUrl("https://f-droid.org/packages/de.tutao.tutanota/"),
				() => BootIcons.FDroid)
				.setIsVisibleHandler(() => client.isDesktopDevice() || client.device === DeviceType.ANDROID)
				.setType(ButtonType.ActionLarge)
		]

		this.loginButton = new Button('login_action', () => this.login()).setType(ButtonType.Login)

		this._knownCredentials = []
		this._isDeleteCredentials = false;

		this._viewController = asyncImport(typeof module !== "undefined" ? module.id : __moduleName,
			`${env.rootPathPrefix}src/login/LoginViewController.js`)
			.then(module => new module.LoginViewController(this))

		if (window.location.href.includes('signup')) {
			this.permitAutoLogin = false
			this._signup()
		} else if (window.location.href.endsWith('recover')) {
			this.permitAutoLogin = false
			show()
		} else {
			this.permitAutoLogin = true
		}

		const optionsExpander = this._expanderButton()

		this._setupShortcuts()

		let bottomMargin = 0
		const keyboardListener = (keyboardSize) => {
			bottomMargin = keyboardSize
			m.redraw()
		}

		this.view = (): VirtualElement => {
			return m("#login-view.main-view.flex.col", {
				oncreate: () => windowFacade.addKeyboardSizeListener(keyboardListener),
				onremove: () => windowFacade.removeKeyboardSizeListener(keyboardListener),
				style: {
					marginBottom: bottomMargin + "px"
				}
			}, [
				m(header),
				m(".flex-grow.flex-center.scroll", m(".flex-grow-shrink-auto.max-width-s.pt.plr-l", {
						style: {
							// width: workaround for IE11 which does not center the area, otherwise
							width: client.isDesktopDevice() ? "360px" : null,
						}
					}, [
						this._showingKnownCredentials ? this.credentialsSelector() : this.loginForm(),
						(this._anyMoreItemVisible()) ? m(".flex-center.pt-l", [
							m(optionsExpander),
						]) : null,
						(this._anyMoreItemVisible()) ? m("", [
							m(optionsExpander.panel),
						]) : null,
						(!isApp() || isDesktop()) ? renderPrivacyAndImprintLinks() : null
					])
				),
			])
		}
	}

	_setupShortcuts() {
		let shortcuts = [
			{
				key: Keys.RETURN,
				exec: () => this.login(),
				help: "login_label"
			},
		]

		this.oncreate = () => {
			keyManager.registerShortcuts(shortcuts)
			// When iOS does auto-filling (always in WebView as of iOS 12.2 and in older Safari)
			// it only sends one input/change event for all fields so we didn't know if fields
			// were updated. So we kindly ask our fields to update themselves with real DOM values.
			this._formsUpdateStream = stream.combine(() => {
				requestAnimationFrame(() => {
					this.mailAddress.updateValue()
					this.password.updateValue()
				})
			}, [this.mailAddress.value, this.password.value])
		}
		this.onremove = () => {
			this.password.value("")
			keyManager.unregisterShortcuts(shortcuts)

			if (this._formsUpdateStream) {
				this._formsUpdateStream.end(true)
			}
		}
	}

	_signupLinkVisible(): boolean {
		return !this._showingKnownCredentials && (isTutanotaDomain() || getWhitelabelRegistrationDomains().length > 0)
	}

	_loginAnotherLinkVisible(): boolean {
		return this._showingKnownCredentials
	}

	_deleteCredentialsLinkVisible(): boolean {
		return this._showingKnownCredentials
	}

	_knownCredentialsLinkVisible(): boolean {
		return !this._showingKnownCredentials && (this._knownCredentials.length > 0)
	}

	_switchThemeLinkVisible(): boolean {
		return (themeId() !== 'custom')
	}

	_recoverLoginVisible(): boolean {
		return isTutanotaDomain()
	}

	_anyMoreItemVisible(): boolean {
		return this._signupLinkVisible()
			|| this._loginAnotherLinkVisible()
			|| this._deleteCredentialsLinkVisible()
			|| this._knownCredentialsLinkVisible()
			|| this._switchThemeLinkVisible()
			|| this._recoverLoginVisible()
	}

	_expanderButton(): ExpanderButton {
		const panel = {
			view: () => m(".flex-center.flex-column", [
				this._loginAnotherLinkVisible() ? m(ButtonN, {
					label: "loginOtherAccount_action",
					type: ButtonType.Secondary,
					click: () => this._showLoginForm("")
				}) : null,
				this._deleteCredentialsLinkVisible() ? m(ButtonN, {
					label: this._isDeleteCredentials ? "cancel_action" : "deleteCredentials_action",
					type: ButtonType.Secondary,
					click: () => this._switchDeleteCredentialsState()
				}) : null,
				this._knownCredentialsLinkVisible() ? m(ButtonN, {
					label: "knownCredentials_label",
					type: ButtonType.Secondary,
					click: () => this._showCredentials()
				}) : null,
				this._signupLinkVisible() ? m(ButtonN, {
					label: "register_label",
					type: ButtonType.Secondary,
					click: () => m.route.set("/signup")
				}) : null,
				this._switchThemeLinkVisible() ? m(ButtonN, {
					label: "switchColorTheme_action",
					type: ButtonType.Secondary,
					click: () => {
						switch (themeId()) {
							case 'light':
								return deviceConfig.setTheme('dark')
							case 'dark':
								return deviceConfig.setTheme('light')
						}
					}
				}) : null,
				this._recoverLoginVisible() ? m(ButtonN, {
					label: "recoverAccountAccess_action",
					click: () => {
						m.route.set('/recover')
						show()
					},
					type: ButtonType.Secondary,
				}) : null,
			])
		}
		return new ExpanderButton('more_label', new ExpanderPanel(panel), false)
	}

	login() {
		this._viewController.then((viewController: ILoginViewController) => viewController.formLogin())
	}

	loginForm() {
		return m("form", {
			onsubmit: (e) => {
				e.preventDefault() // do not post the form, the form is just here to enable browser auto-fill (FF and chrome do not work in dist mode otherwise)
			},
		}, [
			m(this.mailAddress),
			m(this.password),
			(!whitelabelCustomizations ||
				whitelabelCustomizations.bootstrapCustomizations.indexOf(BootstrapFeatureType.DisableSavePassword) === -1)
				? m(this.savePassword)
				: null,
			m(".pt", m(this.loginButton)),
			m("p.center.statusTextColor", m("small", [
				this.helpText + " ",
				this.invalidCredentials && this._recoverLoginVisible()
					? m('a', {
						href: '/recover',
						onclick: e => {
							m.route.set('/recover')
							show(this.mailAddress.value(), "password")
							e.preventDefault()
						}
					}, lang.get("recoverAccountAccess_action"))
					: null
			])),
			!(isApp() || isDesktop()) && isTutanotaDomain() ? m(".flex-center.pt-l", this.appButtons.map(button => m(button))) : null
		])
	}

	credentialsSelector(): Children {
		return this._knownCredentials.map(c => {
			const credentialButtons = [];
			credentialButtons.push(m(new Button(() => c.mailAddress, () => this._viewController.then(
				(viewController: ILoginViewController) => viewController.autologin(c))).setType(ButtonType.Login)))
			if (this._isDeleteCredentials) {
				credentialButtons.push(m(new Button("delete_action", () => this._viewController.then(
					(viewController: ILoginViewController) => viewController.deleteCredentialsNotLoggedIn(c)))
					.setType(ButtonType.Secondary)))
			}
			return m(".flex-space-between.pt-l.child-grow.last-child-fixed", credentialButtons)
		})
	}

	setKnownCredentials(credentials: Credentials[]) {
		this._knownCredentials = credentials
		this._showingKnownCredentials = this._showingKnownCredentials && (credentials.length > 0)
		m.redraw()
	}

	_signup() {
		if (!this._showingSignup) {
			this._showingSignup = true
			showProgressDialog('loading_msg', this._viewController.then(c => c.loadSignupWizard())).then(dialog => dialog.show())
		}
	}

	updateUrl(args: Object, requestedPath: string) {
		if (requestedPath.startsWith("/signup")) {
			this._signup()
			return
		} else if (requestedPath.startsWith("/recover")) {
			return
		}
		this._showingSignup = false


		if (args.requestedPath) {
			this._requestedPath = args.requestedPath
		} else if (args.action) {
			this._requestedPath = this.targetPath + `?action=${args.action}`
		} else {
			this._requestedPath = this.targetPath
		}

		let promise = Promise.resolve()
		if (args.migrateCredentials && client.localStorage() && !localStorage.getItem("tutanotaConfig")) {
			try {
				const oldCredentials = JSON.parse(
					utf8Uint8ArrayToString(
						base64ToUint8Array(base64UrlToBase64(args.migrateCredentials))))._credentials || []

				promise = showProgressDialog("loading_msg",
					this._viewController.then(viewController => viewController.migrateDeviceConfig(oldCredentials)))
			} catch (e) {
				console.log("Failed to parse old credentials", e)
			}
		} else if (client.localStorage() && localStorage.getItem("config")) { // migrate ios credentials
			if (localStorage.getItem("tutanotaConfig")) {
				localStorage.removeItem("config")
			} else {
				const oldCredentials = JSON.parse(neverNull(localStorage.getItem("config")))._credentials || []
				promise = showProgressDialog("loading_msg",
					this._viewController.then(viewController => viewController.migrateDeviceConfig(oldCredentials))
					    .finally(() => localStorage.removeItem("config")))
			}

		}
		promise.then(() => {
			if ((args.loginWith || args.userId) && !(args.loginWith && deviceConfig.get(args.loginWith) ||
				args.userId && deviceConfig.getByUserId(args.userId))) {
				// there are no credentials stored for the desired email address or user id, so let the user enter the password
				this.mailAddress.setValue(args.loginWith)
				// ensure that input fields have been created after app launch
				if (this.mailAddress._domInput) {
					this.mailAddress.animate()
				}
				this.password.focus()
				this._knownCredentials = []
				this._showingKnownCredentials = false
				m.redraw()
			} else {
				this._knownCredentials = deviceConfig.getAllInternal()
				this._showingKnownCredentials = this._knownCredentials.length > 0
				let autoLoginCredentials: ?Credentials = null
				if (args.noAutoLogin !== true && this.permitAutoLogin) {
					if (args.loginWith && deviceConfig.get(args.loginWith)) {
						// there are credentials for the desired email address existing, so try to auto login
						autoLoginCredentials = deviceConfig.get(args.loginWith)
					} else if (args.userId && deviceConfig.getByUserId(args.userId)) {
						autoLoginCredentials = deviceConfig.getByUserId(args.userId)
					} else if (this._knownCredentials.length === 1) {
						// there is one credentials stored, so try to auto login
						autoLoginCredentials = this._knownCredentials[0]
					}
				}
				m.redraw()
				if (autoLoginCredentials) {
					this._viewController.then(
						viewController => viewController.autologin(neverNull(autoLoginCredentials)))
				}
			}

			if (this._isDeleteCredentials) {
				this._switchDeleteCredentialsState();
			}
		})
	}

	_showLoginForm(mailAddress: string) {
		this.mailAddress.value(mailAddress)
		this._isDeleteCredentials = false;
		this._showingKnownCredentials = false;
		m.redraw()
	}

	_showCredentials() {
		this._showingKnownCredentials = true;
		m.redraw()
	}

	onBackPress(): boolean {
		if (!this._showingKnownCredentials && this._knownCredentials.length > 0) {
			this._showCredentials()
			return true
		}
		return false
	}

	openUrl(url: string) {
		window.open(url, '_blank')
	}


	_switchDeleteCredentialsState(): void {
		this._isDeleteCredentials = !this._isDeleteCredentials;
		m.redraw();
	}
}

export function getWhitelabelRegistrationDomains(): string[] {
	return (whitelabelCustomizations && whitelabelCustomizations.registrationDomains) ?
		whitelabelCustomizations.registrationDomains : []
}

export function getImprintLink(): ?string {
	return (whitelabelCustomizations) ?
		whitelabelCustomizations.imprintUrl : "https://tutanota.com/about"
}

export function getPrivacyStatementLink(): ?string {
	return (whitelabelCustomizations) ?
		whitelabelCustomizations.privacyStatementUrl : "https://tutanota.com/privacy"
}


export function renderPrivacyAndImprintLinks() {
	return m("div.center.flex.flex-grow.items-end.justify-center.mb-l.mt-xl", [
		(getPrivacyStatementLink()) ? m("a.plr", {
			href: getPrivacyStatementLink(),
			target: "_blank"
		}, lang.get("privacyLink_label")) : null,
		(getImprintLink()) ? m("a.plr", {
			href: getImprintLink(),
			target: "_blank"
		}, lang.get("imprint_label")) : null,
	])
}

export const login: LoginView = new LoginView()
