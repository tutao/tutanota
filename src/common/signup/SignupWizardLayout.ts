import m, { Component, Vnode } from "mithril"
import { WizardProgress } from "../gui/base/wizard/WizardProgress"
import { WizardLayoutAttrs } from "../gui/base/wizard/Wizard"
import { styles } from "../gui/styles"
import { component_size, layout_size, px, size } from "../gui/size"
import { SignupViewModel } from "./SignupView"
import { DynamicColorSvg } from "../gui/base/DynamicColorSvg"
import { theme } from "../gui/theme"
import { Icon, IconSize } from "../gui/base/Icon"
import { Icons } from "../gui/base/icons/Icons"
import { BootIcons } from "../gui/base/icons/BootIcons"

export class SignupWizardLayout<TViewModel> implements Component<WizardLayoutAttrs<TViewModel>> {
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

						!styles.isMobileLayout() &&
							!viewModel.options.businessUse() &&
							m(
								".flex-grow.align-self-center",
								m(".rel", { style: { "max-width": px(400), "margin-inline": "auto" } }, [
									m(DynamicColorSvg, {
										path: `${window.tutao.appState.prefixWithoutFile}/images/dynamic-color-svg/signup-before-click.svg`,
									}),
									m(
										".abs.border-radius-16.flex.col.gap-16.plr-24.pt-24.pb-24",
										{
											style: {
												width: "100%",
												"background-color": theme.surface_container_high,
												bottom: 0,
											},
										},
										[
											m(".flex.row.gap-8", [
												m(Icon, { icon: Icons.PQLock, size: IconSize.PX24 }),
												m("span", "Quantum-safe end-to-end encryption"),
											]),
											m(".flex.row.gap-8", [m(Icon, { icon: BootIcons.Mail, size: IconSize.PX24 }), m("span", "Green energy")]),
											m(".flex.row.gap-8", [m(Icon, { icon: Icons.Clipboard, size: IconSize.PX24 }), m("span", "Ad-free")]),
											m(".flex.row.gap-8", [m(Icon, { icon: Icons.Download, size: IconSize.PX24 }), m("span", "Open source")]),
										],
									),
								]),
							),
					]),
				],
			),
		)
	}
}
