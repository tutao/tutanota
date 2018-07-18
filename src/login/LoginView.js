// @flow
import m from "mithril"
import {TextField, Type} from "../gui/base/TextField"
import {Checkbox} from "../gui/base/Checkbox"
import {Button, ButtonType} from "../gui/base/Button"
import {client, DeviceType} from "../misc/ClientDetector"
import {assertMainOrNode, isTutanotaDomain, isApp} from "../api/Env"
import {lang} from "../misc/LanguageViewModel"
import {asyncImport, neverNull} from "../api/common/utils/Utils"
import {deviceConfig} from "../misc/DeviceConfig"
import {ExpanderButton, ExpanderPanel} from "../gui/base/Expander"
import {themeId} from "../gui/theme"
import {keyManager, Keys} from "../misc/KeyManager"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {BootstrapFeatureType} from "../api/common/TutanotaConstants"
import {base64ToUint8Array, utf8Uint8ArrayToString, base64UrlToBase64} from "../api/common/utils/Encoding"
import {showProgressDialog} from "../gui/base/ProgressDialog"

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
	_visibleCredentials: Credentials[];
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
					(client.device == DeviceType.IPAD || client.device == DeviceType.IPHONE))
				.setType(ButtonType.ActionLarge),

			new Button('appInfoAndroidImageAlt_alt', () => this.openUrl(
				"http://www.amazon.com/Tutao-GmbH-Tutanota-einfach-sicher/dp/B00TH6BIAE"), () => BootIcons.Amazon)
				.setIsVisibleHandler(() => client.isDesktopDevice() || client.device === DeviceType.ANDROID)
				.setType(ButtonType.ActionLarge)
		]

		this.loginButton = new Button('login_action', () => this.login()).setType(ButtonType.Login)

		this._visibleCredentials = []
		this._isDeleteCredentials = false;

		this._viewController = asyncImport(typeof module !== "undefined" ? module.id : __moduleName,
			`${env.rootPathPrefix}src/login/LoginViewController.js`)
			.then(module => new module.LoginViewController(this))

		let themeSwitch = new Button("switchColorTheme_action", () => {
			switch (themeId()) {
				case 'light':
					return deviceConfig.setTheme('dark')
				case 'dark':
					return deviceConfig.setTheme('light')
			}
		}).setType(ButtonType.Secondary)

		let signup = new Button('register_label', () => m.route.set('/signup')).setType(ButtonType.Secondary)

		let panel = {
			view: () => (this._visibleCredentials.length > 0 ? [
				m(".flex-center.flex-column", [
					m(new Button("loginOtherAccount_action", () => this._showLoginForm("")).setType(
						ButtonType.Secondary)),
					m(new Button(this._isDeleteCredentials ? "cancel_action" :
						"deleteCredentials_action", () => this._switchDeleteCredentialsState()).setType(
						ButtonType.Secondary))
				]),
			] : []).concat(m(".flex-center.flex-column", [
				(isTutanotaDomain() || getWhitelabelRegistrationDomains().length > 0) ? m(signup) : null,
				themeId() !== 'custom' ? m(themeSwitch) : null,
			]))
		}

		let optionsExpander = new ExpanderButton('more_label', new ExpanderPanel(panel), false)

		this._setupShortcuts()

		this.view = (): VirtualElement => {
			return m(".main-view.flex-center.scroll.pt-responsive", [
				m(".flex-grow-shrink-auto.max-width-s.pt.pb.plr-l", {
					style: {width: client.isDesktopDevice() ? "360px" : null} // workaround for IE11 which does not center the area, otherwise
				}, [
					this._visibleCredentials.length > 0 ? this.credentialsSelector() : this.loginForm(),
					m(".flex-center.pt-l", [
						m(optionsExpander),
					]),
					m(".pb-l", [
						m(optionsExpander.panel),
					]),
				]),
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

	credentialsSelector() {
		return this._visibleCredentials.map(c => {
			const credentialButtons = [];
			credentialButtons.push(m(new Button(() => c.mailAddress, () => this._viewController.then(
				(viewController: ILoginViewController) => viewController.autologin(c))).setType(ButtonType.Login)))
			if (this._isDeleteCredentials) {
				credentialButtons.push(m(new Button("delete_action", () => this._viewController.then(
					(viewController: ILoginViewController) => viewController.deleteCredentialsNotLoggedIn(c))).setType(
					ButtonType.Secondary)))
			}
			return m(".flex-space-between.pt-l.child-grow.last-child-fixed", credentialButtons)
		})
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
				this._visibleCredentials = []
				m.redraw()
			} else {
				this._visibleCredentials = deviceConfig.getAllInternal()
				let autoLoginCredentials: ?Credentials = null
				if (args.noAutoLogin !== true) {
					if (args.loginWith && deviceConfig.get(args.loginWith)) {
						// there are credentials for the desired email address existing, so try to auto login
						autoLoginCredentials = deviceConfig.get(args.loginWith)
					} else if (args.userId && deviceConfig.getByUserId(args.userId)) {
						autoLoginCredentials = deviceConfig.getByUserId(args.userId)
					} else if (this._visibleCredentials.length === 1) {
						// there is one credentials stored, so try to auto login
						autoLoginCredentials = this._visibleCredentials[0]
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
		this._visibleCredentials = [];
		m.redraw()
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