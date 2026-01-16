import m, { Component, Vnode } from "mithril"
import { WizardProgress } from "../gui/base/wizard/WizardProgress"
import { WizardLayoutAttrs } from "../gui/base/wizard/Wizard"
import { styles } from "../gui/styles"
import { component_size, layout_size, px, size } from "../gui/size"
import { SignupViewModel } from "./SignupView"
import { DynamicColorSvg } from "../gui/base/DynamicColorSvg"
import { InfoBoxItem, SignupWizardInfoBoxController, SignupWizardInfoList } from "./components/SignupWizardInfoList"
import { Icons } from "../gui/base/icons/Icons"
import { lang } from "../misc/LanguageViewModel"
import { SignupInlinePlanSelector } from "./components/SignupInlinePlanSelector"
import { DefaultAnimationTime } from "../gui/animation/Animations"
import { WizardProgressCircular } from "../gui/base/wizard/WizardProgressCircular"
import { getTutaLogo, getTutaLogoSignetSvg } from "../gui/base/Logo"
import { LanguageDropdown } from "../gui/LanguageDropdown"
import { theme } from "../gui/theme"
import { getSafeAreaInsetTop } from "../gui/HtmlUtils"
import { AvailablePlanType, PlanType, PlanTypeToName } from "../api/common/TutanotaConstants"
import { LoginButton } from "../gui/base/buttons/LoginButton"
import { BootIcons } from "../gui/base/icons/BootIcons"
import { shouldFixButtonPosition } from "../subscription/utils/PlanSelectorUtils"
import { windowFacade } from "../misc/WindowFacade"

const INFO_BOX_TRANSITION_MS = 500
const SIGNUP_PROGRESS_LABEL_MAX_LENGTH = 24
const CHECK_INFO_ICON = { icon: Icons.Checkmark, color: theme.success }
const CROSS_INFO_ICON = { icon: Icons.XCross, color: theme.error }

class SignupWizardLayout<TViewModel> implements Component<WizardLayoutAttrs<TViewModel>> {
	private lastSeenTransitionSeq = 0
	readonly infoBox = new SignupWizardInfoBoxController()

	private readonly seeOtherPlansLabel = lang.makeTranslation("seeOtherPlans_action", "See other plans")
	readonly planSelectorInfoItems: InfoBoxItem[] = [
		{ icon: { icon: Icons.PQLockOutline, color: theme.on_surface_variant }, text: lang.getTranslationText("quantumSafeE2ee_label") },
		{ icon: { icon: Icons.LeafOutline, color: theme.on_surface_variant }, text: lang.getTranslationText("greenEnergy_label") },
		{ icon: { icon: Icons.StopHandOutline, color: theme.on_surface_variant }, text: lang.getTranslationText("adFree_label") },
		{ icon: { icon: Icons.OpenSourceOutline, color: theme.on_surface_variant }, text: lang.getTranslationText("openSource_label") },
	]
	readonly formPageInfoItems: Record<AvailablePlanType, InfoBoxItem[]> = {
		[PlanType.Free]: [
			{ icon: CHECK_INFO_ICON, text: lang.getTranslation("pricing.comparisonStorage_msg", { "{amount}": 1 }).text },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslationText("onlyOneFreeAccount_msg") },
			{ icon: CROSS_INFO_ICON, text: lang.getTranslationText("noExtraAddress_msg") },
			{ icon: CROSS_INFO_ICON, text: lang.getTranslationText("deleteAccountAfter6Month_msg") },
		],
		[PlanType.Revolutionary]: [
			{ icon: CHECK_INFO_ICON, text: lang.getTranslation("pricing.comparisonStorage_msg", { "{amount}": 20 }).text },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslation("pricing.mailAddressAliasesShort_label", { "{amount}": 15 }).text },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslation("pricing.comparisonCustomDomains_msg", { "{amount}": 3 }).text },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslationText("pricing.family_label") },
			{ icon: CROSS_INFO_ICON, text: lang.getTranslationText("mailImportSettings_label") },
		],
		[PlanType.Legend]: [
			{ icon: CHECK_INFO_ICON, text: lang.getTranslation("pricing.comparisonStorage_msg", { "{amount}": 500 }).text },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslation("pricing.mailAddressAliasesShort_label", { "{amount}": 30 }).text },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslation("pricing.comparisonCustomDomains_msg", { "{amount}": 10 }).text },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslationText("pricing.family_label") },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslationText("mailImportSettings_label") },
		],
		[PlanType.Essential]: [
			{ icon: CHECK_INFO_ICON, text: lang.getTranslation("pricing.comparisonStorage_msg", { "{amount}": 50 }).text },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslation("pricing.mailAddressAliasesShort_label", { "{amount}": 15 }).text },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslation("pricing.comparisonCustomDomains_msg", { "{amount}": 3 }).text },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslationText("pricing.comparisonSupportPremium_msg") },
			{ icon: CROSS_INFO_ICON, text: lang.getTranslationText("mailImportSettings_label") },
			{ icon: CROSS_INFO_ICON, text: lang.getTranslationText("whitelabel_msg") },
		],
		[PlanType.Advanced]: [
			{ icon: CHECK_INFO_ICON, text: lang.getTranslation("pricing.comparisonStorage_msg", { "{amount}": 500 }).text },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslation("pricing.mailAddressAliasesShort_label", { "{amount}": 30 }).text },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslation("pricing.comparisonCustomDomains_msg", { "{amount}": 10 }).text },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslationText("pricing.comparisonSupportPro_msg") },
			{ icon: CROSS_INFO_ICON, text: lang.getTranslationText("mailImportSettings_label") },
			{ icon: CROSS_INFO_ICON, text: lang.getTranslationText("whitelabel_msg") },
		],
		[PlanType.Unlimited]: [
			{ icon: CHECK_INFO_ICON, text: lang.getTranslation("pricing.comparisonStorage_msg", { "{amount}": 1000 }).text },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslation("pricing.mailAddressAliasesShort_label", { "{amount}": 30 }).text },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslationText("pricing.comparisonUnlimitedDomains_msg") },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslationText("pricing.comparisonSupportPro_msg") },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslationText("mailImportSettings_label") },
			{ icon: CHECK_INFO_ICON, text: lang.getTranslationText("whitelabel_msg") },
		],
	}
	readonly paymentInfoItems: InfoBoxItem[] = [
		{ icon: { icon: Icons.CreditCard, color: theme.on_surface_variant }, text: lang.getTranslationText("safePayment_label") },
		{ icon: { icon: Icons.Reply, color: theme.on_surface_variant }, text: lang.getTranslationText("moneyBackGuarantee_msg") },
		{ icon: { icon: Icons.CloseCircleFilled, color: theme.on_surface_variant }, text: lang.getTranslationText("cancelAnyTime_msg") },
		{ icon: { icon: BootIcons.User, color: theme.on_surface_variant }, text: lang.getTranslationText("directSupport_msg") },
	]
	private infoItems: InfoBoxItem[] = this.planSelectorInfoItems
	private transitionIllustrationName: string | null = null
	private transitionTimer: number | null = null
	private readonly stepIllustrations = [
		"signup-before-click.svg",
		"signup-before-click.svg",
		"signup-before-click.svg",
		"signup-before-click.svg",
		"signup-key.svg",
	]
	private readonly stepInfoBoxItems = (planType: PlanType): InfoBoxItem[][] => {
		return [this.planSelectorInfoItems, this.formPageInfoItems[planType as AvailablePlanType], this.paymentInfoItems]
	}
	private shouldFixButtonPos: boolean = false

	private updateInfoItems(viewModel: SignupViewModel, step: number) {
		const nextItems = this.getInfoBoxItemsForStep(step, viewModel.targetPlanType)
		this.infoBox.setItems(nextItems)
		this.infoItems = nextItems
	}

	onTransition(viewModel: SignupViewModel, _from: number, to: number) {
		if (!this.isInlinePlanSelectorToggleEnabled(viewModel, to)) viewModel.inlinePlanSelectorOpen(false)
		this.startIllustrationTransition()
		this.updateInfoItems(viewModel, to)
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

	oncreate() {
		this.handleResize()
		windowFacade.addResizeListener(this.handleResize)
	}

	onremove() {
		windowFacade.removeResizeListener(this.handleResize)
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
											this.updateInfoItems(viewModel, controller.currentStep)
										},
									}),
								),
								m(".rel", { style: { "max-width": px(400), "margin-inline": "auto", ...infoPanelStyle } }, [
									m(DynamicColorSvg, {
										path: this.getIllustrationPath(illustrationName),
									}),
									index <= 2 && // not show info box after the confirmation page
										m(
											".abs.border-radius-16.flex.col.gap-16.plr-24.pt-24.pb-24",
											{
												style: {
													width: "100%",
													"background-color": theme.surface_container_high,
													top: px(380),
												},
											},
											m(
												".flex.col.gap-16",
												m(SignupWizardInfoList, {
													controller: this.infoBox,
													initialItems: this.infoItems,
													transitionMs: 1000,
												}),
											),
											canTogglePlanSelector &&
												m(
													"",
													m(LoginButton, {
														label: this.seeOtherPlansLabel,
														onclick: () => {
															viewModel.inlinePlanSelectorOpen(true)
														},
														size: "md",
														width: "flex",
														style: {
															"background-color": theme.secondary_container,
															color: theme.on_secondary_container,
															"margin-inline": "auto",
														},
													}),
												),
										),
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
			ctx.controller.currentStep === 0 && this.shouldFixButtonPos && m("", { style: { "padding-top": px(72) } }),
		)
	}

	private getInfoBoxItemsForStep(step: number, planType: PlanType): InfoBoxItem[] {
		const infoBoxes = this.stepInfoBoxItems(planType)
		return infoBoxes[step] ?? infoBoxes[0] ?? this.planSelectorInfoItems
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

	private readonly handleResize = () => {
		this.shouldFixButtonPos = shouldFixButtonPosition()
	}
}

export default SignupWizardLayout
