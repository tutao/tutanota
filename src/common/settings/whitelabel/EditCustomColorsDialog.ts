import m from "mithril"
import { lang } from "../../misc/LanguageViewModel"
import { assertMainOrNode } from "../../api/common/Env"
import { Dialog } from "../../gui/base/Dialog"
import { ButtonType } from "../../gui/base/Button.js"
import type { DialogHeaderBarAttrs } from "../../gui/base/DialogHeaderBar"
import { Keys } from "../../api/common/TutanotaConstants"
import { CustomColorEditor } from "./CustomColorEditor"
import { CustomColorsEditorViewModel } from "./CustomColorsEditorViewModel"

assertMainOrNode()

export function show(model: CustomColorsEditorViewModel) {
	model.init()
	model.builtTheme.map(() => m.redraw())
	const form = {
		view: () => {
			return m(".pb", [
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
		middle: () => lang.get("customColors_label"),
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
