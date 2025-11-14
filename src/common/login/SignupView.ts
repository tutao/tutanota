import m, { Children, Vnode } from "mithril"
import { client } from "../misc/ClientDetector.js"
import { assertMainOrNode, isApp, isDesktop } from "../api/common/Env"
import { lang, TranslationKey } from "../misc/LanguageViewModel.js"
import { defer, DeferredObject, mapNullable } from "@tutao/tutanota-utils"
import { BootIcons } from "../gui/base/icons/BootIcons"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import { windowFacade } from "../misc/WindowFacade.js"
import { DeviceType } from "../misc/ClientConstants.js"
import { Button, ButtonType } from "../gui/base/Button.js"
import { AriaLandmarks, landmarkAttrs, liveDataAttrs } from "../gui/AriaUtils"
import { DisplayMode, LoginState, LoginViewModel } from "./LoginViewModel.js"
import { LoginForm } from "./LoginForm.js"
import { CredentialsSelector } from "./CredentialsSelector.js"
import { getWhitelabelCustomizations } from "../misc/WhitelabelCustomizations.js"
import { createAsyncDropdown, DropdownButtonAttrs } from "../gui/base/Dropdown.js"
import type { ClickHandler } from "../gui/base/GuiUtils"
import { IconButton } from "../gui/base/IconButton.js"
import { BaseTopLevelView } from "../gui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../TopLevelView.js"
import { LoginScreenHeader } from "../gui/LoginScreenHeader.js"
import { styles } from "../gui/styles.js"
import { locator } from "../api/main/CommonLocator.js"
import { renderInfoLinks } from "../gui/RenderLoginInfoLinks.js"
import { showSnackBar } from "../gui/base/SnackBar.js"
import { Wizard, WizardAttrs } from "../gui/base/wizard/Wizard"
import { WizardStep, WizardStepAttrs } from "../gui/base/wizard/WizardStep"
import { LoginButton } from "../gui/base/buttons/LoginButton"
import { px } from "../gui/size"
import { WizardController } from "../gui/base/wizard/WizardController"

assertMainOrNode()

export interface SignupViewAttrs extends TopLevelAttrs {
	/** Default path to redirect to after the login. Can be overridden with query param `requestedPath`. */
	targetPath: string
	makeViewModel: () => LoginViewModel
}

/** create a string provider that changes periodically until promise is resolved */
function makeDynamicLoggingInMessage(promise: Promise<unknown>): () => TranslationKey {
	const messageArray: Array<TranslationKey> = [
		"dynamicLoginDecryptingMails_msg",
		"dynamicLoginOrganizingCalendarEvents_msg",
		"dynamicLoginSortingContacts_msg",
		"dynamicLoginUpdatingOfflineDatabase_msg",
		"dynamicLoginCyclingToWork_msg",
		"dynamicLoginRestockingTutaFridge_msg",
		"dynamicLoginPreparingRocketLaunch_msg",
		"dynamicLoginSwitchingOnPrivacy_msg",
	]
	let currentMessage: TranslationKey = "login_msg"
	let messageIndex: number = 0
	const messageIntervalId = setInterval(() => {
		currentMessage = messageArray[messageIndex]
		messageIndex = ++messageIndex % 8
		m.redraw()
	}, 4000 /** spinner spins every 2s */)
	promise.finally(() => clearInterval(messageIntervalId))
	return () => currentMessage
}

export class SignupView extends BaseTopLevelView implements TopLevelView<SignupViewAttrs> {
	private readonly viewModel: LoginViewModel
	private readonly defaultRedirect: string
	private readonly initPromise: Promise<void>

	private moreExpanded: boolean
	// we save the login form because we need access to the password input field inside of it for when "loginWith" is set in the url,
	// in order to focus it
	private loginForm: DeferredObject<LoginForm>
	private selectedRedirect: string
	private bottomMargin = 0
	private wizardViewModel: WizardController

	constructor({ attrs }: Vnode<SignupViewAttrs>) {
		super()
		this.defaultRedirect = attrs.targetPath
		this.selectedRedirect = this.defaultRedirect

		this.loginForm = defer()
		this.moreExpanded = false
		this.viewModel = attrs.makeViewModel()
		this.initPromise = this.viewModel.init().then(m.redraw)
		this.wizardViewModel = new WizardController()
	}

	keyboardListener = (keyboardSize: number) => {
		this.bottomMargin = keyboardSize
		m.redraw()
	}

	onNewUrl(args: Record<string, any>, requestedPath: string) {}

	dummyComponent = (color: string, wizardController: WizardController) => {
		return m(
			"",
			{
				style: {
					"background-color": color,
					width: px(300),
					height: px(300),
				},
			},
			m(LoginButton, { label: "login_action", onclick: () => wizardController.next() }),
		)
	}

	view({ attrs }: Vnode<SignupViewAttrs>) {
		return m(
			"#login-view.main-view.flex.col.nav-bg",
			{
				oncreate: () => windowFacade.addKeyboardSizeListener(this.keyboardListener),
				onremove: () => windowFacade.removeKeyboardSizeListener(this.keyboardListener),
				style: {
					marginBottom: this.bottomMargin + "px",
				},
			},
			[
				m(Wizard, {
					steps: [
						{
							title: "hoge",
							main: this.dummyComponent("red", this.wizardViewModel),
							sub: this.dummyComponent("pink", this.wizardViewModel),
						},
						{
							title: "fuga",
							main: this.dummyComponent("yellow", this.wizardViewModel),
							sub: this.dummyComponent("green", this.wizardViewModel),
						},
					],
					controller: this.wizardViewModel,
					viewModel: new DummyClass(),
				} satisfies WizardAttrs<DummyClass>),
				renderInfoLinks(),
			],
		)
	}
}

class DummyClass {
	constructor() {}
}
