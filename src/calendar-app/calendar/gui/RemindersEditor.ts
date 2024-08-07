import m, { Children, Component, Vnode } from "mithril"
import { TextField, TextFieldAttrs, TextFieldType } from "../../../common/gui/base/TextField.js"
import { createAlarmIntervalItems, createCustomRepeatRuleUnitValues, humanDescriptionForAlarmInterval } from "./CalendarGuiUtils.js"
import { lang, TranslationKey } from "../../../common/misc/LanguageViewModel.js"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { attachDropdown } from "../../../common/gui/base/Dropdown.js"
import { AlarmInterval, AlarmIntervalUnit } from "../../../common/calendar/date/CalendarUtils.js"
import { Dialog } from "../../../common/gui/base/Dialog.js"
import { DropDownSelector } from "../../../common/gui/base/DropDownSelector.js"
import { deepEqual } from "@tutao/tutanota-utils"

export type RemindersEditorAttrs = {
	addAlarm: (alarm: AlarmInterval) => unknown
	removeAlarm: (alarm: AlarmInterval) => unknown
	alarms: readonly AlarmInterval[]
	label: TranslationKey
}

export class RemindersEditor implements Component<RemindersEditorAttrs> {
	view(vnode: Vnode<RemindersEditorAttrs>): Children {
		const { addAlarm, removeAlarm, alarms } = vnode.attrs
		const addNewAlarm = (newAlarm: AlarmInterval) => {
			const hasAlarm = alarms.find((alarm) => deepEqual(alarm, newAlarm))
			if (hasAlarm) return
			addAlarm(newAlarm)
		}
		const textFieldAttrs: Array<TextFieldAttrs> = alarms.map((a) => ({
			value: humanDescriptionForAlarmInterval(a, lang.languageTag),
			label: "emptyString_msg",
			isReadOnly: true,
			injectionsRight: () =>
				m(IconButton, {
					title: "delete_action",
					icon: Icons.Cancel,
					click: () => removeAlarm(a),
				}),
		}))

		textFieldAttrs.push({
			value: lang.get("add_action"),
			label: "emptyString_msg",
			isReadOnly: true,
			injectionsRight: () =>
				m(
					IconButton,
					attachDropdown({
						mainButtonAttrs: {
							title: "add_action",
							icon: Icons.Add,
						},
						childAttrs: () => [
							...createAlarmIntervalItems(lang.languageTag).map((i) => ({
								label: () => i.name,
								click: () => addNewAlarm(i.value),
							})),
							{
								label: () => lang.get("calendarReminderIntervalDropdownCustomItem_label"),
								click: () => {
									this.showCustomReminderIntervalDialog((value, unit) => {
										addNewAlarm({
											value,
											unit,
										})
									})
								},
							},
						],
					}),
				),
		})

		textFieldAttrs[0].label = vnode.attrs.label

		return m(
			".flex.col.flex-half.pl-s",
			textFieldAttrs.map((a) => m(TextField, a)),
		)
	}

	private showCustomReminderIntervalDialog(onAddAction: (value: number, unit: AlarmIntervalUnit) => void) {
		let timeReminderValue = 0
		let timeReminderUnit: AlarmIntervalUnit = AlarmIntervalUnit.MINUTE

		Dialog.showActionDialog({
			title: () => lang.get("calendarReminderIntervalCustomDialog_title"),
			allowOkWithReturn: true,
			child: {
				view: () => {
					const unitItems = createCustomRepeatRuleUnitValues() ?? []
					return m(".flex full-width pt-s", [
						m(TextField, {
							type: TextFieldType.Number,
							min: 0,
							label: "calendarReminderIntervalValue_label",
							value: timeReminderValue.toString(),
							oninput: (v) => {
								const time = Number.parseInt(v)
								const isEmpty = v === ""
								if (!Number.isNaN(time) || isEmpty) timeReminderValue = isEmpty ? 0 : Math.abs(time)
							},
							class: "flex-half no-appearance", //Removes the up/down arrow from input number. Pressing arrow up/down key still working
						}),
						m(DropDownSelector, {
							label: "emptyString_msg",
							selectedValue: timeReminderUnit,
							items: unitItems,
							class: "flex-half pl-s",
							selectionChangedHandler: (selectedValue: AlarmIntervalUnit) => (timeReminderUnit = selectedValue as AlarmIntervalUnit),
							disabled: false,
						}),
					])
				},
			},
			okActionTextId: "add_action",
			okAction: (dialog: Dialog) => {
				onAddAction(timeReminderValue, timeReminderUnit)
				dialog.close()
			},
		})
	}
}
