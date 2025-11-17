import m, { Component, Vnode } from "mithril"
import { WizardStep, WizardStepAttrs } from "./WizardStep"
import { WizardController, WizardStepContext } from "./WizardController"
import { WizardProgress } from "./WizardProgress"

export interface WizardAttrs<TViewModel> {
	steps: WizardStepAttrs<TViewModel>[]
	controller: WizardController
	viewModel: TViewModel
}

export class Wizard<TViewModel> implements Component<WizardAttrs<TViewModel>> {
	view({ attrs: { steps, controller, viewModel } }: Vnode<WizardAttrs<TViewModel>>) {
		const currentIndex = controller.currentStep
		const currentStep = steps[currentIndex]

		const ctx: WizardStepContext<TViewModel> = {
			index: currentIndex,
			viewModel,
			controller,
			setLabel: (label: string) => controller.setStepLabel(currentIndex, label),
			getLabel: (): string => controller.getStepLabel(currentIndex),
			markComplete: (isCompleted: boolean = true) => controller.markStepComplete(currentIndex, isCompleted),
		}

		const progressState = controller.progress

		return m(".flex.height-100p.full-width", [
			m(WizardProgress, {
				progressState,
				onClick: (index) => controller.setStep(index),
			}),
			m(WizardStep<TViewModel>, { ...currentStep, ctx }),
		])
	}
}
