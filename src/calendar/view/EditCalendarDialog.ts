import {Dialog} from "../../gui/base/Dialog"
import m, {Children} from "mithril"
import stream from "mithril/stream"
import {TextFieldN} from "../../gui/base/TextFieldN"
import {lang} from "../../misc/LanguageViewModel"
import type {TranslationKeyType} from "../../misc/TranslationKey"
import {downcast} from "@tutao/tutanota-utils"

type CalendarProperties = {
	name: string
	color: string
}

export function showEditCalendarDialog(
	{name, color}: CalendarProperties,
	titleTextId: TranslationKeyType,
	shared: boolean,
	okAction: (arg0: Dialog, arg1: CalendarProperties) => unknown,
	okTextId: TranslationKeyType,
	warningMessage?: () => Children,
) {
	const nameStream = stream(name)
	let colorPickerDom: HTMLInputElement | null
	const colorStream = stream("#" + color)
	Dialog.showActionDialog({
		title: () => lang.get(titleTextId),
		allowOkWithReturn: true,
		child: {
			view: () =>
				m(".flex.col", [
					warningMessage ? warningMessage() : null,
					m(TextFieldN, {
						value: nameStream(),
						oninput: nameStream,
						label: "calendarName_label",
					}),
					m(".small.mt.mb-xs", lang.get("color_label")),
					m("input.color-picker", {
						oncreate: ({dom}) => (colorPickerDom = downcast<HTMLInputElement>(dom)),
						type: "color",
						value: colorStream(),
						oninput: (inputEvent: InputEvent) => {
							const target = inputEvent.target as HTMLInputElement
							colorStream(target.value)
						},
					}),
				]),
		},
		okActionTextId: okTextId,
		okAction: (dialog: Dialog) => {
			okAction(dialog, {
				name: nameStream(),
				color: colorStream().substring(1),
			})
		},
	})
}