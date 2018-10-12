// @flow
import m from "mithril"
import {TextField, Type} from "../gui/base/TextField"
import {Checkbox} from "../gui/base/Checkbox"
import {Button, ButtonType} from "../gui/base/Button"
import {client} from "../misc/ClientDetector"
import {assertMainOrNode, isApp, isTutanotaDomain} from "../api/Env"
import {lang} from "../misc/LanguageViewModel"
import {asyncImport, neverNull} from "../api/common/utils/Utils"
import {deviceConfig} from "../misc/DeviceConfig"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {themeId} from "../gui/theme"
import {keyManager, Keys} from "../misc/KeyManager"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {BootstrapFeatureType} from "../api/common/TutanotaConstants"
import {base64ToUint8Array, base64UrlToBase64, utf8Uint8ArrayToString} from "../api/common/utils/Encoding"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {windowFacade} from "../misc/WindowFacade"
import {DeviceType} from "../misc/ClientConstants"

assertMainOrNode()

export class LoginView {

	targetPath: string;
	mailAddress: TextField;
	password: TextField;
	helpText: string;
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
	onbeforeremove: Function;

	constructor() {
		this.targetPath = '/mail'
		this.mailAddress = new TextField('mailAddress_label')
			.setType(Type.Email)
		this.helpText = lang.get('emptyString_msg')
		this.password = new TextField("password_label")
			.setType(Type.Password)
		this.savePassword = new Checkbox("storePassword_action", () => lang.get("onlyPrivateComputer_msg"))
		if (!client.localStorage()) {
			this.savePassword.setDisabled("functionNotSupported_msg")
		}

		this.appButtons = [
			new Button('appInfoAndroidImageAlt_alt', () => this.openUrl(
				"https://play.google.com/store/apps/details?id=de.tutao.tutanota"), () => BootIcons.Android)
				.setIsVisibleHandler(() => client.isDesktopDevice() || client.device === DeviceType.ANDROID)
				.setType(ButtonType.ActionLarge),

			new Button('appInfoIosImageAlt_alt', () => this.openUrl(
				"https://itunes.apple.com/app/tutanota/id922429609?mt=8&uo=4&at=10lSfb"), () => BootIcons.Apple)
				.setIsVisibleHandler(() => client.isDesktopDevice() ||
					(client.device === DeviceType.IPAD || client.device === DeviceType.IPHONE))
				.setType(ButtonType.ActionLarge),

			new Button('appInfoAmazonImageAlt_alt', () => this.openUrl(
				"http://www.amazon.com/Tutao-GmbH-Tutanota-einfach-sicher/dp/B00TH6BIAE"), () => BootIcons.Amazon)
				.setIsVisibleHandler(() => client.isDesktopDevice() || client.device === DeviceType.ANDROID)
				.setType(ButtonType.ActionLarge)
		]

		this.loginButton = new Button('login_action', () => this.login()).setType(ButtonType.Login)

		this._knownCredentials = []
		this._isDeleteCredentials = false;

		this._viewController = asyncImport(typeof module !== "undefined" ? module.id : __moduleName,
			`${env.rootPathPrefix}src/login/LoginViewController.js`)
			.then(module => new module.LoginViewController(this))

		const optionsExpander = this._expanderButton()

		this._setupShortcuts()

		let bottomMargin = 0
		const keyboardListener = (keyboardSize) => {
			bottomMargin = keyboardSize
			m.redraw()
		}

		this.view = (): VirtualElement => {
			return m(".main-view.flex-center.scroll.pt-responsive", {
				oncreate: () => windowFacade.addKeyboardSizeListener(keyboardListener),
				onremove: () => windowFacade.removeKeyboardSizeListener(keyboardListener),
				style: {
					marginBottom: bottomMargin + "px"
				}
			}, [
				m(".flex-grow-shrink-auto.max-width-s.pt.pb.plr-l", {
					style: {
						// width: workaround for IE11 which does not center the area, otherwise
						width: client.isDesktopDevice() ? "360px" : null,
					}
				}, [
					this._showingKnownCredentials ? this.credentialsSelector() : this.loginForm(),
					m(".flex-center.pt-l", [
						m(optionsExpander),
					]),
					m(".pb-l", [
						m(optionsExpander.panel),
					]),
				])
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

		this.oncreate = () => keyManager.registerShortcuts(shortcuts)
		this.onbeforeremove = () => {
			this.password.value("")
			keyManager.unregisterShortcuts(shortcuts)
		}
	}

	_expanderButton(): ExpanderButton {
		const themeSwitch = () => {
			return (themeId() !== 'custom')
				? m(new Button("switchColorTheme_action", () => {
					switch (themeId()) {
						case 'light':
							return deviceConfig.setTheme('dark')
						case 'dark':
							return deviceConfig.setTheme('light')
					}
				}).setType(ButtonType.Secondary))
				: null
		}

		const signUp = () => {
			return (isTutanotaDomain() || getWhitelabelRegistrationDomains().length > 0)
				? m(new Button('register_label', () => m.route.set('/signup')).setType(ButtonType.Secondary))
				: null
		}

		const knownCredentials = () => {
			return (this._knownCredentials.length > 0)
				? m(new Button('knownCredentials_label', () => this._showCredentials())
					.setType(ButtonType.Secondary))
				: null
		}

		const loginOther = () => {
			return m(new Button("loginOtherAccount_action", () => this._showLoginForm(""))
				.setType(ButtonType.Secondary))
		}

		const deleteCredentials = () => {
			return m(new Button(this._isDeleteCredentials
				? "cancel_action"
				: "deleteCredentials_action", () => this._switchDeleteCredentialsState())
				.setType(ButtonType.Secondary))
		}

		const panel = {
			view: () => m(".flex-center.flex-column", this._showingKnownCredentials
				? [loginOther(), deleteCredentials(), themeSwitch()]
				: [knownCredentials(), signUp(), themeSwitch()]
			)
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
				whitelabelCustomizations.bootstrapCustomizations.indexOf(BootstrapFeatureType.DisableSavePassword)
				== -1) ?
				m(this.savePassword) : null,
			m(".pt", m(this.loginButton)),
			m("p.center.statusTextColor", m("small", this.helpText)),
			isApp() ? null : m(".flex-center.pt-l", this.appButtons.map(button => m(button)))
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

	updateUrl(args: Object) {
		if (args.requestedPath) {
			this._requestedPath = args.requestedPath
		} else {
			this._requestedPath = this.targetPath
		}

		let promise = Promise.resolve()
		if (args.migrateCredentials) {
			try {
				const oldCredentials = JSON.parse(
					utf8Uint8ArrayToString(
						base64ToUint8Array(base64UrlToBase64(args.migrateCredentials))))._credentials || []

				promise = showProgressDialog("loading_msg",
					this._viewController.then(viewController => viewController.migrateDeviceConfig(oldCredentials)))
			} catch (e) {
				console.log("Failed to parse old credentials", e)
			}
		}
		else if (client.localStorage() && localStorage.getItem("config")) {
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
				m.redraw()
			} else {
				this._knownCredentials = deviceConfig.getAllInternal()
				this._showingKnownCredentials = this._knownCredentials.length > 0
				let autoLoginCredentials: ?Credentials = null
				if (args.noAutoLogin !== true) {
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

export const login: LoginView = new LoginView()