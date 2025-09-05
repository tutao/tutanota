import { Dialog } from "../../../common/gui/base/Dialog.js"
import m, { Children } from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { TextField, TextFieldType } from "../../../common/gui/base/TextField.js"
import { lang, type TranslationKey } from "../../../common/misc/LanguageViewModel.js"
import type { TranslationKeyType } from "../../../common/misc/TranslationKey.js"
import { clone, deepEqual, isNotNull } from "@tutao/tutanota-utils"
import { AlarmInterval, CalendarType } from "../../../common/calendar/date/CalendarUtils.js"
import { RemindersEditor } from "./RemindersEditor.js"
import { checkURLString, isIcal } from "../../../common/calendar/gui/ImportExportUtils.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import type { CalendarModel } from "../model/CalendarModel.js"
import { DEFAULT_ERROR } from "../../../common/api/common/TutanotaConstants.js"
import { LoginButton } from "../../../common/gui/base/buttons/LoginButton.js"
import { ColorPickerView } from "../../../common/gui/base/colorPicker/ColorPickerView"
import { generateRandomColor } from "./CalendarGuiUtils.js"
import { GroupNameData } from "../../../common/sharing/model/GroupSettingsModel"
import { GroupSettingNameInputFields } from "../../../common/sharing/view/GroupSettingNameInputFields"

export type CalendarProperties = {
	nameData: GroupNameData
	color: string
	alarms: AlarmInterval[]
	sourceUrl: string | null
}

export const defaultCalendarProperties: Readonly<CalendarProperties> & {
	readonly nameData: Readonly<GroupNameData>
} = {
	nameData: { kind: "single", name: "" },
	color: "",
	alarms: [],
	sourceUrl: "",
}

export async function handleUrlSubscription(calendarModel: CalendarModel, url: string): Promise<string | Error> {
	if (!locator.logins.isFullyLoggedIn()) return new Error("notFullyLoggedIn_msg")

	const externalIcalStr: string | Error = await calendarModel.fetchExternalCalendar(url).catch((e) => e as Error)
	if (externalIcalStr instanceof Error || externalIcalStr.trim() === "") return new Error("fetchingExternalCalendar_error")

	if (!isIcal(externalIcalStr)) return new Error("invalidICal_error")
	return externalIcalStr
}

function sourceUrlInputField(urlStream: Stream<string>, errorMessageStream: Stream<string>) {
	const errorMessage = errorMessageStream().trim()
	let helperMessage = ""
	if (urlStream().trim() === "") helperMessage = "E.g: https://tuta.com/ics/example.ics - webcals://example.com/calendar.ics"
	else if (isNotNull(errorMessage) && errorMessage !== DEFAULT_ERROR) helperMessage = errorMessage
	return m(TextField, {
		class: `pt-16 pb-16 ${helperMessage.length ? "" : "mb-small-line-height"}`,
		value: urlStream(),
		oninput: (url: string, inputElement: HTMLInputElement) => {
			const assertionResult = checkURLString(url)
			urlStream(url)
			if (assertionResult instanceof URL) {
				errorMessageStream("")
				return
			}
			errorMessageStream(lang.get(assertionResult))
		},
		label: "url_label",
		type: TextFieldType.Url,
		helpLabel: () => m("small.block.content-fg", helperMessage),
	})
}

function createEditCalendarComponent(
	nameData: GroupNameData,
	colorStream: Stream<string>,
	calendarType: CalendarType,
	alarms: AlarmInterval[],
	urlStream: Stream<string>,
	errorMessageStream: Stream<string>,
) {
	const currentColor = colorStream() ? `#${colorStream()}` : ""
	return m.fragment({}, [
		m(GroupSettingNameInputFields, { groupNameData: nameData }),
		m(".small.mt-16.mb-4", lang.get("color_label")),
		m(ColorPickerView, {
			value: currentColor,
			onselect: (color: string) => {
				colorStream(color.substring(1))
			},
		}),
		calendarType === CalendarType.Private
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
					useNewEditor: false,
				})
			: null,
		calendarType === CalendarType.External ? sourceUrlInputField(urlStream, errorMessageStream) : null,
	])
}

export interface CreateEditDialogAttrs {
	calendarType: CalendarType
	titleTextId: TranslationKeyType
	okAction: (dialog: Dialog, calendarProperties: CalendarProperties, calendarModel?: CalendarModel) => unknown
	okTextId: TranslationKeyType
	warningMessage?: () => Children
	calendarProperties?: CalendarProperties
	isNewCalendar?: boolean
	calendarModel?: CalendarModel
}

export function showCreateEditCalendarDialog({
	calendarType,
	titleTextId,
	okAction,
	okTextId,
	warningMessage,
	calendarProperties: { nameData, color, alarms, sourceUrl } = clone(defaultCalendarProperties),
	isNewCalendar = true,
	calendarModel,
}: CreateEditDialogAttrs) {
	if (isNewCalendar && calendarType === CalendarType.External) {
		color = generateRandomColor().substring(1)
	}

	const colorStream = stream(color)
	const urlStream = stream(sourceUrl ?? "")
	const errorMessageStream = stream(DEFAULT_ERROR)

	const externalCalendarValidator = async () => {
		const assertionResult = checkURLString(urlStream())

		if (!calendarModel) throw new Error("Missing model")

		if (assertionResult instanceof URL) {
			const externalCalendarResult: string | Error = await handleUrlSubscription(calendarModel, urlStream())
			if (externalCalendarResult instanceof Error) return externalCalendarResult.message as TranslationKey
		} else {
			return assertionResult as TranslationKey
		}
		return null
	}

	const doAction = async (dialog: Dialog) => {
		okAction(
			dialog,
			{
				nameData,
				color: colorStream(),
				alarms,
				sourceUrl: urlStream().trim(),
			},
			calendarModel,
		)
	}

	const externalCalendarDialogProps = {
		title: "",
		child: {
			view: () =>
				m(".flex.col", [
					m(".mt-16.mb-16.h6.b", lang.get(titleTextId)),
					warningMessage ? warningMessage() : null,
					sourceUrlInputField(urlStream, errorMessageStream),
					m(LoginButton, {
						label: okTextId,
						onclick: () => {
							externalCalendarValidator()
								.then((validatorResult) => {
									if (validatorResult) {
										Dialog.message(validatorResult as TranslationKey)
										return
									}
									doAction(dialog)
								})
								.catch((e) => Dialog.message(lang.makeTranslation("error_message", e.message)))
						},
						class: errorMessageStream().trim() !== "" ? "mt-8 no-hover disabled-button" : "mt-8",
						disabled: errorMessageStream().trim() !== "",
					}),
				]),
		},
		okAction: null,
	}

	const dialog = Dialog.createActionDialog(
		Object.assign(
			{
				allowOkWithReturn: true,
				okActionTextId: okTextId,
				title: titleTextId,
				child: {
					view: () =>
						m(".flex.col", [
							warningMessage ? warningMessage() : null,
							createEditCalendarComponent(nameData, colorStream, calendarType, alarms, urlStream, errorMessageStream),
						]),
				},
				okAction: doAction,
			},
			isNewCalendar && calendarType === CalendarType.External ? externalCalendarDialogProps : {},
		),
	)
	dialog.show()
}

export interface EditBirthdayCalendarAttrs {
	okAction: (dialog: Dialog, newColorValue: string) => unknown
	color: string
}

export function showEditBirthdayCalendarDialog(editBirthdayCalendarAttrs: EditBirthdayCalendarAttrs) {
	const colorStream = stream("#" + editBirthdayCalendarAttrs.color)

	const doAction = async (dialog: Dialog) => {
		editBirthdayCalendarAttrs.okAction(dialog, colorStream().substring(1))
	}

	const dialog = Dialog.createActionDialog({
		allowOkWithReturn: true,
		okActionTextId: "save_action",
		title: "edit_action",
		child: {
			view: () =>
				m(".flex.col", [
					m(TextField, {
						label: "name_label",
						value: lang.get("birthdayCalendar_label"),
						isReadOnly: true,
					}),
					m(".small.mt-16.mb-4", lang.get("color_label")),
					m(ColorPickerView, {
						value: colorStream(),
						onselect: (color: string) => {
							colorStream(color)
						},
					}),
				]),
		},
		okAction: doAction,
	})
	dialog.show()
}
