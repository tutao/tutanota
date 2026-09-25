import { ComponentTypes } from "mithril"
import type { WizardStepContext } from "./WizardController"

export interface WizardStepAttrs<TViewModel> {
	title?: string
	content: ComponentTypes<WizardStepComponentAttrs<TViewModel>>
	onNext?: (ctx: WizardStepContext<TViewModel>) => boolean | Promise<boolean | void> | void
	onPrev?: (ctx: WizardStepContext<TViewModel>) => boolean | Promise<boolean | void> | void
	isEnabled?: (ctx: WizardStepContext<TViewModel>) => boolean
	isBackButtonEnabled?: (ctx: WizardStepContext<TViewModel>) => boolean
	showProgress?: (ctx: WizardStepContext<TViewModel>) => boolean
}

export interface WizardStepComponentAttrs<TViewModel> {
	ctx: WizardStepContext<TViewModel>
}
