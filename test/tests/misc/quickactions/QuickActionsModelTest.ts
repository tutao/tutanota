import o from "@tutao/otest"
import { QuickAction, QuickActionsModel } from "../../../../src/common/misc/quickactions/QuickActionsModel"
import { func } from "testdouble"
import { assertWorkerOrNode } from "../../../../src/common/api/common/Env"
import { addAll } from "@tutao/tutanota-utils"
import { verify } from "@tutao/tutanota-test-utils"

type QuickActionExec = QuickAction["exec"]

o.spec("QuickActionsModel", function () {
	let model: QuickActionsModel
	let providerOneActions: QuickAction[]
	let providerTwoActions: QuickAction[]

	let firstAction: QuickAction
	let secondAction: QuickAction
	let capsAction: QuickAction

	o.beforeEach(function () {
		model = new QuickActionsModel()
		providerOneActions = []
		providerTwoActions = []
		model.register(async () => providerOneActions)
		model.register(async () => providerTwoActions)

		firstAction = {
			description: "first",
			exec: func<QuickActionExec>(),
		}
		secondAction = {
			description: "second",
			exec: func<QuickActionExec>(),
		}
		capsAction = {
			description: "CAPS",
			exec: func<QuickActionExec>(),
		}
	})
	o.spec("updateActions", function () {
		o.test("when run it adds all provider actions to the list", async function () {
			providerOneActions = [firstAction]
			providerTwoActions = [secondAction]
			await model.updateActions()
			o.check(model.getMatchingActions("")).deepEquals([firstAction, secondAction])
		})

		o.test("when run twice it updates the previous list", async function () {
			providerOneActions = [firstAction]
			providerTwoActions = []
			await model.updateActions()
			providerTwoActions = [secondAction]
			await model.updateActions()
			o.check(model.getMatchingActions("")).deepEquals([firstAction, secondAction])
		})

		o.test("when run it removes lastActions that are no longer available", async function () {
			providerOneActions = [firstAction]
			await model.updateActions()
			model.runAction(firstAction)
			providerOneActions = [secondAction]
			await model.updateActions()
			o.check(model.lastActions()).deepEquals([])
		})

		o.test("when run it replaces lastActions", async function () {
			providerOneActions = [firstAction]
			await model.updateActions()
			model.runAction(firstAction)
			const newFirstAction: QuickAction = {
				description: "first",
				exec: func<QuickActionExec>(),
			}
			providerOneActions = [newFirstAction]
			await model.updateActions()
			o.check(model.lastActions()).deepEquals([newFirstAction])
		})
	})

	o.spec("getMatchingActions", function () {
		o.test("when run with an empty string it returns all results", async function () {
			providerOneActions = [firstAction, secondAction]
			providerTwoActions = []
			await model.updateActions()
			o.check(model.getMatchingActions("")).deepEquals([firstAction, secondAction])
		})

		o.test("when run with nonempty string it returns all matching actions", async function () {
			providerOneActions = [firstAction, secondAction]
			await model.updateActions()
			o.check(model.getMatchingActions("first")).deepEquals([firstAction])
		})

		o.test("when run with one with mismatching case it still finds the action", async function () {
			providerOneActions = [firstAction, secondAction, capsAction]
			await model.updateActions()
			o.check(model.getMatchingActions("Caps")).deepEquals([capsAction])
		})
	})

	o.spec("initialActions", function () {
		o.test("when there are no last actions it returns initial actions", async function () {
			providerOneActions = [firstAction]
			providerTwoActions = [secondAction]
			await model.updateActions()

			o.check(model.initialActions()).deepEquals([firstAction, secondAction])
		})

		o.test("when there are last actions it returns them before other actions", async function () {
			providerOneActions = [firstAction]
			providerTwoActions = [secondAction]
			await model.updateActions()
			model.runAction(secondAction)

			o.check(model.initialActions()).deepEquals([secondAction, firstAction])
		})
	})

	o.spec("runAction", function () {
		o.test("when running the action it runs the action", async function () {
			providerOneActions = [firstAction]
			await model.updateActions()
			model.runAction(firstAction)
			verify(firstAction.exec())
		})

		o.test("when running multiple actions it keeps lastRunActions in reverse order", async function () {
			providerOneActions = [firstAction, secondAction]
			await model.updateActions()
			model.runAction(firstAction)
			model.runAction(secondAction)
			o.check(model.lastActions()).deepEquals([secondAction, firstAction])
		})

		o.test("when running the same action multiple times it surfaces the last action to the top", async function () {
			providerOneActions = [firstAction, secondAction]
			await model.updateActions()
			model.runAction(firstAction)
			model.runAction(secondAction)
			model.runAction(firstAction)
			o.check(model.lastActions()).deepEquals([firstAction, secondAction])
		})
	})
})
