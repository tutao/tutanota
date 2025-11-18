import m, { Component, Vnode } from "mithril"
import { WizardStep, WizardStepAttrs } from "./WizardStep"
import { WizardController, WizardProgressViewItem, WizardStepContext } from "./WizardController"
import { WizardProgress } from "./WizardProgress"

export interface WizardAttrs<TViewModel> {
	steps: WizardStepAttrs<TViewModel>[]
	controller: WizardController
	viewModel: TViewModel
	onComplete?: (viewModel: TViewModel) => void
}

export class Wizard<TViewModel> implements Component<WizardAttrs<TViewModel>> {
	view({ attrs: { steps, controller, viewModel, onComplete } }: Vnode<WizardAttrs<TViewModel>>) {
		if (controller.stepCount === 0) {
			controller.initSteps(steps.map((step) => step.title ?? ""))
		}
		const currentIndex = controller.currentStep
		const currentStep = steps[currentIndex]

		const findNextEnabledIndex = (startIndex: number, direction: "next" | "prev"): number | null => {
			let i = startIndex
			while (true) {
				i += direction === "next" ? 1 : -1

				if (i < 0 || i >= steps.length) {
					return null
				}

				const step = steps[i]
				const enabled = step.isEnabled ? step.isEnabled(ctx) : true
				if (enabled) {
					return i
				}
			}
		}
		const handleNavigation = (direction: "next" | "prev", hook?: (ctx: WizardStepContext<TViewModel>) => any) => {
			Promise.resolve(hook ? hook(ctx) : true)
				.then((result) => {
					if (result === false) return

					// re-read current step to avoid stale closure in async hooks
					const fromIndex = controller.currentStep

					if (direction === "next") {
						const nextIndex = findNextEnabledIndex(fromIndex, "next")

						if (nextIndex == null) {
							if (onComplete) onComplete(viewModel)
						} else {
							controller.markStepComplete(fromIndex, true)
							controller.setStep(nextIndex)
						}
					} else {
						const prevIndex = findNextEnabledIndex(fromIndex, "prev")
						if (prevIndex != null) {
							controller.setStep(prevIndex)
						}
					}
				})
				.catch((err) => {
					console.error(`Wizard on${direction} error`, err)
				})
				.finally(() => {
					m.redraw()
				})
		}

		const ctx: WizardStepContext<TViewModel> = {
			index: currentIndex,
			viewModel,
			controller,
			setLabel: (label: string) => controller.setStepLabel(currentIndex, label),
			getLabel: (): string => controller.getStepLabel(currentIndex),
			markComplete: (isCompleted: boolean = true) => controller.markStepComplete(currentIndex, isCompleted),
			goNext: () => handleNavigation("next", currentStep.onNext),
			goPrev: () => handleNavigation("prev", currentStep.onPrev),
		}

		const rawProgress = controller.progressItems

		const isStepEnabled = (index: number): boolean => {
			const step = steps[index]
			return step.isEnabled ? step.isEnabled(ctx) : true
		}
		const progressState: WizardProgressViewItem[] = rawProgress.map((item, index) => ({
			...item,
			index,
			isCurrent: index === controller.currentStep,
			isEnabled: isStepEnabled(index),
			currentIndex: controller.currentStep,
		}))

		return m(".flex.height-100p.full-width", [
			m(WizardProgress, {
				progressState,
				onClick: (index) => controller.setStep(index),
			}),
			m(WizardStep<TViewModel>, { ...currentStep, ctx }),
		])
	}
}
