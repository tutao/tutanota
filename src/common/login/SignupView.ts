import m, { Vnode } from "mithril"
import { assertMainOrNode } from "../api/common/Env"
import { TranslationKey } from "../misc/LanguageViewModel.js"
import { defer, DeferredObject } from "@tutao/tutanota-utils"
import { windowFacade } from "../misc/WindowFacade.js"
import { LoginViewModel } from "./LoginViewModel.js"
import { LoginForm } from "./LoginForm.js"
import { BaseTopLevelView } from "../gui/BaseTopLevelView.js"
import { TopLevelAttrs, TopLevelView } from "../../TopLevelView.js"
import { renderInfoLinks } from "../gui/RenderLoginInfoLinks.js"
import { Wizard, WizardAttrs } from "../gui/base/wizard/Wizard"
import { LoginButton } from "../gui/base/buttons/LoginButton"
import { px } from "../gui/size"
import { WizardController } from "../gui/base/wizard/WizardController"
import { WizardStepAttrs } from "../gui/base/wizard/WizardStep"
import { SingleLineTextField, SingleLineTextFieldAttrs } from "../gui/base/SingleLineTextField"
import { TextFieldType } from "../gui/base/TextField"

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

	private readonly wizardController: WizardController
	private readonly wizardViewModel: DummyClass

	constructor({ attrs }: Vnode<SignupViewAttrs>) {
		super()
		this.defaultRedirect = attrs.targetPath
		this.selectedRedirect = this.defaultRedirect

		this.loginForm = defer()
		this.moreExpanded = false
		this.viewModel = attrs.makeViewModel()
		this.initPromise = this.viewModel.init().then(m.redraw)

		this.wizardController = new WizardController(["Step 1", "Step 2", "Step 3", "Step 4", "Step 5", "Step 6"])
		this.wizardViewModel = new DummyClass()
	}

	keyboardListener = (keyboardSize: number) => {
		this.bottomMargin = keyboardSize
		m.redraw()
	}

	onNewUrl(args: Record<string, any>, requestedPath: string) {}

	private makeMainStep(color: string, defaultLabel: string): WizardStepAttrs<DummyClass>["main"] {
		return (ctx) =>
			m(
				".flex.col",
				{
					style: {
						backgroundColor: color,
						width: px(300),
						height: px(300),
						padding: px(8),
					},
				},
				[
					m("div", `Main content for ${defaultLabel} (step ${ctx.index + 1})`),
					m(SingleLineTextField, {
						oninput: (newValue) => {
							ctx.setLabel(newValue || defaultLabel)
						},
						value: ctx.getLabel(),
						ariaLabel: "",
						type: TextFieldType.Text,
					} satisfies SingleLineTextFieldAttrs<any>),
					m(
						".mt-m",
						m(LoginButton, {
							label: ctx.controller.stepCount === ctx.index + 1 ? "previous_action" : "next_action",
							onclick: () => {
								if (ctx.controller.stepCount === ctx.index + 1) {
									ctx.controller.prev()
								} else {
									ctx.markComplete(true)
									ctx.controller.next()
								}
							},
						}),
					),
				],
			)
	}

	private makeSubStep(color: string, text: string): WizardStepAttrs<DummyClass>["sub"] {
		return () =>
			m(
				"",
				{
					style: {
						backgroundColor: color,
						width: px(300),
						height: px(300),
						marginLeft: px(16),
						padding: px(8),
					},
				},
				text,
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
							title: "Step 1",
							main: this.makeMainStep("red", "Step 1"),
							sub: this.makeSubStep("pink", "Sub content for step 1"),
						},
						{
							title: "Step 2",
							main: this.makeMainStep("yellow", "Step 2"),
							sub: this.makeSubStep("green", "Sub content for step 2"),
						},
						{
							title: "Step 3",
							main: this.makeMainStep("green", "Step 3"),
							sub: this.makeSubStep("blue", "Sub content for step 3"),
						},

						{
							title: "Step 4",
							main: this.makeMainStep("green", "Step 3"),
							sub: this.makeSubStep("blue", "Sub content for step 3"),
						},

						{
							title: "Step 5",
							main: this.makeMainStep("green", "Step 3"),
							sub: this.makeSubStep("blue", "Sub content for step 3"),
						},

						{
							title: "Step 6",
							main: this.makeMainStep("green", "Step 3"),
							sub: this.makeSubStep("blue", "Sub content for step 3"),
						},
					],
					controller: this.wizardController,
					viewModel: this.wizardViewModel,
				} satisfies WizardAttrs<DummyClass>),
				renderInfoLinks(),
			],
		)
	}
}

class DummyClass {
	constructor() {}
}
