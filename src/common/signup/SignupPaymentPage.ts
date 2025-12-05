import m, { ClassComponent, Vnode } from "mithril"
import { WizardStepComponentAttrs } from "../gui/base/wizard/WizardStep"
import { SignupViewModel } from "./SignupView"
import { InvoiceAndPaymentDataPageNew } from "./components/InvoiceAndPaymentDataPageNew"
import { px, size } from "../gui/size"
import { theme } from "../gui/theme"
import { RadioSelectorOption } from "../gui/base/RadioSelectorItem"
import { RadioSelector, RadioSelectorAttrs } from "../gui/base/RadioSelector"

export class SignupPaymentPage implements ClassComponent<WizardStepComponentAttrs<SignupViewModel>> {
	private currentOption = 0
	view(vnode: Vnode<WizardStepComponentAttrs<SignupViewModel>>) {
		const { ctx } = vnode.attrs

		const boxAttr = { style: { width: px(500), height: px(500), background: theme.primary_container, padding: size.spacing_16 } }
		const options: ReadonlyArray<RadioSelectorOption<number>> = [
			{
				name: "paymentMethodCreditCard_label",
				value: 0,
				renderChild: () =>
					m(
						"div.flex.flex-column",
						{
							style: {
								width: px(500),
							},
						},

						m(InvoiceAndPaymentDataPageNew, ctx),
					),
			},
			{ name: "credit_label", value: 1, renderChild: () => m("div", boxAttr, "2") },
		]
		return m(".flex.items-center.flex-center", [
			m(RadioSelector, {
				groupName: "credentialsEncryptionMode_label",
				options,
				selectedOption: this.currentOption,
				onOptionSelected: (mode: number) => {
					this.currentOption = mode
				},
			} satisfies RadioSelectorAttrs<number>),
		])
	}
}
