import m, { Vnode } from "mithril"
import { WizardStepAttrs } from "./WizardStep"
import { WizardController, WizardProgressViewItem, WizardStepContext } from "./WizardController"
import { WizardProgress } from "./WizardProgress"
import { component_size, layout_size, px } from "../../size"
import { TertiaryButton } from "../buttons/LoginButton"
import { lang } from "../../../misc/LanguageViewModel"
import { Icons } from "../icons/Icons"
import { styles } from "../../styles"

export interface WizardAttrs<TViewModel> {
	steps: WizardStepAttrs<TViewModel>[]
	controller?: WizardController
	viewModel: TViewModel
	onComplete?: (viewModel: TViewModel) => void
}

/**
 * this indirection allows us to pass a Component type with a generic parameter to mithril without TS complaining.
 */
export function createWizard<TViewModel>(): m.Component<WizardAttrs<TViewModel>> {
	let internalController: WizardController | undefined

	return {
		oninit({ attrs }: Vnode<WizardAttrs<TViewModel>>) {
			if (!attrs.controller) {
				internalController = new WizardController(attrs.steps.map((s) => s.title ?? ""))
			} else if (attrs.controller.stepCount === 0) {
				attrs.controller.initSteps(attrs.steps.map((step) => step.title ?? ""))
			}
		},
		view({ attrs }: Vnode<WizardAttrs<TViewModel>>) {
			const { steps, viewModel, onComplete } = attrs
			const controller = attrs.controller || internalController!
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
			const handleNavigation = (direction: "next" | "prev", hook?: (ctx: WizardStepContext<TViewModel>) => unknown) => {
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
				lockAllPreviousSteps: () => controller.lockAllPreviousSteps(currentIndex),
			}

			const rawProgress = controller.progressItems

			const isStepEnabled = (index: number): boolean => {
				const step = steps[index]
				return step.isEnabled ? step.isEnabled(ctx) : true
			}
			const isBackButtonEnabled = (index: number): boolean => {
				const step = steps[index]
				return step.isBackButtonEnabled ? step.isBackButtonEnabled(ctx) : true
			}
			const showProgress = (index: number): boolean => {
				const step = steps[index]
				return step.showProgress ? step.showProgress(ctx) : true
			}
			const progressState: WizardProgressViewItem[] = rawProgress.map((item, index) => ({
				...item,
				index,
				isCurrent: index === controller.currentStep,
				isEnabled: isStepEnabled(index),
				currentIndex: controller.currentStep,
			}))

			return m(
				`.full-width.${styles.isMobileLayout() ? "" : "height-100p"}`,
				{ style: { margin: "auto", "max-height": px(layout_size.wizard_max_height), "max-width": px(layout_size.wizard_max_width) } },
				m(
					".flex.height-100p.full-width.gap-64",
					{
						style: {
							"padding-inline": "5svw",
							"padding-block": "7svh",
						},
					},
					[
						!styles.isMobileLayout() &&
							m(".flex.flex-column.flex-space-between", [
								showProgress(controller.currentStep) &&
									m(WizardProgress, {
										progressState,
										onClick: (index) => controller.setStep(index),
									}),
								m(
									"",
									{
										style: {
											height: px(component_size.button_height),
											"margin-inline": showProgress(controller.currentStep) ? "initial" : "auto",
										},
									},
									isBackButtonEnabled(controller.currentStep) &&
										m(TertiaryButton, {
											text: lang.getTranslationText("back_action"),
											label: lang.getTranslation("back_action"),
											icon: Icons.ArrowBackward,
											onclick: ctx.goPrev,
											width: "flex",
										}),
								),
							]),
						m(
							`.wizard-page.flex.height-100p.full-width${controller.isInTransition ? ".wizard-page-transition" : ""}`,
							m(currentStep.content, { ctx }),
						),
					],
				),
			)
		},
	}
}
