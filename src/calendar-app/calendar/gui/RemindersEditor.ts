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
import { Select, SelectAttributes, SelectOption } from "../../../common/gui/base/Select.js"
import { Icon, IconSize } from "../../../common/gui/base/Icon.js"
import { BaseButton } from "../../../common/gui/base/buttons/BaseButton.js"
import { ButtonColor, getColors } from "../../../common/gui/base/Button.js"
import stream from "mithril/stream"
import { TabIndex } from "../../../common/api/common/TutanotaConstants.js"

export type RemindersEditorAttrs = {
	addAlarm: (alarm: AlarmInterval) => unknown
	removeAlarm: (alarm: AlarmInterval) => unknown
	alarms: readonly AlarmInterval[]
	label: TranslationKey
	useNewEditor: boolean
}

export interface RemindersSelectOption extends SelectOption<AlarmInterval> {
	text: string
}

export class RemindersEditor implements Component<RemindersEditorAttrs> {
	view(vnode: Vnode<RemindersEditorAttrs>): Children {
		const { addAlarm, removeAlarm, alarms, useNewEditor } = vnode.attrs
		const addNewAlarm = (newAlarm: AlarmInterval) => {
			const hasAlarm = alarms.find((alarm) => deepEqual(alarm, newAlarm))
			if (hasAlarm) return
			addAlarm(newAlarm)
		}
		return useNewEditor ? this.renderNewEditor(alarms, removeAlarm, addNewAlarm, addAlarm) : this.renderOldEditor(alarms, removeAlarm, addNewAlarm, vnode)
	}

	private renderOldEditor(
		alarms: readonly AlarmInterval[],
		removeAlarm: (alarm: AlarmInterval) => unknown,
		addNewAlarm: (newAlarm: AlarmInterval) => void,
		vnode: Vnode<RemindersEditorAttrs>,
	) {
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
								label: lang.makeTranslation(i.name, i.name),
								click: () => addNewAlarm(i.value),
							})),
							{
								label: "calendarReminderIntervalDropdownCustomItem_label",
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
			".flex.col.flex-half.pl-4",
			textFieldAttrs.map((a) => m(TextField, a)),
		)
	}

	private renderNewEditor(
		alarms: readonly AlarmInterval[],
		removeAlarm: (alarm: AlarmInterval) => unknown,
		addNewAlarm: (newAlarm: AlarmInterval) => void,
		addAlarm: (alarm: AlarmInterval) => unknown,
	) {
		const alarmOptions = createAlarmIntervalItems(lang.languageTag).map(
			(alarm) =>
				({
					text: alarm.name,
					value: alarm.value,
					ariaValue: alarm.name,
				}) satisfies RemindersSelectOption,
		)

		alarmOptions.push({
			text: lang.get("calendarReminderIntervalDropdownCustomItem_label"),
			ariaValue: lang.get("calendarReminderIntervalDropdownCustomItem_label"),
			value: { value: -1, unit: AlarmIntervalUnit.MINUTE },
		})

		const defaultSelected = {
			text: lang.get("addReminder_label"),
			value: { value: -2, unit: AlarmIntervalUnit.MINUTE },
			ariaValue: lang.get("addReminder_label"),
		}

		return m("ul.unstyled-list.flex.col.flex-grow.gap-8", [
			alarms.map((alarm) =>
				m("li.flex.justify-between.flew-grow.items-center.gap-8", [
					m("span.flex.justify-between", humanDescriptionForAlarmInterval(alarm, lang.languageTag)),
					m(
						BaseButton,
						{
							//This might not make sense in other languages, but is better than what we have now
							label: lang.makeTranslation(
								"delete_action",
								`${lang.get("delete_action")} ${humanDescriptionForAlarmInterval(alarm, lang.languageTag)}`,
							),
							onclick: () => removeAlarm(alarm),
							class: "flex items-center",
						},
						m(Icon, {
							icon: Icons.Cancel,
							size: IconSize.PX24,
							style: {
								fill: getColors(ButtonColor.Content).button,
							},
						}),
					),
				]),
			),
			m(
				"li.items-center.rel",
				m(Select<RemindersSelectOption, AlarmInterval>, {
					ariaLabel: lang.get("calendarReminderIntervalValue_label"),
					selected: defaultSelected,
					options: stream(alarmOptions),
					renderOption: (option) => this.renderReminderOptions(option, false, false),
					renderDisplay: (option) => this.renderReminderOptions(option, alarms.length > 0, true),
					onchange: (newValue) => {
						if (newValue.value.value === -1) {
							// timeout needed to prevent the custom interval dialog to be closed by the key event triggered inside the select component
							return setTimeout(() => {
								this.showCustomReminderIntervalDialog((value, unit) => {
									addNewAlarm({
										value,
										unit,
									})
								})
							}, 0)
						}
						addAlarm(newValue.value)
					},
					expanded: true,
					iconColor: getColors(ButtonColor.Content).button,
					noIcon: true,
				} satisfies SelectAttributes<RemindersSelectOption, AlarmInterval>),
			),
		])
	}

	private renderReminderOptions(option: RemindersSelectOption, hasAlarms: boolean, isDisplay: boolean) {
		return m(
			"button.items-center.flex-grow",
			{
				tabIndex: isDisplay ? TabIndex.Programmatic : undefined,
				class: isDisplay ? `flex ${hasAlarms ? "text-fade" : ""}` : "state-bg button-content button-min-height dropdown-button pt-8 pb-8",
			},
			option.text,
		)
	}

	private showCustomReminderIntervalDialog(onAddAction: (value: number, unit: AlarmIntervalUnit) => void) {
		let timeReminderValue = 0
		let timeReminderUnit: AlarmIntervalUnit = AlarmIntervalUnit.MINUTE

		Dialog.showActionDialog({
			title: "calendarReminderIntervalCustomDialog_title",
			allowOkWithReturn: true,
			child: {
				view: () => {
					const unitItems = createCustomRepeatRuleUnitValues() ?? []
					return m(".flex full-width pt-8", [
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
							class: "flex-half pl-4",
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
