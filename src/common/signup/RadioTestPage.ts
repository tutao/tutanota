import m, { ClassComponent, Vnode } from "mithril"
import { WizardStepComponentAttrs } from "../gui/base/wizard/WizardStep"
import { SignupViewModel } from "./SignupView"
import { LoginButton, SecondaryButton, TertiaryButton } from "../gui/base/buttons/LoginButton"
import { lang } from "../misc/LanguageViewModel"
import { px, size } from "../gui/size"
import { theme } from "../gui/theme"
import { RadioSelectorOption } from "../gui/base/RadioSelectorItem"
import { LoginTextField } from "../gui/base/LoginTextField"
import { Icons } from "../gui/base/icons/Icons"
import { RadioSelector, RadioSelectorAttrs } from "../gui/base/RadioSelector"

export class RadioTestPage implements ClassComponent<WizardStepComponentAttrs<SignupViewModel>> {
	private currentOption = 0
	view(vnode: Vnode<WizardStepComponentAttrs<SignupViewModel>>) {
		const ctx = vnode.attrs.ctx

		const boxAttr = { style: { width: px(400), height: px(500), background: theme.primary_container, padding: size.spacing_16 } }
		const options: ReadonlyArray<RadioSelectorOption<number>> = [
			{
				name: "partner_label",
				value: 0,
				renderChild: () =>
					m(
						"div.flex.flex-column",
						{
							style: {
								width: px(400),
								height: px(500),
							},
						},

						[
							m(LoginTextField, {
								oninput: (newValue) => (ctx.viewModel.addressInputStore = newValue),
								label: lang.getTranslation("address_label"),
								value: ctx.viewModel.addressInputStore ?? "",
								leadingIcon: {
									icon: Icons.Eye,
									color: theme.on_surface_variant,
								},
							}),
							m(
								".flex-center.full-width.pt-32",
								m(LoginButton, {
									label: "next_action",
									width: "full",
									icon: Icons.Eye,
									onclick: () => ctx.goNext(),
								}),
							),
							m(
								".flex-center.full-width.pt-32",
								m(SecondaryButton, {
									label: "next_action",
									width: "full",
									icon: Icons.Eye,
									onclick: () => ctx.goNext(),
								}),
							),
							m(TertiaryButton, {
								label: "previous_action",
								icon: Icons.Eye,
								width: "flex",
								onclick: () => m.route.set("/"),
							}),
						],
					),
			},
			{ name: "credit_label", value: 1, renderChild: () => m("div", boxAttr, "2") },
			{ name: "userSettings_label", value: 2, renderChild: () => m("div", boxAttr, "3") },
		]
		return m(".mt-16.mb-16", [
			m(RadioSelector, {
				groupName: "credentialsEncryptionMode_label",
				options,
				selectedOption: this.currentOption,
				onOptionSelected: (mode: number) => {
					this.currentOption = mode
				},
			} satisfies RadioSelectorAttrs<number>),

			m(
				"full-width.pt-l",
				m(LoginButton, {
					label: "next_action",
					size: "md",
					width: "full",
					onclick: () => ctx.goNext(),
				}),
			),
		])
	}
}
