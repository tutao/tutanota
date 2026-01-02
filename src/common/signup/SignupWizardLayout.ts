import m, { Component, Vnode } from "mithril"
import { WizardProgress } from "../gui/base/wizard/WizardProgress"
import { WizardLayoutAttrs } from "../gui/base/wizard/Wizard"
import { styles } from "../gui/styles"
import { component_size, layout_size, px, size } from "../gui/size"
import { SignupViewModel } from "./SignupView"
import { DynamicColorSvg } from "../gui/base/DynamicColorSvg"
import { InfoBoxItem, SignupWizardInfoBox, SignupWizardInfoBoxAttrs, SignupWizardInfoBoxController } from "./components/SignupWizardInfoBox"
import { Icons } from "../gui/base/icons/Icons"
import { BootIcons } from "../gui/base/icons/BootIcons"
import { LoginButton } from "../gui/base/buttons/LoginButton"
import { lang } from "../misc/LanguageViewModel"
import { SignupInlinePlanSelector } from "./components/SignupInlinePlanSelector"
import { DefaultAnimationTime } from "../gui/animation/Animations"

const INFO_BOX_TRANSITION_MS = 500
const SIGNUP_PROGRESS_LABEL_MAX_LENGTH = 24

export class SignupWizardLayout<TViewModel> implements Component<WizardLayoutAttrs<TViewModel>> {
	private lastSeenTransitionSeq = 0
	readonly infoBox = new SignupWizardInfoBoxController()
	private readonly seeOtherPlansLabel = lang.makeTranslation("seeOtherPlans_action", "See other plans")
	readonly defaultItems: InfoBoxItem[] = [
		{ icon: Icons.PQLock, text: "Quantum-safe end-to-end encryption" },
		{ icon: BootIcons.Mail, text: "Green energy" },
		{ icon: Icons.Clipboard, text: "Ad-free" },
		{ icon: Icons.Download, text: "Open source" },
	]
	private transitionIllustrationName: string | null = null
	private transitionTimer: number | null = null
	private readonly stepIllustrations = [
		"signup-before-click.svg",
		"signup-before-click.svg",
		"signup-before-click.svg",
		"signup-before-click.svg",
		"signup-key.svg",
	]
	private readonly stepInfoBoxItems: InfoBoxItem[][] = [this.defaultItems, this.defaultItems, this.defaultItems, this.defaultItems, this.defaultItems]

	onTransition(viewModel: SignupViewModel, _from: number, to: number) {
		if (!this.isInlinePlanSelectorToggleEnabled(viewModel, to)) viewModel.inlinePlanSelectorOpen(false)
		const nextItems = this.getInfoBoxItemsForStep(to)
		this.startIllustrationTransition()
		this.infoBox.setItems(nextItems)
	}

	onbeforeupdate(vnode: Vnode<WizardLayoutAttrs<TViewModel>>) {
		const { transitionSeq, transitionFrom, transitionTo } = vnode.attrs

		if (transitionSeq !== this.lastSeenTransitionSeq && transitionSeq > 0) {
			this.lastSeenTransitionSeq = transitionSeq
			const viewModel = vnode.attrs.ctx.viewModel as SignupViewModel
			this.onTransition(viewModel, transitionFrom, transitionTo)
		}

		return true
	}

	onremove() {
		this.clearIllustrationTimer()
		this.transitionIllustrationName = null
	}

	view(vnode: Vnode<WizardLayoutAttrs<TViewModel>>) {
		const { showProgress, progressState, backButton, ctx } = vnode.attrs
		const { controller, index } = ctx
		const viewModel = ctx.viewModel as SignupViewModel
		const illustrationName = this.transitionIllustrationName ?? this.getStepIllustrationName(index)
		const showIllustration = styles.bodyWidth >= 1500 && !viewModel.options.businessUse()
		const canTogglePlanSelector = showIllustration && this.isInlinePlanSelectorToggleEnabled(viewModel, index)
		const showPlanSelector = canTogglePlanSelector && viewModel.inlinePlanSelectorOpen()
		const panelTransitionMs = Math.round(DefaultAnimationTime * 1.5)
		const panelTransition = `opacity ${panelTransitionMs}ms ease-out, transform ${panelTransitionMs}ms ease-out`
		const infoPanelStyle = {
			opacity: showPlanSelector ? 0 : 1,
			transform: showPlanSelector ? `translateX(${px(-size.spacing_32)})` : "translateX(0)",
			"max-height": showPlanSelector ? "0" : px(800),
			overflow: showPlanSelector ? "hidden" : "visible",
			transition: panelTransition,
			"will-change": "opacity, transform",
			"pointer-events": showPlanSelector ? "none" : "auto",
		}
		const selectorPanelStyle = {
			opacity: showPlanSelector ? 1 : 0,
			transform: showPlanSelector ? "translateX(0)" : `translateX(${px(size.spacing_32)})`,
			"max-height": showPlanSelector ? px(1400) : "0",
			overflow: "hidden",
			transition: panelTransition,
			"will-change": "opacity, transform",
			"pointer-events": showPlanSelector ? "auto" : "none",
		}
		const showProgressLabels = !styles.isSingleColumnLayout()
		const progressColumnStyle = styles.isMobileLayout()
			? undefined
			: {
					width: px(showProgressLabels ? layout_size.wizard_progress_width : component_size.button_icon_bg_size),
					"min-width": px(showProgressLabels ? layout_size.wizard_progress_width : component_size.button_icon_bg_size),
					"flex-shrink": "0",
				}
		const contentColumnStyle = !styles.isMobileLayout() && !showIllustration ? { "max-width": px(layout_size.wizard_content_max_width) } : undefined

		return m(
			`.full-width.${styles.isMobileLayout() ? "" : "height-100p"}`,
			{
				style: {
					margin: styles.isMobileLayout() ? `${px(size.spacing_24)} 0` : "auto",
					"max-height": px(layout_size.wizard_max_height),
					"max-width": px(layout_size.wizard_max_width),
				},
			},
			m(
				`.flex.height-100p.full-width${styles.isMobileLayout() ? ".col.gap-8" : ".gap-32"}`,
				{
					style: {
						"padding-inline": "5vw",
						"padding-block": styles.isMobileLayout() ? undefined : "7vh",
					},
				},
				[
					m(".flex.flex-column.flex-space-between", { style: progressColumnStyle }, [
						!styles.isMobileLayout() &&
							showProgress &&
							m(WizardProgress, {
								progressState,
								labelMaxLength: SIGNUP_PROGRESS_LABEL_MAX_LENGTH,
								onClick: (index) => {
									if (index < 3) {
										controller.setStepUnreachable(3)
									}
									this.onTransition(viewModel, controller.currentStep, index)
									controller.setStep(index)
								},
							}),

						m(
							"",
							{
								style: {
									height: px(component_size.button_height),
									"margin-inline": showProgress ? "initial" : "auto",
								},
							},
							backButton,
						),
					]),
					m(".flex.gap-64.full-width", [
						m(
							".flex-grow",
							{ style: contentColumnStyle },
							m(`.wizard-page.flex.height-100p.full-width${controller.isInTransition ? ".wizard-page-transition" : ""}`, vnode.children),
						),

						showIllustration &&
							m(".flex-grow", { style: { alignSelf: "flex-start" } }, [
								m(
									".flex.flex-column.gap-16",
									{ style: { "max-width": px(420), "margin-inline": "auto", width: "100%", ...selectorPanelStyle } },
									m(SignupInlinePlanSelector, {
										viewModel,
										onPlanSelected: () => {
											viewModel.inlinePlanSelectorOpen(false)
										},
									}),
								),
								m(".rel", { style: { "max-width": px(400), "margin-inline": "auto", ...infoPanelStyle } }, [
									m(DynamicColorSvg, {
										path: this.getIllustrationPath(illustrationName),
									}),
									m(SignupWizardInfoBox, {
										controller: this.infoBox,
										initialItems: this.defaultItems,
									} satisfies SignupWizardInfoBoxAttrs),
									canTogglePlanSelector &&
										m(
											".abs.flex.justify-center",
											{
												style: {
													left: 0,
													right: 0,
													bottom: 0,
													transform: "translateY(50%)",
													"padding-inline": px(size.spacing_16),
												},
											},
											m(LoginButton, {
												label: this.seeOtherPlansLabel,
												onclick: () => {
													viewModel.inlinePlanSelectorOpen(true)
												},
												size: "sm",
												width: "flex",
											}),
										),
								]),
							]),
					]),
				],
			),
		)
	}

	private getInfoBoxItemsForStep(step: number): InfoBoxItem[] {
		return this.stepInfoBoxItems[step] ?? this.stepInfoBoxItems[0] ?? this.defaultItems
	}

	private getStepIllustrationName(step: number): string {
		return this.stepIllustrations[step] ?? this.stepIllustrations[0] ?? "signup-before-click.svg"
	}

	private getIllustrationPath(name: string): string {
		return `${window.tutao.appState.prefixWithoutFile}/images/dynamic-color-svg/${name}`
	}

	private isInlinePlanSelectorToggleEnabled(viewModel: SignupViewModel, step: number): boolean {
		const enabledSteps = viewModel.inlinePlanSelectorToggleSteps ?? []
		return enabledSteps.includes(step)
	}

	private startIllustrationTransition() {
		this.clearIllustrationTimer()
		this.transitionIllustrationName = "signup-click.svg"
		this.transitionTimer = window.setTimeout(() => {
			this.transitionIllustrationName = null
			this.transitionTimer = null
			m.redraw()
		}, INFO_BOX_TRANSITION_MS)
	}

	private clearIllustrationTimer() {
		if (this.transitionTimer !== null) {
			window.clearTimeout(this.transitionTimer)
			this.transitionTimer = null
		}
	}
}
