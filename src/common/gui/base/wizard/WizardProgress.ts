import m, { Component, Vnode } from "mithril"

interface ProgressState {
	label: string
	isCompleted: boolean
	isReachable: boolean
	isCurrent: boolean
}

interface WizardProgressAttrs {
	progressState: ProgressState[]
}
export class WizardProgress implements Component<WizardProgressAttrs> {
	view({ attrs: { progressState } }: Vnode<WizardProgressAttrs>) {
		return m(
			".flex.col.gap",
			progressState.map((state) => {
				return m(Step, state)
			}),
		)
	}
}

class Step implements Component<ProgressState> {
	view({ attrs: { isCurrent, label } }: Vnode<ProgressState>) {
		return m("", { style: { width: "30px", height: "30px", "background-color": isCurrent ? "blue" : "black", color: "white" } }, label)
	}
}
