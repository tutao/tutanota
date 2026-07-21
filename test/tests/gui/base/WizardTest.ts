import o from "@tutao/otest"
import m from "mithril"
import { createWizard, WizardLayoutAttrs } from "../../../../src/ui/base/wizard/Wizard.js"
import { WizardController } from "../../../../src/ui/base/wizard/WizardController.js"
import type { WizardStepContext } from "../../../../src/ui/base/wizard/WizardController.js"

interface ViewModel {
	isInitialized: boolean
}

const FirstStep: m.Component = { view: () => "first" }
const SecondStep: m.Component = { view: () => "second" }
const Layout: m.Component<WizardLayoutAttrs<ViewModel>> = { view: (vnode) => vnode.children }

function renderWizard(controller?: WizardController, isFirstStepEnabled: (ctx: WizardStepContext<ViewModel>) => boolean = () => false): string | null {
	const root = document.createElement("div")
	const Wizard = createWizard<ViewModel>()

	m.render(
		root,
		m(Wizard, {
			steps: [{ content: FirstStep, isEnabled: isFirstStepEnabled }, { content: SecondStep }],
			viewModel: { isInitialized: true },
			layout: Layout,
			controller,
		}),
	)

	return root.textContent
}

o.spec("Wizard", function () {
	o("initializes the controller at the requested step", function () {
		const controller = new WizardController()

		controller.initSteps(["first", "second"], 1)

		o(controller.currentStep).equals(1)
		o(controller.progressItems.map((step) => step.isReachable)).deepEquals([false, true])
	})

	o("skips a disabled first step", function () {
		o(renderWizard()).equals("second")
	})

	o("initializes the controller before checking the first step", function () {
		let stepCount = 0

		renderWizard(undefined, (ctx) => {
			stepCount = ctx.controller.stepCount
			return false
		})

		o(stepCount).equals(2)
	})

	o("skips a disabled first step with a preinitialized controller", function () {
		const controller = new WizardController(["first", "second"])

		o(renderWizard(controller)).equals("second")
		o(controller.currentStep).equals(1)
	})
})
