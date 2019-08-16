//@flow

import {Dialog} from "../gui/base/Dialog"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {TextFieldN} from "../gui/base/TextFieldN"
import {lang} from "../misc/LanguageViewModel"

type CalendarProperties = {name: string, color: string}

export function showEditCalendarDialog({name, color}: CalendarProperties, okAction: ((Dialog, CalendarProperties) => mixed)) {
	const nameStream = stream(name)
	let colorPickerDom: ?HTMLInputElement
	const colorStream = stream("#" + color)

	Dialog.showActionDialog({
		title: () => lang.get("edit_action"),
		child: {
			view: () => m(".flex.col", [
				m(TextFieldN, {
					value: nameStream,
					label: "name_label"
				}),
				m("label.mt.mb-s", lang.get("color_label")),
				m("input", {
					oncreate: ({dom}) => colorPickerDom = dom,
					type: "color",
					value: colorStream(),
					oninput: (inputEvent) => {
						colorStream(inputEvent.target.value)
					}
				}),
			])
		},
		okAction: (dialog) => {
			okAction(dialog, {name: nameStream(), color: colorPickerDom ? colorPickerDom.value.substring(1) : color})
		}
	})
}
