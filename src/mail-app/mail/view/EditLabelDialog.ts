import { Dialog } from "../../../common/gui/base/Dialog"
import { TextField, TextFieldAttrs } from "../../../common/gui/base/TextField"
import { ColorPicker } from "../../../common/gui/base/ColorPicker"
import m from "mithril"
import { theme } from "../../../common/gui/theme"

export function showEditLabelDialog(): Promise<{ name: string; color: string } | null> {
	return new Promise((resolve) => {
		let name = ""
		let color = theme.content_accent
		Dialog.showActionDialog({
			// FIXME translate
			title: () => "Create label",
			allowCancel: true,
			okAction: (dialog) => {
				resolve({ name, color })
				dialog.close()
			},
			cancelAction: () => resolve(null),
			child: () =>
				m(".flex.col.gap-vpad", [
					m(TextField, {
						label: "name_label",
						value: name,
						oninput: (newName) => {
							name = newName
						},
					} satisfies TextFieldAttrs),
					m(ColorPicker, {
						value: color,
						onValueChange: (newColor) => {
							color = newColor
						},
					}),
				]),
		})
	})
}
