import { Dialog } from "../../../common/gui/base/Dialog.js"
import m, { Children } from "mithril"
import stream from "mithril/stream"
import { TextField, TextFieldType } from "../../../common/gui/base/TextField.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import type { TranslationKeyType } from "../../../common/misc/TranslationKey.js"
import { deepEqual, downcast } from "@tutao/tutanota-utils"
import { AlarmInterval } from "../../../common/calendar/date/CalendarUtils.js"
import { RemindersEditor } from "./RemindersEditor.js"
import { generateRandomColor } from "./CalendarGuiUtils.js"
import { CalendarType } from "../view/CalendarView.js"
import { assertValidURL } from "@tutao/tutanota-utils/dist/Utils.js"

export type CalendarProperties = {
	name: string
	color: string
	alarms: AlarmInterval[]
	sourceUrl: string | null
}

const defaultCalendarProperties: CalendarProperties = {
	name: "",
	color: "",
	alarms: [],
	sourceUrl: "",
}

export function showCreateEditCalendarDialog(
	calendarType: CalendarType,
	titleTextId: TranslationKeyType,
	shared: boolean,
	okAction: (arg0: Dialog, arg1: CalendarProperties) => unknown,
	okTextId: TranslationKeyType,
	warningMessage?: () => Children,
	{ name, color, alarms, sourceUrl }: CalendarProperties = defaultCalendarProperties,
) {
	if (color === "") color = generateRandomColor()

	const nameStream = stream(name)
	const colorStream = stream("#" + color)
	const urlStream = stream(sourceUrl ?? "")
	const disableUrlInput = urlStream() !== ""
	let colorPickerDom: HTMLInputElement | null

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
					!shared &&
						m(RemindersEditor, {
							alarms,
							addAlarm: (alarm: AlarmInterval) => {
								alarms?.push(alarm)
							},
							removeAlarm: (alarm: AlarmInterval) => {
								const index = alarms?.findIndex((a: AlarmInterval) => deepEqual(a, alarm))
								if (index !== -1) alarms?.splice(index, 1)
							},
							label: "calendarDefaultReminder_label",
						}),
					calendarType === CalendarType.URL &&
						m.fragment({}, [
							m(TextField, {
								value: urlStream(),
								oninput: urlStream,
								label: "url_label",
								disabled: disableUrlInput,
								// FIXME add translation label
								type: TextFieldType.Url,
								helpLabel: () => "To change the URL remove this calendar and create another subscription.",
							}),
						]),
				]),
		},
		okActionTextId: okTextId,
		okAction: async (dialog: Dialog) => {
			let url: string | null = null

			if (calendarType === CalendarType.URL) {
				// FIXME Improve this message and add translation
				const proceed = await Dialog.confirm(
					() => "Subscribing to an external calendar will expose this action to our servers during each sync operation, do you want to proceed?",
				)
				if (!proceed) return
				const assertResult = assertValidURL(urlStream())
				// FIXME Add translation for url error
				if (!assertResult) return Dialog.message(() => "Erro")
				url = assertResult.toString()
			}

			okAction(dialog, {
				name: nameStream(),
				color: colorStream().substring(1),
				alarms,
				sourceUrl: url,
			})
		},
	})
}
