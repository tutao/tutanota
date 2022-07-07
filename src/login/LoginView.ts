import m, {ChildArray, Children, Vnode} from "mithril"
import stream from "mithril/stream"
import {client} from "../misc/ClientDetector"
import {assertMainOrNode, isApp, isDesktop, isTutanotaDomain} from "../api/common/Env"
import {InfoLink, lang} from "../misc/LanguageViewModel"
import type {DeferredObject} from "@tutao/tutanota-utils"
import {defer, mapNullable} from "@tutao/tutanota-utils"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/Expander"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {showProgressDialog} from "../gui/dialogs/ProgressDialog"
import {windowFacade} from "../misc/WindowFacade"
import {DeviceType} from "../misc/ClientConstants"
import {ButtonAttrs, Button, ButtonType} from "../gui/base/Button.js"
import {CurrentView, header} from "../gui/Header.js"
import {AriaLandmarks, landmarkAttrs, liveDataAttrs} from "../gui/AriaUtils"
import type {ILoginViewModel} from "./LoginViewModel"
import {DisplayMode, LoginState} from "./LoginViewModel"
import {LoginForm} from "./LoginForm"
import {CredentialsSelector} from "./CredentialsSelector"
import {getWhitelabelCustomizations} from "../misc/WhitelabelCustomizations"
import {themeController} from "../gui/theme"
import {createAsyncDropdown} from "../gui/base/Dropdown.js"
import type {clickHandler} from "../gui/base/GuiUtils"

assertMainOrNode()

export class LoginView implements CurrentView {
	readonly view: CurrentView["view"]
	readonly _viewModel: ILoginViewModel
	readonly _moreExpanded: stream<boolean>
	// we save the login form because we need access to the password input field inside of it for when "loginWith" is set in the url,
	// in order to focus it
	loginForm: DeferredObject<LoginForm>
	readonly _targetPath: string
	_requestedPath: string // redirect to this path after successful login (defined in app.js)

	/**
	 * @param viewModel
	 * @param targetPath which path should the app be redirected to after login is completed
	 */
	constructor(viewModel: ILoginViewModel, targetPath: string) {
		this._viewModel = viewModel
		this._targetPath = targetPath
		this._requestedPath = this._targetPath
		this.loginForm = defer()
		this._moreExpanded = stream<boolean>(false)
		let bottomMargin = 0

		const keyboardListener = (keyboardSize: number) => {
			bottomMargin = keyboardSize
			m.redraw()
		}

		this.view = (): Children => {
			return m(
				"#login-view.main-view.flex.col",
				{
					oncreate: () => windowFacade.addKeyboardSizeListener(keyboardListener),
					onremove: () => windowFacade.removeKeyboardSizeListener(keyboardListener),
					style: {
						marginBottom: bottomMargin + "px",
					},
				},
				[
					m(header),
					m(
						".flex-grow.flex-center.scroll",
						m(
							".flex-grow-shrink-auto.max-width-s.pt.plr-l" + landmarkAttrs(AriaLandmarks.Main, lang.get("login_label")),
							{
								oncreate: vnode => {
									(vnode.dom as HTMLElement).focus()
								},
								style: {
									// width: workaround for IE11 which does not center the area, otherwise
									width: client.isDesktopDevice() ? "360px" : null,
								},
							},
							[
								this._viewModel.displayMode === DisplayMode.Credentials || this._viewModel.displayMode === DisplayMode.DeleteCredentials
									? this._renderCredentialsSelector()
									: this._renderLoginForm(),
								!(isApp() || isDesktop()) && isTutanotaDomain() ? this._renderAppButtons() : null,
								this._anyMoreItemVisible() ? this._renderOptionsExpander() : null,
								!isApp() ? renderPrivacyAndImprintLinks() : null,
							],
						),
					),
				],
			)
		}
	}

	_renderOptionsExpander(): Children {
		return [
			m(
				".flex-center.pt-l",
				m(ExpanderButtonN, {
					label: "more_label",
					expanded: this._moreExpanded(),
					onExpandedChange: this._moreExpanded,
				}),
			),
			m(
				ExpanderPanelN,
				{
					expanded: this._moreExpanded(),
				},
				[
					m(".flex-center.flex-column", [
						this._loginAnotherLinkVisible()
							? m(Button, {
								label: "loginOtherAccount_action",
								type: ButtonType.Secondary,
								click: () => {
									this._viewModel.showLoginForm()
								},
							})
							: null,
						this._deleteCredentialsLinkVisible()
							? m(Button, {
								label: this._viewModel.displayMode === DisplayMode.DeleteCredentials ? "cancel_action" : "deleteCredentials_action",
								type: ButtonType.Secondary,
								click: () => this._switchDeleteCredentialsState(),
							})
							: null,
						this._knownCredentialsLinkVisible()
							? m(Button, {
								label: "knownCredentials_label",
								type: ButtonType.Secondary,
								click: () => this._viewModel.showCredentials(),
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
                const defaultButtons: ReadonlyArray<ButtonAttrs> = [
                    {
                        label: "light_label",
                        type: ButtonType.Dropdown,
                        click: () => themeController.setThemeId("light"),
                    },
                    {
                        label: "dark_label",
                        type: ButtonType.Dropdown,
                        click: () => themeController.setThemeId("dark"),
                    },
                    {
                        label: "blue_label",
                        type: ButtonType.Dropdown,
                        click: () => themeController.setThemeId("blue"),
                    },
                ]
                const customButtons = (await themeController.getCustomThemes()).map(themeId => {
                    return {
                        label: () => themeId,
                        type: ButtonType.Dropdown,
                        click: () => themeController.setThemeId(themeId),
                    }
                })
                return defaultButtons.concat(customButtons)
            }, width: 300
        })
	}

	_signupLinkVisible(): boolean {
		return this._viewModel.displayMode === DisplayMode.Form && (isTutanotaDomain() || getWhitelabelRegistrationDomains().length > 0)
	}

	_loginAnotherLinkVisible(): boolean {
		return this._viewModel.displayMode === DisplayMode.Credentials || this._viewModel.displayMode === DisplayMode.DeleteCredentials
	}

	_deleteCredentialsLinkVisible(): boolean {
		return this._viewModel.displayMode === DisplayMode.Credentials || this._viewModel.displayMode === DisplayMode.DeleteCredentials
	}

	_knownCredentialsLinkVisible(): boolean {
		return this._viewModel.displayMode === DisplayMode.Form && this._viewModel.getSavedCredentials().length > 0
	}

	_switchThemeLinkVisible(): boolean {
		return themeController.shouldAllowChangingTheme()
	}

	_recoverLoginVisible(): boolean {
		return isTutanotaDomain()
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
				oncreate: vnode => {
					const children = vnode.children as ChildArray
					const firstChild = children[0] as Vnode<unknown, LoginForm>
					this.loginForm.resolve(firstChild.state)
				},
			},
			m(LoginForm, {
				onSubmit: () => this._loginWithProgressDialog(),
				mailAddress: this._viewModel.mailAddress,
				password: this._viewModel.password,
				savePassword: this._viewModel.savePassword,
				helpText: lang.getMaybeLazy(this._viewModel.helpText),
				invalidCredentials: this._viewModel.state === LoginState.InvalidCredentials,
				showRecoveryOption: this._recoverLoginVisible(),
				accessExpired: this._viewModel.state === LoginState.AccessExpired,
			}),
		)
	}

	async _loginWithProgressDialog() {
		await showProgressDialog("login_msg", this._viewModel.login())
		m.redraw()

		if (this._viewModel.state === LoginState.LoggedIn) {
			m.route.set(this._requestedPath)
		}
	}

	_renderCredentialsSelector(): Children {
		return [
			m(".small.center.statusTextColor.pt" + liveDataAttrs(), lang.getMaybeLazy(this._viewModel.helpText)),
			m(CredentialsSelector, {
				credentials: this._viewModel.getSavedCredentials(),
				onCredentialsSelected: async c => {
					await this._viewModel.useCredentials(c)
					await this._loginWithProgressDialog()
				},
				onCredentialsDeleted:
					this._viewModel.displayMode === DisplayMode.DeleteCredentials
						? credentials => {
							this._viewModel.deleteCredentials(credentials).then(() => m.redraw())
						}
						: null,
			}),
		]
	}

	_renderAppButtons(): Children {
		return m(".flex-center.pt-l", [
			client.isDesktopDevice() || client.device === DeviceType.ANDROID
				? m(Button, {
					label: "appInfoAndroidImageAlt_alt",
					click: e => {
						this._openUrl("https://play.google.com/store/apps/details?id=de.tutao.tutanota")

						e.preventDefault()
					},
					icon: () => BootIcons.Android,
					type: ButtonType.ActionLarge,
				})
				: null,
			client.isDesktopDevice() || client.device === DeviceType.IPAD || client.device === DeviceType.IPHONE
				? m(Button, {
					label: "appInfoIosImageAlt_alt",
					click: e => {
						this._openUrl("https://itunes.apple.com/app/tutanota/id922429609?mt=8&uo=4&at=10lSfb")

						e.preventDefault()
					},
					icon: () => BootIcons.Apple,
					type: ButtonType.ActionLarge,
				})
				: null,
			client.isDesktopDevice() || client.device === DeviceType.ANDROID
				? m(Button, {
					label: "appInfoFDroidImageAlt_alt",
					click: e => {
						this._openUrl("https://f-droid.org/packages/de.tutao.tutanota/")

						e.preventDefault()
					},
					icon: () => BootIcons.FDroid,
					type: ButtonType.ActionLarge,
				})
				: null,
		])
	}

	updateUrl(args: Record<string, any>, requestedPath: string) {
		if (args.requestedPath) {
			this._requestedPath = args.requestedPath
		} else if (args.action) {
			// Action needs be forwarded this way in order to be able to deal with cases where a user is not logged in and clicks
			// on the support link on our website (https://mail.tutanota.com?action=supportMail)
			this._requestedPath = `/mail?action=${args.action}`
		} else {
			this._requestedPath = this._targetPath
		}

		this._handleLoginArguments(args)
	}

	async _handleLoginArguments(args: Record<string, any>) {
		const autoLogin = args.noAutoLogin == null || args.noAutoLogin === false

		if (autoLogin) {
			if (args.userId) {
				await this._viewModel.useUserId(args.userId)
			}

			if (this._viewModel.canLogin()) {
				this._loginWithProgressDialog()

				m.redraw()
				return
			}
		}

		if (args.loginWith) {
			this._viewModel.showLoginForm()
		}

		this._viewModel.mailAddress(args.loginWith ?? "")

		this._viewModel.password("")

		// We want to focus password field if login field is already filled in
		if (args.loginWith) {
			this.loginForm.promise.then((loginForm: LoginForm) => {
				loginForm.passwordTextField.domInput.focus()
			})
		}

		m.redraw()
	}

	_openUrl(url: string) {
		window.open(url, "_blank")
	}

	_switchDeleteCredentialsState(): void {
		this._viewModel.switchDeleteState()
	}
}

export function getWhitelabelRegistrationDomains(): string[] {
	return mapNullable(getWhitelabelCustomizations(window), c => c.registrationDomains) || []
}

export function getImprintLink(): string | null {
	return mapNullable(getWhitelabelCustomizations(window), c => c.imprintUrl) || InfoLink.About
}

export function getPrivacyStatementLink(): string | null {
	return mapNullable(getWhitelabelCustomizations(window), c => c.privacyStatementUrl) || InfoLink.Privacy
}

export function renderPrivacyAndImprintLinks(): Children {
	return m("div.center.flex.flex-grow.items-end.justify-center.mb-l.mt-xl.wrap", [
		getPrivacyStatementLink()
			? m(
				"a.plr",
				{
					href: getPrivacyStatementLink(),
					target: "_blank",
				},
				lang.get("privacyLink_label"),
			)
			: null,
		getImprintLink()
			? m(
				"a.plr",
				{
					href: getImprintLink(),
					target: "_blank",
				},
				lang.get("imprint_label"),
			)
			: null,
		m(".mt.center.small.full-width", `v${env.versionNumber}`),
	])
}