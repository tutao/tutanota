import m, { Component, Vnode } from "mithril"
import type { WizardStepContext } from "./WizardController"

export interface WizardStepAttrs<TViewModel> {
	title: string
	main: (ctx: WizardStepContext<TViewModel>) => m.Children
	sub: (ctx: WizardStepContext<TViewModel>) => m.Children
}

export interface WizardStepComponentAttrs<TViewModel> extends WizardStepAttrs<TViewModel> {
	ctx: WizardStepContext<TViewModel>
}

export class WizardStep<TViewModel> implements Component<WizardStepComponentAttrs<TViewModel>> {
	view({ attrs: { main, sub, ctx } }: Vnode<WizardStepComponentAttrs<TViewModel>>) {
		return m(".flex", [main(ctx), sub(ctx)])
	}
}
