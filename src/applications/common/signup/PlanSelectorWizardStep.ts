import m, { ClassComponent, Vnode } from "mithril"
import { WizardStepComponentAttrs } from "../../../ui/base/wizard/WizardStep"
import { SignupViewModel } from "./SignupView"
import { PlanSelectorPage } from "./PlanSelectorPage"

export class PlanSelectorWizardStep implements ClassComponent<WizardStepComponentAttrs<SignupViewModel>> {
	view(vnode: Vnode<WizardStepComponentAttrs<SignupViewModel>>) {
		return m(PlanSelectorPage, {})
	}
}
