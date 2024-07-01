import m from "mithril"
import { lang } from "../../../common/misc/LanguageViewModel"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { Dialog } from "../../../common/gui/base/Dialog"
import { ButtonType } from "../../../common/gui/base/Button.js"
import type { DialogHeaderBarAttrs } from "../../../common/gui/base/DialogHeaderBar"
import { Keys } from "../../../common/api/common/TutanotaConstants"
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
