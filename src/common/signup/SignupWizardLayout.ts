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

export class SignupWizardLayout<TViewModel> implements Component<WizardLayoutAttrs<TViewModel>> {
	private lastSeenTransitionSeq = 0
	readonly infoBox = new SignupWizardInfoBoxController()
	readonly defaultItems: InfoBoxItem[] = [
		{ icon: Icons.PQLock, text: "Quantum-safe end-to-end encryption" },
		{ icon: BootIcons.Mail, text: "Green energy" },
		{ icon: Icons.Clipboard, text: "Ad-free" },
		{ icon: Icons.Download, text: "Open source" },
	]

	onTransition(from: number, to: number) {
		if (to === 0) {
			this.infoBox.setItems([
				{ icon: Icons.PQLock, text: "Quantum-safe end-to-end encryption" },
				{ icon: BootIcons.Mail, text: "Green energy" },
				{ icon: Icons.Clipboard, text: "Ad-free" },
				{ icon: Icons.Download, text: "Open source" },
			])
		} else if (to === 1) {
			this.infoBox.setItems([
				{ icon: BootIcons.Mail, text: "Green energy" },
				{ icon: Icons.PQLock, text: "Quantum-safe end-to-end encryption" },
				{ icon: Icons.Clipboard, text: "Ad-free" },
				{ icon: Icons.Download, text: "Open source" },
			])
		} else if (to === 2) {
			this.infoBox.setItems([
				{ icon: Icons.Clipboard, text: "Ad-free" },
				{ icon: BootIcons.Mail, text: "Green energy" },
				{ icon: Icons.PQLock, text: "Quantum-safe end-to-end encryption" },
				{ icon: Icons.Download, text: "Open source" },
			])
		} else if (to === 3) {
			this.infoBox.setItems([
				{ icon: BootIcons.Mail, text: "Green energy" },
				{ icon: Icons.Clipboard, text: "Ad-free" },
				{ icon: Icons.Download, text: "Open source" },
				{ icon: Icons.PQLock, text: "Quantum-safe end-to-end encryption" },
			])
		} else if (to === 4) {
			this.infoBox.setItems([
				{ icon: BootIcons.Mail, text: "Green energy" },
				{ icon: Icons.Download, text: "Open source" },
				{ icon: Icons.Clipboard, text: "Ad-free" },
				{ icon: Icons.PQLock, text: "Quantum-safe end-to-end encryption" },
			])
		}
	}

	onbeforeupdate(vnode: Vnode<WizardLayoutAttrs<TViewModel>>) {
		const { transitionSeq, transitionFrom, transitionTo } = vnode.attrs

		if (transitionSeq !== this.lastSeenTransitionSeq && transitionSeq > 0) {
			this.lastSeenTransitionSeq = transitionSeq
			this.onTransition(transitionFrom, transitionTo)
		}

		return true
	}

	view(vnode: Vnode<WizardLayoutAttrs<TViewModel>>) {
		const { showProgress, progressState, backButton, ctx } = vnode.attrs
		const { controller, index } = ctx
		const viewModel = ctx.viewModel as SignupViewModel

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
										path: `${window.tutao.appState.prefixWithoutFile}/images/dynamic-color-svg/signup-before-click.svg`,
									}),
									m(SignupWizardInfoBox, {
										controller: this.infoBox,
										initialItems: this.defaultItems,
										tickMs: 5,
									} satisfies SignupWizardInfoBoxAttrs),
								]),
							),
					]),
				],
			),
		)
	}
}
