//@flow

import {Dialog} from "../../gui/base/Dialog"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {TextFieldN} from "../../gui/base/TextFieldN"
import {lang} from "../../misc/LanguageViewModel"
import type {TranslationKeyType} from "../../misc/TranslationKey"
import {downcast} from "../../api/common/utils/Utils"

type CalendarProperties = {name: string, color: string}

export function showEditCalendarDialog({name, color}: CalendarProperties, titleTextId: TranslationKeyType, shared: boolean, okAction: ((Dialog, CalendarProperties) => mixed), okTextId: TranslationKeyType, warningMessage?: () => Children) {
	const nameStream = stream(name)
	let colorPickerDom: ?HTMLInputElement
	const colorStream = stream("#" + color)

	Dialog.showActionDialog({
		title: () => lang.get(titleTextId),
		allowOkWithReturn: true,
		child: {
			view: () => m(".flex.col", [
				warningMessage ? warningMessage() : null,
				m(TextFieldN, {
					value: nameStream,
					label: "calendarName_label"
				}),
				m(".small.mt.mb-xs", lang.get("color_label")),
				m("input.color-picker", {
					oncreate: ({dom}) => colorPickerDom = downcast<HTMLInputElement>(dom),
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
