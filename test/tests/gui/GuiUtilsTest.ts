import o from "@tutao/otest"
import { Dialog } from "../../../src/common/gui/base/Dialog.js"
import { getConfirmation } from "../../../src/common/gui/base/GuiUtils.js"
import { downcast } from "@tutao/tutanota-utils"
import { spy } from "@tutao/tutanota-test-utils"

o.spec("GuiUtils", function () {
	o.spec("getConfirmation ok", function () {
		o.beforeEach(function () {
			Dialog.confirm = spy(function (...args) {
				return Promise.resolve(true)
			})
		})
		o("calls confirmed", async function () {
			const confirmAction = spy(() => {})
			const confirmation = getConfirmation(downcast("message"), downcast("ok action")).confirmed(confirmAction)
			await confirmation.result
			o(confirmAction.callCount).equals(1)
			o(Dialog.confirm.callCount).equals(1)
			o(Dialog.confirm.args).deepEquals(["message", "ok action"])
		})
		o("calls cancelled", async function () {
			const cancelAction = spy(() => {})
			const confirmation = getConfirmation(downcast("message"), downcast("ok action")).cancelled(cancelAction)
			await confirmation.result
			o(cancelAction.callCount).equals(0)
			o(Dialog.confirm.callCount).equals(1)
			o(Dialog.confirm.args).deepEquals(["message", "ok action"])
		})
		o("calls confirmed and cancelled", async function () {
			const confirmAction = spy(() => {})
			const cancelAction = spy(() => {})
			const confirmation = getConfirmation(downcast("message"), downcast("ok action")).confirmed(confirmAction).cancelled(cancelAction)
			await confirmation.result
			o(confirmAction.callCount).equals(1)
			o(cancelAction.callCount).equals(0)
			o(Dialog.confirm.callCount).equals(1)
			o(Dialog.confirm.args).deepEquals(["message", "ok action"])
		})
	})
	o.spec("getConfirmation !ok", function () {
		o.beforeEach(function () {
			Dialog.confirm = spy(function (...args) {
				return Promise.resolve(false)
			})
		})
		o("calls confirmed", async function () {
			const confirmAction = spy(() => {})
			const confirmation = getConfirmation(downcast("message"), downcast("ok action")).confirmed(confirmAction)
			await confirmation.result
			o(confirmAction.callCount).equals(0)
			o(Dialog.confirm.callCount).equals(1)
			o(Dialog.confirm.args).deepEquals(["message", "ok action"])
		})
		o("calls cancelled", async function () {
			const cancelAction = spy(() => {})
			const confirmation = getConfirmation(downcast("message"), downcast("ok action")).cancelled(cancelAction)
			await confirmation.result
			o(cancelAction.callCount).equals(1)
			o(Dialog.confirm.callCount).equals(1)
			o(Dialog.confirm.args).deepEquals(["message", "ok action"])
		})
		o("calls confirmed and cancelled", async function () {
			const confirmAction = spy(() => {})
			const cancelAction = spy(() => {})
			const confirmation = getConfirmation(downcast("message"), downcast("ok action")).confirmed(confirmAction).cancelled(cancelAction)
			await confirmation.result
			o(confirmAction.callCount).equals(0)
			o(cancelAction.callCount).equals(1)
			o(Dialog.confirm.callCount).equals(1)
			o(Dialog.confirm.args).deepEquals(["message", "ok action"])
		})
	})
})
