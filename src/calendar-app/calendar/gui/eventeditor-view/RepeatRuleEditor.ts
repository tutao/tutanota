import m, { Child, Children, Component, Vnode } from "mithril"
import { CalendarEventWhenModel } from "../eventeditor-model/CalendarEventWhenModel.js"
import { TextFieldType } from "../../../../common/gui/base/TextField.js"
import { lang } from "../../../../common/misc/LanguageViewModel.js"
import { EndType, RepeatPeriod, TabIndex } from "../../../../common/api/common/TutanotaConstants.js"
import { DatePicker, DatePickerAttrs, PickerPosition } from "../pickers/DatePicker.js"

import { createCustomEndTypeOptions, createIntervalValues, createRepeatRuleOptions, IntervalOption } from "../CalendarGuiUtils.js"
import { px, size } from "../../../../common/gui/size.js"
import { Card } from "../../../../common/gui/base/Card.js"
import { RadioGroup, RadioGroupAttrs } from "../../../../common/gui/base/RadioGroup.js"
import { SingleLineTextField } from "../../../../common/gui/base/SingleLineTextField.js"
import { Select, SelectAttributes } from "../../../../common/gui/base/Select.js"
import stream from "mithril/stream"
import { theme } from "../../../../common/gui/theme.js"

export type RepeatRuleEditorAttrs = {
	model: CalendarEventWhenModel
	startOfTheWeekOffset: number
	width: number
	backAction: () => void
}

type RepeatRuleOption = RepeatPeriod | null

export class RepeatRuleEditor implements Component<RepeatRuleEditorAttrs> {
	private repeatRuleType: RepeatRuleOption | null = null
	private repeatInterval: number = 0
	private intervalOptions: stream<IntervalOption[]> = stream([])
	private intervalExpanded: boolean = false

	private numberValues: IntervalOption[] = createIntervalValues()

	private occurrencesOptions: stream<IntervalOption[]> = stream([])
	private occurrencesExpanded: boolean = false
	private repeatOccurrences: number

	constructor({ attrs }: Vnode<RepeatRuleEditorAttrs>) {
		this.intervalOptions(this.numberValues)
		this.occurrencesOptions(this.numberValues)

		this.repeatRuleType = attrs.model.repeatPeriod
		this.repeatInterval = attrs.model.repeatInterval
		this.repeatOccurrences = attrs.model.repeatEndOccurrences
	}

	view({ attrs }: Vnode<RepeatRuleEditorAttrs>): Children {
		return m(
			".pb.pt.flex.col.gap-vpad.fit-height",
			{
				class: this.repeatRuleType !== null ? "box-content" : "",
				style: {
					width: px(attrs.width),
				},
			},
			[
				m(".flex.col", [
					m("small.uppercase.pb-s.b.text-ellipsis", { style: { color: theme.navigation_button } }, "Frequency"), // TODO add label
					m(
						Card,
						{
							style: {
								padding: `${size.vpad}px`,
							},
						},
						m(RadioGroup, {
							ariaLabel: "calendarRepeating_label",
							name: "calendarRepeating_label",
							options: createRepeatRuleOptions(),
							selectedOption: this.repeatRuleType,
							onOptionSelected: (option: RepeatRuleOption) => {
								this.repeatRuleType = option
								if (option === null) {
									attrs.model.repeatInterval = 1
									attrs.model.repeatEndType = EndType.Never
									attrs.model.repeatPeriod = option
									attrs.backAction()
								} else {
									this.updateCustomRule(attrs.model, { intervalFrequency: option as RepeatPeriod })
								}
							},
							classes: ["cursor-pointer"],
						} satisfies RadioGroupAttrs<RepeatRuleOption>),
					),
				]),
				this.renderFrequencyOptions(attrs),
				this.renderEndOptions(attrs),
			],
		)
	}

	private renderEndOptions(attrs: RepeatRuleEditorAttrs) {
		if (this.repeatRuleType === null) {
			return null
		}

		return m(".flex.col", [
			m("small.uppercase.pb-s.b.text-ellipsis", { style: { color: theme.navigation_button } }, lang.get("calendarRepeatStopCondition_label")),
			m(
				Card,
				{
					style: {
						padding: `${size.vpad}px`,
					},
					classes: ["flex", "col", "gap-vpad-s"],
				},
				[
					m(RadioGroup, {
						ariaLabel: "calendarRepeatStopCondition_label",
						name: "calendarRepeatStopCondition_label",
						options: createCustomEndTypeOptions(),
						selectedOption: attrs.model.repeatEndType,
						onOptionSelected: (option: EndType) => {
							attrs.model.repeatEndType = option
						},
						classes: ["cursor-pointer"],
						injectionMap: this.buildInjections(attrs),
					} satisfies RadioGroupAttrs<EndType>),
				],
			),
		])
	}

	private renderFrequencyOptions(attrs: RepeatRuleEditorAttrs) {
		if (this.repeatRuleType === null) {
			return null
		}

		return m(".flex.col", [
			m("small.uppercase.pb-s.b.text-ellipsis", { style: { color: theme.navigation_button } }, lang.get("intervalFrequency_label")),
			m(
				Card,
				{
					style: {
						padding: `0 0 ${size.vpad}px`,
					},
					classes: ["flex", "col"],
				},
				[m("", [this.renderIntervalPicker(attrs)])],
			),
		])
	}

	private buildInjections(attrs: RepeatRuleEditorAttrs) {
		const injectionMap = new Map<string, Child>()
		injectionMap.set(EndType.Count, this.renderEndsPicker(attrs))

		injectionMap.set(
			EndType.UntilDate,
			m(DatePicker, {
				date: attrs.model.repeatEndDateForDisplay,
				onDateSelected: (date) => date && (attrs.model.repeatEndDateForDisplay = date),
				label: "endDate_label",
				useInputButton: true,
				startOfTheWeekOffset: attrs.startOfTheWeekOffset,
				position: PickerPosition.TOP,
				classes: ["full-width", "flex-grow", attrs.model.repeatEndType !== EndType.UntilDate ? "disabled" : ""],
			} satisfies DatePickerAttrs),
		)

		return injectionMap
	}

	private updateCustomRule(whenModel: CalendarEventWhenModel, customRule: Partial<{ interval: number; intervalFrequency: RepeatPeriod }>) {
		const { interval, intervalFrequency } = customRule

		if (interval && !isNaN(interval)) {
			whenModel.repeatInterval = interval
		} else {
			this.repeatInterval = whenModel.repeatInterval
		}

		if (intervalFrequency) {
			whenModel.repeatPeriod = intervalFrequency
		}
	}

	private renderIntervalPicker(attrs: RepeatRuleEditorAttrs): Children {
		return m(Select<IntervalOption, number>, {
			onchange: (newValue) => {
				if (this.repeatInterval === newValue.value) {
					return
				}

				this.repeatInterval = newValue.value
				this.updateCustomRule(attrs.model, { interval: this.repeatInterval })
				m.redraw.sync()
			},
			onclose: () => {
				this.intervalExpanded = false
			},
			selected: { value: this.repeatInterval, name: this.repeatInterval.toString(), ariaValue: this.repeatInterval.toString() },
			ariaLabel: lang.get("repeatsEvery_label"),
			options: this.intervalOptions,
			noIcon: true,
			expanded: true,
			tabIndex: Number(TabIndex.Programmatic),
			classes: ["no-appearance"],
			renderDisplay: () =>
				m(SingleLineTextField, {
					classes: ["border-radius-bottom-0"],
					value: isNaN(this.repeatInterval) ? "" : this.repeatInterval.toString(),
					oninput: (val: string) => {
						if (this.repeatInterval === Number(val)) {
							return
						}

						this.repeatInterval = val === "" ? NaN : Number(val)
						if (!isNaN(this.repeatInterval)) {
							this.intervalOptions(this.numberValues.filter((opt) => opt.value.toString().startsWith(val)))
							this.updateCustomRule(attrs.model, { interval: this.repeatInterval })
						} else {
							this.intervalOptions(this.numberValues)
						}
					},
					ariaLabel: lang.get("repeatsEvery_label"),
					onclick: (e: MouseEvent) => {
						e.stopImmediatePropagation()
						if (!this.intervalExpanded) {
							;(e.target as HTMLElement).parentElement?.click()
							this.intervalExpanded = true
						}
					},
					onfocus: (event: FocusEvent) => {
						if (!this.intervalExpanded) {
							;(event.target as HTMLElement).parentElement?.click()
							this.intervalExpanded = true
						}
					},
					onblur: (event: FocusEvent) => {
						if (isNaN(this.repeatInterval)) {
							this.repeatInterval = this.numberValues[0].value
							this.updateCustomRule(attrs.model, { interval: this.repeatInterval })
						}
					},
					style: {
						textAlign: "center",
					},
					max: 256,
					min: 1,
					type: TextFieldType.Number,
				}),
			renderOption: (option) =>
				m(
					"button.items-center.flex-grow",
					{
						class: "state-bg button-content dropdown-button pt-s pb-s button-min-height",
					},
					option.name,
				),
			keepFocus: true,
		} satisfies SelectAttributes<IntervalOption, number>)
	}

	private renderEndsPicker(attrs: RepeatRuleEditorAttrs): Child {
		return m(Select<IntervalOption, number>, {
			onchange: (newValue) => {
				if (this.repeatOccurrences === newValue.value) {
					return
				}

				this.repeatOccurrences = newValue.value
			},
			onclose: () => {
				this.occurrencesExpanded = false
			},
			selected: { value: this.repeatOccurrences, name: this.repeatOccurrences.toString(), ariaValue: this.repeatOccurrences.toString() },
			ariaLabel: lang.get("occurrencesCount_label"),
			options: this.intervalOptions,
			noIcon: true,
			expanded: true,
			tabIndex: Number(TabIndex.Programmatic),
			classes: ["no-appearance"],
			renderDisplay: () =>
				m(SingleLineTextField, {
					classes: ["tutaui-button-outline", "text-center", "border-content-message-bg"],
					value: isNaN(this.repeatOccurrences) ? "" : this.repeatOccurrences.toString(),
					oninput: (val: string) => {
						if (this.repeatOccurrences === Number(val)) {
							return
						}

						this.repeatOccurrences = val === "" ? NaN : Number(val)
					},
					ariaLabel: lang.get("occurrencesCount_label"),
					style: {
						textAlign: "center",
					},
					onclick: (e: MouseEvent) => {
						e.stopImmediatePropagation()
						if (!this.occurrencesExpanded) {
							;(e.target as HTMLElement).parentElement?.click()
							this.occurrencesExpanded = true
						}
					},
					onfocus: (event: FocusEvent) => {
						if (!this.occurrencesExpanded) {
							;(event.target as HTMLElement).parentElement?.click()
							this.occurrencesExpanded = true
						}
					},
					max: 256,
					min: 1,
					type: TextFieldType.Number,
				}),
			renderOption: (option) =>
				m(
					"button.items-center.flex-grow",
					{
						class: "state-bg button-content dropdown-button pt-s pb-s button-min-height",
					},
					option.name,
				),
			keepFocus: true,
		} satisfies SelectAttributes<IntervalOption, number>)
	}
}
