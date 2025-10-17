import m, { Child, Children, Component, Vnode } from "mithril"
import { CalendarEventWhenModel } from "../eventeditor-model/CalendarEventWhenModel.js"
import { TextFieldType } from "../../../../common/gui/base/TextField.js"
import { lang } from "../../../../common/misc/LanguageViewModel.js"
import { EndType, Keys, RepeatPeriod, TabIndex, Weekday } from "../../../../common/api/common/TutanotaConstants.js"
import { DatePicker, DatePickerAttrs, PickerPosition } from "../pickers/DatePicker.js"

import {
	createIntervalValues,
	createRepetitionValuesForWeekday,
	endTypeOptions,
	getByDayRulesFromAdvancedRules,
	IntervalOption,
	repeatRuleOptions,
	weekdayToTranslation,
} from "../CalendarGuiUtils.js"
import { px, size } from "../../../../common/gui/size.js"
import { Card } from "../../../../common/gui/base/Card.js"
import { RadioGroup, RadioGroupAttrs } from "../../../../common/gui/base/RadioGroup.js"
import { InputMode, SingleLineTextField } from "../../../../common/gui/base/SingleLineTextField.js"
import { Select, SelectAttributes } from "../../../../common/gui/base/Select.js"
import stream from "mithril/stream"
import { theme } from "../../../../common/gui/theme.js"
import { isApp } from "../../../../common/api/common/Env.js"
import { BannerType, InfoBanner, InfoBannerAttrs } from "../../../../common/gui/base/InfoBanner.js"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"
import { areAllAdvancedRepeatRulesValid } from "../../../../common/calendar/date/CalendarUtils.js"
import { isKeyPressed } from "../../../../common/misc/KeyManager.js"
import { Divider } from "../../../../common/gui/Divider.js"
import { WeekdaySelector, WeekdayToTranslation } from "./WeekdaySelector.js"
import { WeekRepetitionSelector } from "./WeekRepetitionSelector.js"
import { DateTime } from "luxon"

export type RepeatRuleEditorAttrs = {
	model: CalendarEventWhenModel
	startOfTheWeekOffset: number
	width: number
	backAction: () => void
	writeWeekdaysToModel: (weekdays: Weekday[], interval?: number) => void
}

type RepeatRuleOption = RepeatPeriod | null

/** Wrapper class for BYDAY Rules.
 * For monthly frequencies, an interval is required, and only one Weekday may be set.
 * For weekly frequencies, no interval is required, and atleast one and a maximum of 7 Weekdays have to be set.
 */
export type ByDayRule = {
	weekdays: Weekday[]
	interval?: number
}

export class RepeatRuleEditor implements Component<RepeatRuleEditorAttrs> {
	private repeatRuleType: RepeatRuleOption | null = null
	private repeatInterval: number = 0
	private intervalOptions: stream<IntervalOption[]> = stream([])
	private readonly weekdayItems: Array<WeekdayToTranslation> = weekdayToTranslation().map((wd) => {
		return { value: wd.value, label: wd.label.slice(0, 1) }
	})

	private byDayRules: ByDayRule | null = null
	private hasUnsupportedRules: boolean = false
	private numberValues: IntervalOption[] = createIntervalValues()
	private occurrencesExpanded: boolean = false
	private repeatOccurrences: number

	constructor({ attrs }: Vnode<RepeatRuleEditorAttrs>) {
		this.intervalOptions(this.numberValues)
		this.byDayRules = getByDayRulesFromAdvancedRules(attrs.model.advancedRules)

		this.repeatRuleType = attrs.model.repeatPeriod
		this.repeatInterval = attrs.model.repeatInterval
		this.repeatOccurrences = attrs.model.repeatEndOccurrences

		this.hasUnsupportedRules = !areAllAdvancedRepeatRulesValid(attrs.model.advancedRules, attrs.model.repeatPeriod)
	}

	private renderUnsupportedAdvancedRulesWarning(): Children {
		return m(InfoBanner, {
			message: () => m(".small.selectable", lang.get("unsupportedAdvancedRules_msg")),
			icon: Icons.Sync,
			type: BannerType.Info,
			buttons: [],
		} satisfies InfoBannerAttrs)
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
				this.hasUnsupportedRules ? this.renderUnsupportedAdvancedRulesWarning() : null,
				m(".flex.col", [
					m("small.uppercase.pb-s.b.text-ellipsis", { style: { color: theme.on_surface } }, lang.getTranslationText("frequency_title")),
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
							options: repeatRuleOptions,
							selectedOption: this.repeatRuleType,
							onOptionSelected: (option: RepeatRuleOption) => {
								this.repeatRuleType = option
								attrs.model.advancedRules = []
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
			m("small.uppercase.pb-s.b.text-ellipsis", { style: { color: theme.on_surface } }, lang.get("calendarRepeatStopCondition_label")),
			m(
				Card,
				{
					style: {
						padding: `${size.vpad}px`,
					},
					classes: ["flex", "col", "gap-vpad-s", "rel"],
				},
				[
					m(RadioGroup, {
						ariaLabel: "calendarRepeatStopCondition_label",
						name: "calendarRepeatStopCondition_label",
						options: endTypeOptions,
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
			m("small.uppercase.pb-s.b.text-ellipsis", { style: { color: theme.on_surface } }, lang.get("interval_title")),
			m(
				Card,
				{
					style: {
						padding: "0px", // overrides card specific padding that miss aligns divider line
					},
					classes: ["flex", "col", "rel"],
				},
				this.renderRepetitionArea(attrs),
			),
		])
	}

	private renderRepetitionArea(attrs: RepeatRuleEditorAttrs): Children {
		return [
			this.renderIntervalPicker(attrs),
			this.repeatRuleType === RepeatPeriod.WEEKLY
				? [
						m(Divider, { color: theme.outline_variant }),
						m(WeekdaySelector, {
							items: this.weekdayItems,
							selectedDays: this.byDayRules?.weekdays ?? [],
							gatherSelectedDays: attrs.writeWeekdaysToModel,
						}),
					]
				: this.repeatRuleType === RepeatPeriod.MONTHLY
					? [
							m(Divider, { color: theme.outline_variant }),
							m(WeekRepetitionSelector, {
								repetitionOptionsAndWeekday: createRepetitionValuesForWeekday(
									DateTime.fromJSDate(attrs.model.startDate).weekday,
									this.calculateWeekdayOccurrencesInMonth(attrs.model.startDate),
								),
								interval: this.byDayRules?.interval ?? 0,
								gatherSelectedDay: attrs.writeWeekdaysToModel,
							}),
						]
					: null,
		]
	}

	private buildInjections(attrs: RepeatRuleEditorAttrs) {
		const injectionMap = new Map<string, Child>()
		injectionMap.set(EndType.Count, this.renderEndsPicker(attrs))

		injectionMap.set(
			EndType.UntilDate,
			m(DatePicker, {
				date: attrs.model.repeatEndDateForDisplay,
				disabled: attrs.model.repeatEndType !== EndType.UntilDate,
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

	private updateCustomRule(
		whenModel: CalendarEventWhenModel,
		customRule: Partial<{
			interval: number
			intervalFrequency: RepeatPeriod
		}>,
	) {
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
		return m(
			".flex.rel",
			{
				style: {
					padding: "8px 14px",
					maxHeight: "44px",
				},
			},
			[
				m(".flex-grow", lang.get("repeatsEvery_label")),
				m(
					".rel",
					m(Select<IntervalOption, number>, {
						onchange: (newValue) => {
							if (this.repeatInterval === newValue.value) {
								return
							}

							this.repeatInterval = newValue.value
							this.updateCustomRule(attrs.model, { interval: this.repeatInterval })
							m.redraw.sync()
						},
						onclose: () => {},
						selected: {
							value: this.repeatInterval,
							name: this.repeatInterval.toString(),
							ariaValue: this.repeatInterval.toString(),
						},
						ariaLabel: lang.get("repeatsEvery_label"),
						options: this.intervalOptions,
						noIcon: false,
						expanded: false,
						classes: ["no-appearance"],
						renderDisplay: (option) => m(".flex.items-center.gap-vpad-s", [m("span", this.getNameAndAppendTimeFormat(option))]),
						renderOption: (option) =>
							m(
								"button.items-center.flex-grow",
								{
									...(option.value === this.repeatInterval ? { "aria-selected": "true" } : {}),
									class:
										"state-bg button-content dropdown-button pt-s pb-s button-min-height" +
										(option.value === this.repeatInterval ? "content-accent-fg row-selected icon-accent" : ""),
								},
								option.name,
							),
					} satisfies SelectAttributes<IntervalOption, number>),
				),
			],
		)
	}

	/**
	 * Appends either "Day(s)", "Week(s)", "Month(s)" or "Year(s)" to the given number value.
	 * Only do this for renderDisplay() to not re-populate the options array.
	 * @param option
	 */
	private getNameAndAppendTimeFormat(option: IntervalOption) {
		if (this.repeatRuleType === null) {
			throw new Error("repeatRuleType was null")
		}

		const isPlural = option.value > 1

		switch (this.repeatRuleType) {
			case RepeatPeriod.DAILY:
				return `${option.name} ${isPlural ? lang.get("days_label") : lang.get("day_label")}`
			case RepeatPeriod.WEEKLY:
				return `${option.name} ${isPlural ? lang.get("weeks_label") : lang.get("week_label")}`
			case RepeatPeriod.MONTHLY:
				return `${option.name} ${isPlural ? lang.get("months_label") : lang.get("month_label")}`
			case RepeatPeriod.ANNUALLY:
				return `${option.name} ${isPlural ? lang.get("years_label") : lang.get("year_label")}`
		}
	}

	private renderEndsPicker(attrs: RepeatRuleEditorAttrs): Child {
		return m(
			".rel",
			m(Select<IntervalOption, number>, {
				onchange: (newValue) => {
					if (this.repeatOccurrences === newValue.value) {
						return
					}

					this.repeatOccurrences = newValue.value
					attrs.model.repeatEndOccurrences = newValue.value
				},
				onclose: () => {
					this.occurrencesExpanded = false
					this.occurrencesExpanded = false
				},
				selected: {
					value: this.repeatOccurrences,
					name: this.repeatOccurrences.toString(),
					ariaValue: this.repeatOccurrences.toString(),
				},
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
						inputMode: isApp() ? InputMode.NONE : InputMode.TEXT,
						readonly: isApp(),
						disabled: attrs.model.repeatEndType !== EndType.Count,
						oninput: (val: string) => {
							if (this.repeatOccurrences === Number(val)) {
								return
							}

							this.repeatOccurrences = val === "" ? NaN : Number(val)
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
						onkeydown: (e: KeyboardEvent) => {
							if (isKeyPressed(e.key, Keys.RETURN) && !this.occurrencesExpanded) {
								attrs.model.repeatEndType = EndType.Count
								;(e.target as HTMLElement).parentElement?.click()
								this.occurrencesExpanded = true
								m.redraw.sync()
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
							...(option.value === this.repeatOccurrences ? { "aria-selected": "true" } : {}),
							class:
								"state-bg button-content dropdown-button pt-s pb-s button-min-height" +
								(option.value === this.repeatOccurrences ? "content-accent-fg row-selected icon-accent" : ""),
						},
						option.name,
					),
			} satisfies SelectAttributes<IntervalOption, number>),
		)
	}

	/**
	 * Calculates the amount of occurrences of the given weekday in the month.
	 * The amount of occurrences in the entire month is a sum of:
	 *  o difference of Days between given date and first day of month, rounded down
	 *  o remaining days in month, rounded down
	 *  o the date itself
	 */
	private calculateWeekdayOccurrencesInMonth(date: Date) {
		const numberOfDaysInMonth: number = DateTime.fromJSDate(date).daysInMonth as number
		return Math.floor((date.getDate() - 1) / 7) + Math.floor((numberOfDaysInMonth - date.getDate()) / 7) + 1
	}
}
