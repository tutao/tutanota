import m, { Component, Vnode } from "mithril"
import type { WizardStepContext } from "./WizardController"

export interface WizardStepAttrs<TViewModel> {
	title?: string
	content: (ctx: WizardStepContext<TViewModel>) => m.Children
	onNext?: (ctx: WizardStepContext<TViewModel>) => boolean | Promise<boolean | void> | void
	onPrev?: (ctx: WizardStepContext<TViewModel>) => boolean | Promise<boolean | void> | void
	isEnabled?: (ctx: WizardStepContext<TViewModel>) => boolean
}

export interface WizardStepComponentAttrs<TViewModel> extends WizardStepAttrs<TViewModel> {
	ctx: WizardStepContext<TViewModel>
}

export class WizardStep<TViewModel> implements Component<WizardStepComponentAttrs<TViewModel>> {
	view({ attrs: { content, ctx } }: Vnode<WizardStepComponentAttrs<TViewModel>>) {
		return m(".flex.height-100p.full-width", content(ctx))
	}
}
