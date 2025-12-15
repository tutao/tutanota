import { ComponentTypes } from "mithril"
import type { WizardStepContext } from "./WizardController"

export interface WizardStepAttrs<TViewModel> {
	title?: string
	content: ComponentTypes<WizardStepComponentAttrs<TViewModel>> //(ctx: WizardStepContext<TViewModel>) => m.Children
	onNext?: (ctx: WizardStepContext<TViewModel>) => boolean | Promise<boolean | void> | void
	onPrev?: (ctx: WizardStepContext<TViewModel>) => boolean | Promise<boolean | void> | void
	isEnabled?: (ctx: WizardStepContext<TViewModel>) => boolean
	isBackButtonEnabled?: (ctx: WizardStepContext<TViewModel>) => boolean
	showProgress?: (ctx: WizardStepContext<TViewModel>) => boolean
}

export interface WizardStepComponentAttrs<TViewModel> {
	ctx: WizardStepContext<TViewModel>
}

/**
wizard step wrapper: generic, configures data and component together, fixes generic TViewModel type
wizard step: specific component to render the step, gets passed a ctx
 **/
