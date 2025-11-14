import m, { Component, Vnode } from "mithril"
import { WizardStep, WizardStepAttrs } from "./WizardStep"
import { WizardController } from "./WizardController"
import { WizardProgress } from "./WizardProgress"

export interface WizardAttrs<T> {
	steps: WizardStepAttrs[]
	controller: WizardController
	viewModel: T
}
export class Wizard<T> implements Component<WizardAttrs<T>> {
	view({ attrs: { steps, controller } }: Vnode<WizardAttrs<T>>) {
		const progressState = steps.map((step, i) => ({
			label: step.title,
			isCompleted: false,
			isReachable: true,
			isCurrent: controller.currentStep === i,
		}))

		return m(".flex", m(WizardProgress, { progressState }), m("", m(WizardStep, steps[controller.currentStep])))
	}
}

// WizardProgress: main, sub
// WizardProgressBar: labels of the steps, current page, (isCompleted, isReachable), click handler

// WizardViewModel
