//@flow

import {Dialog} from "../gui/base/Dialog"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {TextFieldN} from "../gui/base/TextFieldN"
import {lang} from "../misc/LanguageViewModel"
import type {TranslationKeyType} from "../misc/TranslationKey"

type CalendarProperties = {name: string, color: string}

export function showEditCalendarDialog({name, color}: CalendarProperties, titleTextId: TranslationKeyType, shared: boolean, okAction: ((Dialog, CalendarProperties) => mixed), okTextId?: TranslationKeyType, warningMessage?: () => Children) {
	const nameStream = stream(name)
	let colorPickerDom: ?HTMLInputElement
	const colorStream = stream("#" + color)

	Dialog.showActionDialog({
		title: () => lang.get(titleTextId),
		child: {
			view: () => m(".flex.col", [
				warningMessage ? warningMessage() : null,
				m(TextFieldN, {
					value: nameStream,
					label: "calendarName_label",
					disabled: shared
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
		okActionTextId: okTextId,
		okAction: (dialog) => {
			okAction(dialog, {name: nameStream(), color: colorStream().substring(1)})
		}
	})
}
