import m from "mithril"
import { assertMainOrNode } from "@tutao/app-env"
import { Dialog } from "../../../../ui/base/Dialog"
import { ButtonType } from "../../../../ui/base/Button.js"
import type { DialogHeaderBarAttrs } from "../../../../ui/base/DialogHeaderBar"
import { CustomColorEditor } from "./CustomColorEditor"
import { CustomColorsEditorViewModel } from "./CustomColorsEditorViewModel"
import { Keys } from "../../../../ui/KeyboardKeys"

assertMainOrNode()

export function show(model: CustomColorsEditorViewModel) {
	model.init()
	model.builtTheme.map(() => m.redraw())
	const form = {
		view: () => {
			return m(".pb-16", [
				m(CustomColorEditor, {
					model: model,
				}),
			])
		},
	}

	const cancelAction = () => {
		model.resetActiveClientTheme().then(() => dialog.close())
	}

	const okAction = async () => {
		if (await model.save()) {
			dialog.close()
		} else {
			return Dialog.message("correctValues_msg")
		}
	}

	let actionBarAttrs: DialogHeaderBarAttrs = {
		left: [
			{
				label: "cancel_action",
				click: cancelAction,
				type: ButtonType.Secondary,
			},
		],
		right: [
			{
				label: "ok_action",
				click: okAction,
				type: ButtonType.Primary,
			},
		],
		middle: "customColors_label",
	}
	let dialog = Dialog.largeDialog(actionBarAttrs, form)
		.addShortcut({
			key: Keys.ESC,
			exec: cancelAction,
			help: "close_alt",
		})
		.setCloseHandler(cancelAction)
		.show()
}
