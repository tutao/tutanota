import { Dialog } from "../../../common/gui/base/Dialog.js"
import m, { Children } from "mithril"
import stream from "mithril/stream"
import { TextField, TextFieldType } from "../../../common/gui/base/TextField.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import type { TranslationKeyType } from "../../../common/misc/TranslationKey.js"
import { deepEqual, downcast } from "@tutao/tutanota-utils"
import { AlarmInterval, CalendarType } from "../../../common/calendar/date/CalendarUtils.js"
import { RemindersEditor } from "./RemindersEditor.js"
import { generateRandomColor } from "./CalendarGuiUtils.js"
import { assertValidURL } from "@tutao/tutanota-utils/dist/Utils.js"
import { isExternalCalendar } from "../../../common/calendar/import/ImportExportUtils.js"

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
					!shared && !isExternalCalendar(calendarType)
						? m(RemindersEditor, {
								alarms,
								addAlarm: (alarm: AlarmInterval) => {
									alarms?.push(alarm)
								},
								removeAlarm: (alarm: AlarmInterval) => {
									const index = alarms?.findIndex((a: AlarmInterval) => deepEqual(a, alarm))
									if (index !== -1) alarms?.splice(index, 1)
								},
								label: "calendarDefaultReminder_label",
						  })
						: null,
					isExternalCalendar(calendarType)
						? m.fragment({}, [
								m(TextField, {
									value: urlStream(),
									oninput: urlStream,
									label: "url_label",
									type: TextFieldType.Url,
								}),
						  ])
						: null,
				]),
		},
		okActionTextId: okTextId,
		okAction: async (dialog: Dialog) => {
			let url: string | null = null

			if (isExternalCalendar(calendarType)) {
				const assertResult = assertValidURL(urlStream())
				if (!assertResult) return Dialog.message("invalidURL_msg")

				if (!sourceUrl) {
					const proceed = await Dialog.confirm("externalCalendarProviderWarning_msg")
					if (!proceed) return
				}

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
