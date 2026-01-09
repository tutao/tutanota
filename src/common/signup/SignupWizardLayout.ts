import m, { Component, Vnode } from "mithril"
import { WizardProgress } from "../gui/base/wizard/WizardProgress"
import { WizardLayoutAttrs } from "../gui/base/wizard/Wizard"
import { styles } from "../gui/styles"
import { component_size, layout_size, px, size } from "../gui/size"
import { SignupViewModel } from "./SignupView"
import { DynamicColorSvg } from "../gui/base/DynamicColorSvg"
import { InfoBoxItem, SignupWizardInfoBox, SignupWizardInfoBoxAttrs, SignupWizardInfoBoxController } from "./components/SignupWizardInfoBox"
import { Icons } from "../gui/base/icons/Icons"
import { lang } from "../misc/LanguageViewModel"
import { SignupInlinePlanSelector } from "./components/SignupInlinePlanSelector"
import { DefaultAnimationTime } from "../gui/animation/Animations"
import { WizardProgressCircular } from "../gui/base/wizard/WizardProgressCircular"
import { getTutaLogo, getTutaLogoSignetSvg } from "../gui/base/Logo"
import { LanguageDropdown } from "../gui/LanguageDropdown"
import { theme } from "../gui/theme"
import { getSafeAreaInsetTop } from "../gui/HtmlUtils"
import { PlanTypeToName } from "../api/common/TutanotaConstants"

const INFO_BOX_TRANSITION_MS = 500
const SIGNUP_PROGRESS_LABEL_MAX_LENGTH = 24

class SignupWizardLayout<TViewModel> implements Component<WizardLayoutAttrs<TViewModel>> {
	private lastSeenTransitionSeq = 0
	readonly infoBox = new SignupWizardInfoBoxController()
	private readonly seeOtherPlansLabel = lang.makeTranslation("seeOtherPlans_action", "See other plans")
	readonly defaultItems: InfoBoxItem[] = [
		{ icon: { icon: Icons.PQLock, color: theme.success }, text: "Quantum-safe end-to-end encryption" },
		{ icon: { icon: Icons.PQLock, color: theme.error }, text: "Quantum-safe end-to-end encryption" },
		{ icon: { icon: Icons.PQLock, color: theme.success }, text: "Quantum-safe end-to-end encryption" },
		{ icon: { icon: Icons.PQLock, color: theme.error }, text: "Quantum-safe end-to-end encryption" },
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
		const showIllustration = styles.bodyWidth >= layout_size.wizard_show_illustration_min_width && !viewModel.options.businessUse()
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
		const isBusinessPlanSelector = viewModel.options.businessUse() && index === 0
		const hideProgressColumn = isBusinessPlanSelector
		const progressColumnStyle =
			styles.isMobileLayout() || hideProgressColumn
				? undefined
				: {
						width: px(showProgressLabels ? layout_size.wizard_progress_width : component_size.button_icon_bg_size),
						"min-width": px(showProgressLabels ? layout_size.wizard_progress_width : component_size.button_icon_bg_size),
						"flex-shrink": "0",
						"justify-content": "end",
					}
		const contentColumnStyle =
			!styles.isMobileLayout() && !showIllustration && !isBusinessPlanSelector ? { "max-width": px(layout_size.wizard_content_max_width) } : undefined
		return m(
			`.flex.col.space-between.full-width.${styles.isMobileLayout() ? "" : "height-100p"}`,
			{
				style: {
					margin: styles.isMobileLayout() ? `${px(size.spacing_24)} 0` : "auto",
					"max-height": px(layout_size.wizard_max_height),
					"max-width": px(layout_size.wizard_max_width),
					flex: "fit-content",
					"padding-top": px(getSafeAreaInsetTop()),
				},
			},
			m(
				`.flex.height-100p.flex-grow.full-width${styles.isMobileLayout() ? ".col.gap-8" : ".gap-32"}`,
				{
					style: {
						"padding-inline": "5vw",
						"padding-block": styles.isMobileLayout() ? undefined : "7vh",
					},
				},
				[
					!hideProgressColumn &&
						m(
							`.flex.${!styles.isMobileLayout() ? "flex-column" : "row-reverse.items-center"}.flex-space-between`,
							{ style: progressColumnStyle, flex: "none" },
							[
								showProgress &&
									(!styles.isMobileLayout()
										? m(WizardProgress, {
												progressState,
												labelMaxLength: SIGNUP_PROGRESS_LABEL_MAX_LENGTH,
												onClick: (index) => {
													if (index < 3) {
														controller.setStepUnreachable(3)
													}
													this.onTransition(viewModel, controller.currentStep, index)
													controller.setStep(index)
												},
											})
										: m(WizardProgressCircular, {
												progressState,
												onClick: (index) => {
													if (index < 3) {
														controller.setStepUnreachable(3)
													}
													this.onTransition(viewModel, controller.currentStep, index)
													controller.setStep(index)
												},
												size: 44,
												lineWidth: 3,
											})),
								m(
									"",
									{
										style: {
											height: px(component_size.button_height),
											"margin-right": "auto",
										},
									},
									backButton,
								),
							],
						),
					m(".flex.gap-64.full-width.flex-grow", [
						m(
							`.flex.flex-grow${styles.isMobileLayout() ? ".col-reverse" : ".col"}`,
							{ style: contentColumnStyle },

							m(`.wizard-page.flex.height-100p.full-width${controller.isInTransition ? ".wizard-page-transition" : ""}`, vnode.children),
							isBusinessPlanSelector &&
								m(
									"",
									{
										style: {
											height: px(component_size.button_height),
											"margin-right": "auto",
										},
									},
									backButton,
								),
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
											ctx.controller.setStepLabel(0, PlanTypeToName[viewModel.targetPlanType])
										},
									}),
								),
								m(".rel", { style: { "max-width": px(400), "margin-inline": "auto", ...infoPanelStyle } }, [
									m(DynamicColorSvg, {
										path: this.getIllustrationPath(illustrationName),
									}),
									index !== 4 && // not show info box for recovery kit page
										m(SignupWizardInfoBox, {
											controller: this.infoBox,
											initialItems: this.defaultItems,
											transitionMs: 1000,
											buttonLabel: canTogglePlanSelector ? this.seeOtherPlansLabel : undefined,
											onClickButton: canTogglePlanSelector
												? () => {
														viewModel.inlinePlanSelectorOpen(true)
													}
												: undefined,
										} satisfies SignupWizardInfoBoxAttrs),
								]),
							]),
					]),
				],
			),
			m(
				`.flex.gap-32.${styles.isMobileLayout() ? "justify-between" : "justify-center"}.items-center.w-full`,
				{ style: { "margin-inline": px(size.spacing_24), "padding-block": px(size.spacing_16), flex: "none" } },
				[
					m(
						"",
						{ style: { height: px(32), width: styles.isMobileLayout() ? px(32) : px(90) } },
						m.trust(styles.isMobileLayout() ? getTutaLogoSignetSvg() : getTutaLogo()),
					),
					m(LanguageDropdown, { variant: "Link" }),
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

export default SignupWizardLayout
