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
import {BootIcons} from "../gui/base/icons/BootIcons"
import {BootstrapFeatureType} from "../api/common/TutanotaConstants"
import {base64ToUint8Array, base64UrlToBase64, utf8Uint8ArrayToString} from "../api/common/utils/Encoding"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {windowFacade} from "../misc/WindowFacade"
import {DeviceType} from "../misc/ClientConstants"
import {ButtonN, ButtonType} from "../gui/base/ButtonN"
import {show} from "./RecoverLoginDialog"
import {header} from "../gui/base/Header"
import {AriaLandmarks, landmarkAttrs, liveDataAttrs} from "../api/common/utils/AriaUtils"
import type {ILoginViewController} from "./LoginViewController"
import {showTakeOverDialog} from "./TakeOverDeletedAddressDialog"
import {getTokenFromUrl} from "../subscription/giftcards/GiftCardUtils"
import {Dialog} from "../gui/base/Dialog"
import {loadRedeemGiftCardWizard} from "../subscription/giftcards/RedeemGiftCardWizard"
import {NotAuthorizedError, NotFoundError} from "../api/common/error/RestError"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"
import {worker} from "../api/main/WorkerClient"
import {UserError} from "../api/common/error/UserError"
import {showUserError} from "../misc/ErrorHandlerImpl"
import {LoginForm} from "./LoginForm"
import {CredentialsSelector} from "./CredentialsSelector"

assertMainOrNode()

const DisplayMode = Object.freeze({
	Credentials: "credentials",
	Form: "form",
})

export class LoginView {

	targetPath: string;
	mailAddress: Stream<string>;
	password: Stream<string>;
	// we save the password dom element so that we can focus it when loginWith is passed as a param
	// lazy because it wont have been initialized in oncreate
	passwordInput: lazy<HTMLInputElement>;
	helpText: Vnode<any> | string;
	invalidCredentials: boolean;
	accessExpired: boolean;
	savePassword: Stream<boolean>;
	_requestedPath: string; // redirect to this path after successful login (defined in app.js)
	view: Function;
	_knownCredentials: Credentials[];
	_displayMode: ?$Values<typeof DisplayMode>;
	_isDeleteCredentials: boolean;
	_viewController: Promise<ILoginViewController>;
	oncreate: Function;
	onremove: Function;
	permitAutoLogin: boolean;
	_showingSignup: boolean;
	_moreExpanded: Stream<boolean>;

	constructor() {
		this.targetPath = '/mail'
		this._requestedPath = this.targetPath

		this.mailAddress = stream("")
		this.helpText = lang.get('emptyString_msg')
		this.invalidCredentials = false
		this.accessExpired = false
		this.password = stream("")
		this.savePassword = stream(false)
		this._knownCredentials = []
		this._isDeleteCredentials = false;
		this._moreExpanded = stream(false)

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
				m(".flex-grow.flex-center.scroll", m(".flex-grow-shrink-auto.max-width-s.pt.plr-l"
					+ landmarkAttrs(AriaLandmarks.Main, lang.get("login_label")), {
						oncreate: (vnode) => {
							vnode.dom.focus()
						},
						style: {
							// width: workaround for IE11 which does not center the area, otherwise
							width: client.isDesktopDevice() ? "360px" : null,
						}
					}, [
						this._displayMode === DisplayMode.Credentials
							? this.renderCredentialsSelector()
							: this.renderLoginForm(),
						!(isApp() || isDesktop()) && isTutanotaDomain()
							? this.renderAppButtons()
							: null,
						this._anyMoreItemVisible() ? this._renderOptionsExpander() : null,
						!isApp() ? renderPrivacyAndImprintLinks() : null
					])
				),
			])
		}
	}

	_renderOptionsExpander(): Children {
		return [
			m(".flex-center.pt-l", m(ExpanderButtonN, {
				label: 'more_label',
				expanded: this._moreExpanded,
			})),
			m(ExpanderPanelN, {
				expanded: this._moreExpanded,
			}, [
				m(".flex-center.flex-column", [
					this._loginAnotherLinkVisible()
						? m(ButtonN, {
							label: "loginOtherAccount_action",
							type: ButtonType.Secondary,
							click: () => this._showLoginForm("")
						})
						: null,
					this._deleteCredentialsLinkVisible()
						? m(ButtonN, {
							label: this._isDeleteCredentials ? "cancel_action" : "deleteCredentials_action",
							type: ButtonType.Secondary,
							click: () => this._switchDeleteCredentialsState()
						})
						: null,
					this._knownCredentialsLinkVisible()
						? m(ButtonN, {
							label: "knownCredentials_label",
							type: ButtonType.Secondary,
							click: () => this._showCredentials()
						})
						: null,
					this._signupLinkVisible()
						? m(ButtonN, {
							label: "register_label",
							type: ButtonType.Secondary,
							click: () => m.route.set("/signup")
						})
						: null,
					this._switchThemeLinkVisible()
						? m(ButtonN, {
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
						})
						: null,
					this._recoverLoginVisible()
						? m(ButtonN, {
							label: "recoverAccountAccess_action",
							click: () => {
								m.route.set('/recover')
								show()
							},
							type: ButtonType.Secondary,
						})
						: null,
				])
			])
		]
	}

	_signupLinkVisible(): boolean {
		return this._displayMode !== DisplayMode.Credentials && (isTutanotaDomain() || getWhitelabelRegistrationDomains().length > 0)
	}

	_loginAnotherLinkVisible(): boolean {
		return this._displayMode === DisplayMode.Credentials
	}

	_deleteCredentialsLinkVisible(): boolean {
		return this._displayMode === DisplayMode.Credentials
	}

	_knownCredentialsLinkVisible(): boolean {
		return this._displayMode !== DisplayMode.Credentials && (this._knownCredentials.length > 0)
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

	login() {
		this._viewController.then((viewController: ILoginViewController) => viewController.formLogin())
	}

	renderLoginForm(): Children {
		return m("", {
			oncreate: vnode => {
				this.passwordInput = () => (vnode.children[0].state: LoginForm).passwordTextField._domInput
			}
		}, m(LoginForm, {
			onSubmit: () => this.login(),
			mailAddress: this.mailAddress,
			password: this.password,
			savePassword: this.savePassword,
			helpText: this.helpText,
			invalidCredentials: this.invalidCredentials,
			showRecoveryOption: this._recoverLoginVisible(),
			accessExpired: this.accessExpired
		}))
	}

	renderCredentialsSelector(): Children {
		return m(CredentialsSelector, {
			credentials: this._knownCredentials,
			isDeleteCredentials: this._isDeleteCredentials,
			onCredentialsSelected: c => {
				this._viewController
				    .then(viewController => viewController.autologin(c))
			},
			onCredentialsDeleted: this._isDeleteCredentials
				? c => {
					this._viewController
					    .then(viewController => viewController.deleteCredentialsNotLoggedIn(c))
				} : null
		})
	}

	renderAppButtons(): Children {
		return m(".flex-center.pt-l", [
			m(ButtonN, {
				label: 'appInfoAndroidImageAlt_alt',
				click: e => {
					this.openUrl("https://play.google.com/store/apps/details?id=de.tutao.tutanota")
					e.preventDefault()
				},
				icon: () => BootIcons.Android,
				isVisible: () => client.isDesktopDevice() || client.device === DeviceType.ANDROID,
				type: ButtonType.ActionLarge,
			}),
			m(ButtonN, {
				label: 'appInfoIosImageAlt_alt',
				click: e => {
					this.openUrl("https://itunes.apple.com/app/tutanota/id922429609?mt=8&uo=4&at=10lSfb")
					e.preventDefault()
				},
				icon: () => BootIcons.Apple,
				isVisible: () => client.isDesktopDevice() || (client.device === DeviceType.IPAD || client.device === DeviceType.IPHONE),
				type: ButtonType.ActionLarge,
			}),
			m(ButtonN, {
				label: 'appInfoFDroidImageAlt_alt',
				click: e => {
					this.openUrl("https://f-droid.org/packages/de.tutao.tutanota/")
					e.preventDefault()
				},
				icon: () => BootIcons.FDroid,
				isVisible: () => client.isDesktopDevice() || client.device === DeviceType.ANDROID,
				type: ButtonType.ActionLarge,
			})
		])
	}

	setKnownCredentials(credentials: Credentials[]) {
		this._knownCredentials = credentials
		if (this._displayMode === DisplayMode.Credentials && credentials.length === 0) {
			this._displayMode = DisplayMode.Form
		}
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
		} else if (requestedPath.startsWith("/recover") || requestedPath.startsWith("/takeover")) {
			return
		} else if (requestedPath.startsWith("/giftcard")) {

			const showWizardPromise =
				Promise.resolve()
				       .then(() => getTokenFromUrl(location.hash))
				       .spread((id, key) => {
					       return worker.initialized
					                    .then(() => worker.getGiftCardInfo(id, key))
					                    .then(giftCardInfo => loadRedeemGiftCardWizard(giftCardInfo, key))
				       })

			showProgressDialog("loading_msg", showWizardPromise)
				.then(dialog => dialog.show())
				.catch(NotAuthorizedError, NotFoundError, () => { throw new UserError("invalidGiftCard_msg") })
				.catch(UserError, showUserError)
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
			// if (this._displayMode) {
			// 	return
			// }
			if ((args.loginWith || args.userId) && !(args.loginWith && deviceConfig.get(args.loginWith) ||
				args.userId && deviceConfig.getByUserId(args.userId))) {
				// there are no credentials stored for the desired email address or user id, so let the user enter the password
				this.mailAddress(args.loginWith)

				// when we pre-fill the email address field we need to delete all current state
				this.helpText = lang.get('emptyString_msg')
				this.invalidCredentials = false
				this.accessExpired = false

				this.password("")
				const passwordInput = this.passwordInput()
				if (passwordInput) passwordInput.focus()

				this._knownCredentials = deviceConfig.getAllInternal()
				this._displayMode = DisplayMode.Form
				m.redraw()
			} else {
				this._knownCredentials = deviceConfig.getAllInternal()
				this._displayMode = this._knownCredentials.length > 0 ? DisplayMode.Credentials : DisplayMode.Form
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
		this.mailAddress(mailAddress)
		this._isDeleteCredentials = false;
		this._displayMode = DisplayMode.Form
		m.redraw()
	}

	_showCredentials() {
		this._displayMode = DisplayMode.Credentials
		m.redraw()
	}

	onBackPress(): boolean {
		if (this._displayMode !== DisplayMode.Credentials && this._knownCredentials.length > 0) {
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
		whitelabelCustomizations.imprintUrl : lang.getInfoLink("about_link")
}

export function getPrivacyStatementLink(): ?string {
	return (whitelabelCustomizations) ?
		whitelabelCustomizations.privacyStatementUrl : lang.getInfoLink("privacy_link")
}


export function renderPrivacyAndImprintLinks(): Children {
	return m("div.center.flex.flex-grow.items-end.justify-center.mb-l.mt-xl.wrap", [
			(getPrivacyStatementLink())
				? m("a.plr", {
					href: getPrivacyStatementLink(),
					target: "_blank"
				}, lang.get("privacyLink_label"))
				: null,
			(getImprintLink())
				? m("a.plr", {
					href: getImprintLink(),
					target: "_blank"
				}, lang.get("imprint_label"))
				: null,
			m(".mt.center.small.full-width", `v${env.versionNumber}`),
		]
	)
}

export const login: LoginView = new LoginView()
