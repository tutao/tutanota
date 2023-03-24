import m, { ChildArray, Children, Vnode } from "mithril"
import { client } from "../misc/ClientDetector"
import { assertMainOrNode, isApp, isDesktop, isTutanotaDomain } from "../api/common/Env"
import { InfoLink, lang } from "../misc/LanguageViewModel"
import type { DeferredObject } from "@tutao/tutanota-utils"
import { defer, mapNullable } from "@tutao/tutanota-utils"
import { ExpanderButton, ExpanderPanel } from "../gui/base/Expander"
import { BootIcons } from "../gui/base/icons/BootIcons"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { windowFacade } from "../misc/WindowFacade"
import { DeviceType } from "../misc/ClientConstants"
import { Button, ButtonType } from "../gui/base/Button.js"
import { BaseHeaderAttrs, Header } from "../gui/Header.js"
import { AriaLandmarks, landmarkAttrs, liveDataAttrs } from "../gui/AriaUtils"
import { DisplayMode, LoginState, LoginViewModel } from "./LoginViewModel"
import { LoginForm } from "./LoginForm"
import { CredentialsSelector } from "./CredentialsSelector"
import { getWhitelabelCustomizations } from "../misc/WhitelabelCustomizations"
import { themeController } from "../gui/theme"
import { createAsyncDropdown, createDropdown, DropdownButtonAttrs } from "../gui/base/Dropdown.js"
import type { clickHandler } from "../gui/base/GuiUtils"
import { IconButton } from "../gui/base/IconButton.js"
import { showLogsDialog } from "./LoginLogDialog.js"
import { BaseTopLevelView } from "../gui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../TopLevelView.js"
import { locator } from "../api/main/MainLocator.js"

assertMainOrNode()

export interface LoginViewAttrs extends TopLevelAttrs {
	/** Default path to redirect to after the login. Can be overridden with query param `requestedPath`. */
	targetPath: string
	makeViewModel: () => LoginViewModel
	header: BaseHeaderAttrs
}

export class LoginView extends BaseTopLevelView implements TopLevelView<LoginViewAttrs> {
	private readonly viewModel: LoginViewModel
	private readonly defaultRedirect: string
	private readonly initPromise: Promise<void>

	private moreExpanded: boolean
	// we save the login form because we need access to the password input field inside of it for when "loginWith" is set in the url,
	// in order to focus it
	private loginForm: DeferredObject<LoginForm>
	private selectedRedirect: string
	private bottomMargin = 0

	constructor({ attrs }: Vnode<LoginViewAttrs>) {
		super()
		this.defaultRedirect = attrs.targetPath
		this.selectedRedirect = this.defaultRedirect

		this.loginForm = defer()
		this.moreExpanded = false
		this.viewModel = attrs.makeViewModel()
		this.initPromise = this.viewModel.init().then(m.redraw)
	}

	keyboardListener = (keyboardSize: number) => {
		this.bottomMargin = keyboardSize
		m.redraw()
	}

	view({ attrs }: Vnode<LoginViewAttrs>) {
		return m(
			"#login-view.main-view.flex.col",
			{
				oncreate: () => windowFacade.addKeyboardSizeListener(this.keyboardListener),
				onremove: () => windowFacade.removeKeyboardSizeListener(this.keyboardListener),
				style: {
					marginBottom: this.bottomMargin + "px",
				},
			},
			[
				m(Header, {
					viewSlider: null,
					...attrs.header,
				}),
				m(
					".flex-grow.flex-center.scroll",
					m(
						".flex-grow-shrink-auto.max-width-s.pt.plr-l",
						{
							...landmarkAttrs(AriaLandmarks.Main, lang.get("login_label")),
							oncreate: (vnode) => {
								;(vnode.dom as HTMLElement).focus()
							},
						},
						[
							this.viewModel.displayMode === DisplayMode.Credentials || this.viewModel.displayMode === DisplayMode.DeleteCredentials
								? this._renderCredentialsSelector()
								: this._renderLoginForm(),
							!(isApp() || isDesktop()) && isTutanotaDomain(location.hostname) ? this._renderAppButtons() : null,
							this._anyMoreItemVisible() ? this._renderOptionsExpander() : null,
							renderInfoLinks(),
						],
					),
				),
			],
		)
	}

	_renderOptionsExpander(): Children {
		return [
			m(
				".flex-center.pt-l",
				m(ExpanderButton, {
					label: "more_label",
					expanded: this.moreExpanded,
					onExpandedChange: (v) => (this.moreExpanded = v),
				}),
			),
			m(
				ExpanderPanel,
				{
					expanded: this.moreExpanded,
				},
				[
					m(".flex-center.flex-column", [
						this._loginAnotherLinkVisible()
							? m(Button, {
									label: "loginOtherAccount_action",
									type: ButtonType.Secondary,
									click: () => {
										this.viewModel.showLoginForm()
									},
							  })
							: null,
						this._deleteCredentialsLinkVisible()
							? m(Button, {
									label: this.viewModel.displayMode === DisplayMode.DeleteCredentials ? "cancel_action" : "deleteCredentials_action",
									type: ButtonType.Secondary,
									click: () => this._switchDeleteCredentialsState(),
							  })
							: null,
						this._knownCredentialsLinkVisible()
							? m(Button, {
									label: "knownCredentials_label",
									type: ButtonType.Secondary,
									click: () => this.viewModel.showCredentials(),
							  })
							: null,
						this._signupLinkVisible()
							? m(Button, {
									label: "register_label",
									type: ButtonType.Secondary,
									click: () => m.route.set("/signup"),
							  })
							: null,
						this._switchThemeLinkVisible()
							? m(Button, {
									label: "switchColorTheme_action",
									type: ButtonType.Secondary,
									click: this.themeSwitchListener(),
							  })
							: null,
						this._recoverLoginVisible()
							? m(Button, {
									label: "recoverAccountAccess_action",
									click: () => {
										m.route.set("/recover")
									},
									type: ButtonType.Secondary,
							  })
							: null,
					]),
				],
			),
		]
	}

	themeSwitchListener(): clickHandler {
		return createAsyncDropdown({
			lazyButtons: async () => {
				const defaultButtons: ReadonlyArray<DropdownButtonAttrs> = [
					{
						label: "light_label",
						click: () => themeController.setThemeId("light"),
					},
					{
						label: "dark_label",
						click: () => themeController.setThemeId("dark"),
					},
					{
						label: "blue_label",
						click: () => themeController.setThemeId("blue"),
					},
				]
				const customButtons = (await themeController.getCustomThemes()).map((themeId) => {
					return {
						label: () => themeId,
						click: () => themeController.setThemeId(themeId),
					}
				})
				return defaultButtons.concat(customButtons)
			},
			width: 300,
		})
	}

	_signupLinkVisible(): boolean {
		return this.viewModel.displayMode === DisplayMode.Form && (isTutanotaDomain(location.hostname) || getWhitelabelRegistrationDomains().length > 0)
	}

	_loginAnotherLinkVisible(): boolean {
		return this.viewModel.displayMode === DisplayMode.Credentials || this.viewModel.displayMode === DisplayMode.DeleteCredentials
	}

	_deleteCredentialsLinkVisible(): boolean {
		return this.viewModel.displayMode === DisplayMode.Credentials || this.viewModel.displayMode === DisplayMode.DeleteCredentials
	}

	_knownCredentialsLinkVisible(): boolean {
		return this.viewModel.displayMode === DisplayMode.Form && this.viewModel.getSavedCredentials().length > 0
	}

	_switchThemeLinkVisible(): boolean {
		return themeController.shouldAllowChangingTheme()
	}

	_recoverLoginVisible(): boolean {
		return isTutanotaDomain(location.hostname)
	}

	_anyMoreItemVisible(): boolean {
		return (
			this._signupLinkVisible() ||
			this._loginAnotherLinkVisible() ||
			this._deleteCredentialsLinkVisible() ||
			this._knownCredentialsLinkVisible() ||
			this._switchThemeLinkVisible() ||
			this._recoverLoginVisible()
		)
	}

	_renderLoginForm(): Children {
		return m(
			"",
			{
				oncreate: (vnode) => {
					const children = vnode.children as ChildArray
					const firstChild = children[0] as Vnode<unknown, LoginForm>
					this.loginForm.resolve(firstChild.state)
				},
			},
			m(LoginForm, {
				oninit: () => {
					// we need to re-resolve this promise sometimes and for that we
					// need a new promise. otherwise, callbacks that are registered after
					// this point never get called because they have been registered after
					// it was resolved the first time.
					this.loginForm = defer()
				},
				onSubmit: () => this._loginWithProgressDialog(),
				mailAddress: this.viewModel.mailAddress,
				password: this.viewModel.password,
				savePassword: this.viewModel.savePassword,
				helpText: lang.getMaybeLazy(this.viewModel.helpText),
				invalidCredentials: this.viewModel.state === LoginState.InvalidCredentials,
				showRecoveryOption: this._recoverLoginVisible(),
				accessExpired: this.viewModel.state === LoginState.AccessExpired,
			}),
		)
	}

	async _loginWithProgressDialog() {
		await showProgressDialog("login_msg", this.viewModel.login())
		m.redraw()

		if (this.viewModel.state === LoginState.LoggedIn) {
			m.route.set(this.selectedRedirect)
		}
	}

	_renderCredentialsSelector(): Children {
		return [
			m(".small.center.statusTextColor.pt", liveDataAttrs(), lang.getMaybeLazy(this.viewModel.helpText)),
			m(CredentialsSelector, {
				credentials: this.viewModel.getSavedCredentials(),
				onCredentialsSelected: async (c) => {
					await this.viewModel.useCredentials(c)
					await this._loginWithProgressDialog()
				},
				onCredentialsDeleted:
					this.viewModel.displayMode === DisplayMode.DeleteCredentials
						? (credentials) => {
								this.viewModel.deleteCredentials(credentials).then(() => m.redraw())
						  }
						: null,
			}),
		]
	}

	_renderAppButtons(): Children {
		return m(".flex-center.pt-l.ml-between-s", [
			client.isDesktopDevice() || client.device === DeviceType.ANDROID
				? m(IconButton, {
						title: "appInfoAndroidImageAlt_alt",
						click: (e) => {
							this._openUrl("https://play.google.com/store/apps/details?id=de.tutao.tutanota")

							e.preventDefault()
						},
						icon: BootIcons.Android,
				  })
				: null,
			client.isDesktopDevice() || client.device === DeviceType.IPAD || client.device === DeviceType.IPHONE
				? m(IconButton, {
						title: "appInfoIosImageAlt_alt",
						click: (e) => {
							this._openUrl("https://itunes.apple.com/app/tutanota/id922429609?mt=8&uo=4&at=10lSfb")

							e.preventDefault()
						},
						icon: BootIcons.Apple,
				  })
				: null,
			client.isDesktopDevice() || client.device === DeviceType.ANDROID
				? m(IconButton, {
						title: "appInfoFDroidImageAlt_alt",
						click: (e) => {
							this._openUrl("https://f-droid.org/packages/de.tutao.tutanota/")

							e.preventDefault()
						},
						icon: BootIcons.FDroid,
				  })
				: null,
		])
	}

	onNewUrl(args: Record<string, any>, requestedPath: string) {
		if (args.requestedPath) {
			this.selectedRedirect = args.requestedPath
		} else if (args.action) {
			// Action needs be forwarded this way in order to be able to deal with cases where a user is not logged in and clicks
			// on the support link on our website (https://mail.tutanota.com?action=supportMail)
			this.selectedRedirect = `/mail?action=${args.action}`
		} else {
			this.selectedRedirect = this.defaultRedirect
		}
		this.handleLoginArguments(args, requestedPath)
	}

	private async handleLoginArguments(args: Record<string, any>, requestedPath: string) {
		await this.initPromise
		// since we wait for something async here the URL might have already changed and
		// we shouldn't handle any outdated URL changes.
		if (m.route.get() !== requestedPath) return

		const autoLogin = args.noAutoLogin == null || args.noAutoLogin === false

		if (autoLogin) {
			if (args.userId) {
				await this.viewModel.useUserId(args.userId)
			}

			if (this.viewModel.canLogin()) {
				this._loginWithProgressDialog()

				m.redraw()
				return
			}
		}

		if (args.loginWith) {
			this.viewModel.showLoginForm()
		}

		// We want to focus password field if login field is already filled in
		if (args.loginWith) {
			this.loginForm.promise.then((loginForm: LoginForm) => {
				loginForm.mailAddressTextField.value = ""
				loginForm.passwordTextField.value = ""
				this.viewModel.mailAddress(args.loginWith ?? "")
				this.viewModel.password("")
				loginForm.passwordTextField.focus()
			})
		}

		m.redraw()
	}

	_openUrl(url: string) {
		window.open(url, "_blank")
	}

	_switchDeleteCredentialsState(): void {
		this.viewModel.switchDeleteState()
	}
}

export function getWhitelabelRegistrationDomains(): string[] {
	return mapNullable(getWhitelabelCustomizations(window), (c) => c.registrationDomains) || []
}

export function getImprintLink(): string | null {
	return mapNullable(getWhitelabelCustomizations(window), (c) => c.imprintUrl) || InfoLink.About
}

export function getPrivacyStatementLink(): string | null {
	return mapNullable(getWhitelabelCustomizations(window), (c) => c.privacyStatementUrl) || InfoLink.Privacy
}

export function renderInfoLinks(): Children {
	return m("div.center.flex.flex-grow.items-end.justify-center.mb-l.mt-xl.wrap", [
		!isApp() && getPrivacyStatementLink()
			? m(
					"a.plr",
					{
						href: getPrivacyStatementLink(),
						target: "_blank",
					},
					lang.get("privacyLink_label"),
			  )
			: null,
		!isApp() && getImprintLink()
			? m(
					"a.plr",
					{
						href: getImprintLink(),
						target: "_blank",
					},
					lang.get("imprint_label"),
			  )
			: null,
		m(
			".mt.mb.center.small.full-width",
			{
				onclick: (e: MouseEvent) => showVersionDropdown(e),
			},
			`v${env.versionNumber}`,
		),
	])
}

function showVersionDropdown(e: MouseEvent) {
	// A semi-hidden option to get the logs before logging in, in a text form
	createDropdown({
		lazyButtons: () => [
			{
				label: () => "Get logs",
				click: () => showLogsDialog(),
			},
		],
	})(e, e.target as HTMLElement)
}
