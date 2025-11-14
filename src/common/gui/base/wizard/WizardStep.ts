import m, { Component, Vnode } from "mithril"

export interface WizardStepAttrs {
	title: string
	main: m.Children
	sub: m.Children
}
export class WizardStep implements Component<WizardStepAttrs> {
	view({ attrs: { main, sub } }: Vnode<WizardStepAttrs>) {
		return m(".flex", [main, sub])
	}
}
