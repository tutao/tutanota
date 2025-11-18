import m, { Component, Vnode } from "mithril"
import type { WizardStepContext } from "./WizardController"

export interface WizardStepAttrs<TViewModel> {
	title?: string
	content: (ctx: WizardStepContext<TViewModel>) => m.Children
}

export interface WizardStepComponentAttrs<TViewModel> extends WizardStepAttrs<TViewModel> {
	ctx: WizardStepContext<TViewModel>
}

export class WizardStep<TViewModel> implements Component<WizardStepComponentAttrs<TViewModel>> {
	view({ attrs: { content, ctx } }: Vnode<WizardStepComponentAttrs<TViewModel>>) {
		return m(".flex", content(ctx))
	}
}
