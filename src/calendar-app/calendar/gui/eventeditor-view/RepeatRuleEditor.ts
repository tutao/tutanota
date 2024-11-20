import m, { Child, Children, Component, Vnode } from "mithril"
import { CalendarEventWhenModel } from "../eventeditor-model/CalendarEventWhenModel.js"
import { TextFieldType } from "../../../../common/gui/base/TextField.js"
import { lang } from "../../../../common/misc/LanguageViewModel.js"
import { EndType, RepeatPeriod } from "../../../../common/api/common/TutanotaConstants.js"
import { DatePicker, DatePickerAttrs, PickerPosition } from "../pickers/DatePicker.js"

import { createCustomEndTypeOptions, createRepeatRuleOptions, customFrequenciesOptions } from "../CalendarGuiUtils.js"
import { px, size } from "../../../../common/gui/size.js"
import { Card } from "../../../../common/gui/base/Card.js"
import { RadioGroup, RadioGroupAttrs, RadioGroupOption } from "../../../../common/gui/base/RadioGroup.js"
import { SingleLineTextField, SingleLineTextFieldAttrs } from "../../../../common/gui/base/SingleLineTextField.js"

export type RepeatRuleEditorAttrs = {
	model: CalendarEventWhenModel
	startOfTheWeekOffset: number
	width: number
}

type RepeatRuleOption = RepeatPeriod | "CUSTOM" | null

export class RepeatRuleEditor implements Component<RepeatRuleEditorAttrs> {
	private repeatRuleType: RepeatRuleOption | null = null
	private repeatInterval: string = ""
	private repeatOccurrences: string = ""

	constructor({ attrs }: Vnode<RepeatRuleEditorAttrs>) {
		if (attrs.model.repeatPeriod != null) {
			this.repeatRuleType = this.getRepeatType(attrs.model.repeatPeriod, attrs.model.repeatInterval, attrs.model.repeatEndType)
		}

		this.repeatInterval = attrs.model.repeatInterval.toString()
		this.repeatOccurrences = attrs.model.repeatEndOccurrences.toString()
	}

	private getRepeatType(period: RepeatPeriod, interval: number, endTime: EndType) {
		if (interval > 1 || endTime !== EndType.Never) {
			return "CUSTOM"
		}

		return period
	}

	view({ attrs }: Vnode<RepeatRuleEditorAttrs>): Children {
		const customRuleOptions = customFrequenciesOptions.map((option) => ({
			...option,
			name: attrs.model.repeatInterval > 1 ? option.name.plural : option.name.singular,
		})) as RadioGroupOption<RepeatPeriod>[]

		return m(
			".pb.pt.flex.col.gap-vpad.fit-height",
			{
				class: this.repeatRuleType === "CUSTOM" ? "box-content" : "",
				style: {
					width: px(attrs.width),
				},
			},
			[
				m(
					Card,
					{
						style: {
							padding: `${size.vpad}px ${size.vpad_small}px`,
						},
					},
					m(RadioGroup, {
						ariaLabel: "calendarRepeating_label",
						name: "calendarRepeating_label",
						options: createRepeatRuleOptions(),
						selectedOption: this.repeatRuleType,
						onOptionSelected: (option: RepeatRuleOption) => {
							this.repeatRuleType = option
							if (option === "CUSTOM") {
								attrs.model.repeatPeriod = attrs.model.repeatPeriod ?? RepeatPeriod.DAILY
							} else {
								attrs.model.repeatInterval = 1
								attrs.model.repeatEndType = EndType.Never
								attrs.model.repeatPeriod = option as RepeatPeriod
							}
						},
						classes: ["cursor-pointer"],
					} satisfies RadioGroupAttrs<RepeatRuleOption>),
				),
				this.renderFrequencyOptions(attrs, customRuleOptions),
				this.renderEndOptions(attrs),
			],
		)
	}

	private renderEndOptions(attrs: RepeatRuleEditorAttrs) {
		if (this.repeatRuleType !== "CUSTOM") {
			return null
		}

		return m(
			Card,
			{
				style: {
					padding: `${size.vpad}px ${size.vpad_small}px`,
				},
				classes: ["flex", "col", "gap-vpad-s"],
			},
			[
				m("label", lang.get("calendarRepeatStopCondition_label")),
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
		)
	}

	private renderFrequencyOptions(attrs: RepeatRuleEditorAttrs, customRuleOptions: RadioGroupOption<RepeatPeriod>[]) {
		if (this.repeatRuleType !== "CUSTOM") {
			return null
		}

		return m(
			Card,
			{
				style: {
					padding: `${size.vpad}px ${size.vpad_small}px`,
				},
				classes: ["flex", "col", "gap-vpad-s"],
			},
			[
				m("label.flex.col", [
					lang.get("repeatsEvery_label"),
					m(SingleLineTextField, {
						type: TextFieldType.Number,
						value: this.repeatInterval,
						oninput: (newValue: number) => {
							this.repeatInterval = String(newValue)
						},
						onblur: () => {
							this.updateCustomRule(attrs.model, { interval: this.repeatInterval === "" ? undefined : Number(this.repeatInterval) })
						},
						ariaLabel: lang.get("repeatsEvery_label"),
						placeholder: lang.get("repeatsEvery_label"),
						classes: ["outlined"],
					} satisfies SingleLineTextFieldAttrs),
				]),
				m(RadioGroup, {
					ariaLabel: "intervalFrequency_label",
					name: "intervalFrequency_label",
					options: customRuleOptions,
					selectedOption: attrs.model.repeatPeriod,
					onOptionSelected: (option: RepeatPeriod) => {
						this.updateCustomRule(attrs.model, { intervalFrequency: option })
					},
					classes: ["cursor-pointer", "capitalize"],
				} satisfies RadioGroupAttrs<RepeatPeriod>),
			],
		)
	}

	private buildInjections(attrs: RepeatRuleEditorAttrs) {
		const injectionMap = new Map<string, Child>()
		injectionMap.set(
			EndType.Count,
			m(SingleLineTextField, {
				value: this.repeatOccurrences,
				oninput: (newValue: number) => {
					this.repeatOccurrences = String(newValue)
				},
				onblur: () => {
					const isEmpty = this.repeatOccurrences === ""
					if (isEmpty) {
						return (this.repeatOccurrences = String(attrs.model.repeatEndOccurrences))
					}

					attrs.model.repeatEndOccurrences = Number(this.repeatOccurrences)
				},
				ariaLabel: lang.get("occurrencesCount_label"),
				placeholder: lang.get("occurrencesCount_label"),
				type: TextFieldType.Number,
				classes: ["outlined", "full-width", "flex-grow", attrs.model.repeatEndType !== EndType.Count ? "disabled" : ""],
			} satisfies SingleLineTextFieldAttrs),
		)

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
			this.repeatInterval = whenModel.repeatInterval.toString()
		}

		if (intervalFrequency) {
			whenModel.repeatPeriod = intervalFrequency
		}
	}
}
