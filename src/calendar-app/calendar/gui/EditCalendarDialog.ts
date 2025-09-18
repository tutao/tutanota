import { Dialog } from "../../../common/gui/base/Dialog.js"
import m, { Children } from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { TextField, TextFieldType } from "../../../common/gui/base/TextField.js"
import { lang, type TranslationKey } from "../../../common/misc/LanguageViewModel.js"
import type { TranslationKeyType } from "../../../common/misc/TranslationKey.js"
import { clone, deepEqual, isNotNull } from "@tutao/tutanota-utils"
import { AlarmInterval, CalendarType, isExternalCalendarType, isNormalCalendarType } from "../../../common/calendar/date/CalendarUtils.js"
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

export const defaultCalendarProperties: Readonly<CalendarProperties> & { readonly nameData: Readonly<GroupNameData> } = {
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
	if (urlStream().trim() === "") helperMessage = "E.g: https://tuta.com/ics/example.ics"
	else if (isNotNull(errorMessage) && errorMessage !== DEFAULT_ERROR) helperMessage = errorMessage
	return m(TextField, {
		class: `pt pb ${helperMessage.length ? "" : "mb-small-line-height"}`,
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
	return m.fragment({}, [
		m(GroupSettingNameInputFields, { groupNameData: nameData }),
		m(".small.mt.mb-xs", lang.get("color_label")),
		m(ColorPickerView, {
			value: colorStream(),
			onselect: (color: string) => {
				colorStream(color)
			},
		}),
		nameData.kind === "single" && isNormalCalendarType(calendarType)
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
		isExternalCalendarType(calendarType) ? sourceUrlInputField(urlStream, errorMessageStream) : null,
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
	if (color !== "") {
		color = "#" + color
	} else if (isNewCalendar && isExternalCalendarType(calendarType)) {
		color = generateRandomColor()
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
				color: colorStream().substring(1),
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
					m(".mt.mb.h6.b", lang.get(titleTextId)),
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
						class: errorMessageStream().trim() !== "" ? "mt-s no-hover disabled-button" : "mt-s",
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
			isNewCalendar && isExternalCalendarType(calendarType) ? externalCalendarDialogProps : {},
		),
	)
	dialog.show()
}
