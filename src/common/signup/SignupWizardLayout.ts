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

const INFO_BOX_TRANSITION_MS = 500

export class SignupWizardLayout<TViewModel> implements Component<WizardLayoutAttrs<TViewModel>> {
	private lastSeenTransitionSeq = 0
	readonly infoBox = new SignupWizardInfoBoxController()
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

	onTransition(_from: number, to: number) {
		const nextItems = this.getInfoBoxItemsForStep(to)
		this.startIllustrationTransition()
		this.infoBox.setItems(nextItems)
	}

	onbeforeupdate(vnode: Vnode<WizardLayoutAttrs<TViewModel>>) {
		const { transitionSeq, transitionFrom, transitionTo } = vnode.attrs

		if (transitionSeq !== this.lastSeenTransitionSeq && transitionSeq > 0) {
			this.lastSeenTransitionSeq = transitionSeq
			this.onTransition(transitionFrom, transitionTo)
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
					m(".flex.flex-column.flex-space-between", [
						!styles.isMobileLayout() &&
							showProgress &&
							m(WizardProgress, {
								progressState,
								onClick: (index) => {
									if (index < 3) {
										controller.setStepUnreachable(3)
									}
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
							m(`.wizard-page.flex.height-100p.full-width${controller.isInTransition ? ".wizard-page-transition" : ""}`, vnode.children),
						),

						styles.bodyWidth >= 1500 &&
							!viewModel.options.businessUse() &&
							m(
								".flex-grow.align-self-center",
								m(".rel", { style: { "max-width": px(400), "margin-inline": "auto" } }, [
									m(DynamicColorSvg, {
										path: this.getIllustrationPath(illustrationName),
									}),
									m(SignupWizardInfoBox, {
										controller: this.infoBox,
										initialItems: this.defaultItems,
									} satisfies SignupWizardInfoBoxAttrs),
								]),
							),
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
