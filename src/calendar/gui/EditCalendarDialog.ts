import { Dialog } from "../../gui/base/Dialog.js"
import m, { Children } from "mithril"
import stream from "mithril/stream"
import { TextField } from "../../gui/base/TextField.js"
import { lang } from "../../misc/LanguageViewModel.js"
import type { TranslationKeyType } from "../../misc/TranslationKey.js"

import { downcast } from "@tutao/tutanota-utils"

export function showEditCalendarDialog(
	{ name, color, iCalSubscriptionUrl }: CalendarProperties,
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
					m(TextField, {
						value: nameStream(),
						oninput: nameStream,
						label: "calendarName_label",
					}),
					m(".small.mt.mb-xs", lang.get("color_label")),
					m("input.color-picker", {
						oncreate: ({ dom }) => (colorPickerDom = downcast<HTMLInputElement>(dom)),
						type: "color",
						value: colorStream(),
						oninput: (inputEvent: InputEvent) => {
							const target = inputEvent.target as HTMLInputElement
							colorStream(target.value)
						},
					}),
					iCalSubscriptionUrl ? renderICalSubscriptionUrlField(iCalSubscriptionUrl) : null,
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

function renderICalSubscriptionUrlField(iCalSubscriptionUrl: string) {
	const iCalSubscriptionUrlStream = stream(iCalSubscriptionUrl)
	return m(TextField, {
		value: iCalSubscriptionUrlStream(),
		oninput: iCalSubscriptionUrlStream,
		label: "calendarName_label",
	})
}

type CalendarProperties = {
	name: string
	color: string
	iCalSubscriptionUrl?: string
}
