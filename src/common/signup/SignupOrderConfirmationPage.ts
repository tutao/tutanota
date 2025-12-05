import m, { ClassComponent, Vnode } from "mithril"
import { WizardStepComponentAttrs } from "../gui/base/wizard/WizardStep"
import { SignupViewModel } from "./SignupView"
import { UpgradeConfirmSubscriptionPageNew } from "../subscription/UpgradeConfirmSubscriptionPageNew"

export class SignupOrderConfirmationPage implements ClassComponent<WizardStepComponentAttrs<SignupViewModel>> {
	view(vnode: Vnode<WizardStepComponentAttrs<SignupViewModel>>) {
		const { ctx } = vnode.attrs
		return m(
			".flex.col.justify-center",
			{
				style: {
					"max-width": "50%",
				},
			},
			m(UpgradeConfirmSubscriptionPageNew, ctx),
		)
	}
}
