import m, { ClassComponent, Vnode } from "mithril"
import { WizardStepComponentAttrs } from "../gui/base/wizard/WizardStep"
import { SignupViewModel } from "./SignupView"
import { UpgradeCongratulationsPageNew } from "../subscription/UpgradeCongratulationsPageNew"

// fixme: render UpgradeCongratulationsPageNew directly in SignupView
export class SignupRecoveryKitPage implements ClassComponent<WizardStepComponentAttrs<SignupViewModel>> {
	view(vnode: Vnode<WizardStepComponentAttrs<SignupViewModel>>) {
		const { ctx } = vnode.attrs
		return m(UpgradeCongratulationsPageNew, ctx)
	}
}
