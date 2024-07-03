import m, { Children, Component, Vnode } from "mithril"
import { client } from "../../../../common/misc/ClientDetector.js"
import { formatDate, formatDateWithWeekdayAndYear, formatMonthWithFullYear } from "../../../../common/misc/Formatter.js"
import type { TranslationText } from "../../../../common/misc/LanguageViewModel.js"
import { lang } from "../../../../common/misc/LanguageViewModel.js"
import { px } from "../../../../common/gui/size.js"
import { theme } from "../../../../common/gui/theme.js"

import { getStartOfDay, isSameDayOfDate } from "@tutao/tutanota-utils"
import { DateTime } from "luxon"
import { getAllDayDateLocal } from "../../../../common/api/common/utils/CommonCalendarUtils.js"
import { TextField } from "../../../../common/gui/base/TextField.js"
import type { CalendarDay } from "../../../../common/calendar/date/CalendarUtils.js"
import { parseDate } from "../../../../common/misc/DateParser.js"
import renderSwitchMonthArrowIcon from "../../../../common/gui/base/buttons/ArrowButton.js"
import { getCalendarMonth } from "../CalendarGuiUtils.js"
import { isKeyPressed, keyboardEventToKeyPress, keyHandler, KeyPress, useKeyHandler } from "../../../../common/misc/KeyManager.js"
import { Keys, TabIndex } from "../../../../common/api/common/TutanotaConstants.js"
import { AriaPopupType } from "../../../../common/gui/AriaUtils.js"

export interface DatePickerAttrs {
	date: Date
	onDateSelected: (date: Date) => unknown
	startOfTheWeekOffset: number
	label: TranslationText
	nullSelectionText?: TranslationText
	disabled?: boolean
	rightAlignDropdown?: boolean
}

/**
 * Date picker component. Looks like a text field until interacted. On mobile it will be native browser picker, on desktop a {@class VisualDatePicker}.
 *
 * The HTML input[type=date] is not usable on desktops because:
 * * it always displays a placeholder (mm/dd/yyyy) and several buttons and
 * * the picker can't be opened programmatically and
 * * the date format is based on the operating systems locale and not on the one set in the browser (and used by us)
 *
 * That is why we only use the picker on mobile devices. They provide native picker components
 * and allow opening the picker by forwarding the click event to the input.
 */
export class DatePicker implements Component<DatePickerAttrs> {
	private inputText: string = ""
	private showingDropdown: boolean = false
	private domInput: HTMLElement | null = null
	private documentInteractionListener: ((e: MouseEvent) => unknown) | null = null
	private textFieldHasFocus: boolean = false

	constructor({ attrs }: Vnode<DatePickerAttrs>) {
		const initDate = attrs.date

		if (initDate) {
			this.inputText = formatDate(initDate)
		} else {
			this.inputText = formatDate(new Date())
		}
	}

	view({ attrs }: Vnode<DatePickerAttrs>): Children {
		const date = attrs.date

		// If the user is interacting with the textfield, then we want the textfield to accept their input, so never override the text
		// Otherwise, we want to it to reflect whatever date has been passed in, because it may have been changed programmatically
		if (!this.textFieldHasFocus) {
			this.inputText = formatDate(date)
		}

		return m(".rel", [
			this.renderTextField(attrs),
			this.showingDropdown ? this.renderDropdown(attrs) : null,
			// For mobile devices we render a native date picker, it's easier to use and more accessible.
			// We render invisible input which opens native picker on interaction.
			client.isMobileDevice() ? this.renderMobileDateInput(attrs) : null,
		])
	}

	private renderTextField({ date, onDateSelected, label, nullSelectionText, disabled }: DatePickerAttrs): Children {
		return m(
			"",
			{
				onclick: () => {
					if (!disabled) {
						this.showingDropdown = true
					}
				},
			},
			m(TextField, {
				value: this.inputText,
				label,
				helpLabel: () => this.renderHelpLabel(date, nullSelectionText ?? null),
				disabled,
				hasPopup: AriaPopupType.Dialog,
				oninput: (text) => this.handleInput(text, onDateSelected),
				onfocus: (_, input) => {
					if (!disabled) {
						this.showingDropdown = true
					}
					this.textFieldHasFocus = true
				},
				onDomInputCreated: (input) => {
					if (this.domInput == null) {
						this.domInput = input
					}
				},
				onblur: () => {
					this.textFieldHasFocus = false
				},
				keyHandler: (key) => {
					if (isKeyPressed(key.key, Keys.DOWN)) {
						if (!disabled && !key.shift && !key.ctrl && !key.meta) {
							this.showingDropdown = true
						}
					}
					return this.handleEscapePress(key)
				},
			}),
		)
	}

	private handleEscapePress(key: KeyPress) {
		if (isKeyPressed(key.key, Keys.ESC) && this.showingDropdown) {
			this.domInput?.focus()
			this.showingDropdown = false
			return false
		}
		return true
	}

	private renderHelpLabel(date: Date | null, nullSelectionText: TranslationText | null): Children {
		if (this.showingDropdown) {
			return null
		} else if (date != null) {
			return formatDateWithWeekdayAndYear(date)
		} else {
			return lang.getMaybeLazy(nullSelectionText ?? "emptyString_msg")
		}
	}

	private renderDropdown({ date, onDateSelected, startOfTheWeekOffset, rightAlignDropdown, label }: DatePickerAttrs): Children {
		return m(
			".fixed.content-bg.z3.menu-shadow.plr.pb-s",
			{
				"aria-modal": "true",
				"aria-label": lang.getMaybeLazy(label),
				style: {
					width: "280px",
					right: rightAlignDropdown ? "0" : null,
				},
				oncreate: (vnode) => {
					const listener = (e: MouseEvent) => {
						if (!vnode.dom.contains(e.target as HTMLElement)) {
							this.showingDropdown = false
							m.redraw()
						}
					}

					this.documentInteractionListener = listener
					document.addEventListener("click", listener, true)
					document.addEventListener("focus", listener, true)
				},
				onremove: (vnode) => {
					if (this.documentInteractionListener) {
						document.removeEventListener("click", this.documentInteractionListener, true)
						document.removeEventListener("focus", this.documentInteractionListener, true)
					}
				},
			},
			m(VisualDatePicker, {
				selectedDate: date,
				onDateSelected: (newDate, dayClick) => {
					this.handleSelectedDate(newDate, onDateSelected)

					if (dayClick) {
						// Do not close the dropdown when changing the month
						this.domInput?.focus()
						this.showingDropdown = false
					}
				},
				keyHandler: (key: KeyPress) => this.handleEscapePress(key),
				wide: false,
				startOfTheWeekOffset: startOfTheWeekOffset,
			}),
		)
	}

	private renderMobileDateInput({ date, onDateSelected, disabled }: DatePickerAttrs): Children {
		return m("input.fill-absolute", {
			disabled: disabled,
			type: "date",
			style: {
				opacity: 0,
				// This overrides platform-specific width setting, we want to cover the whole field
				minWidth: "100%",
				minHeight: "100%",
			},
			// Format as ISO date format (YYYY-MM-dd). We use luxon for that because JS Date only supports full format with time.
			value: date != null ? DateTime.fromJSDate(date).toISODate() : "",
			oninput: (event: InputEvent) => {
				// valueAsDate is always 00:00 UTC
				// https://www.w3.org/TR/html52/sec-forms.html#date-state-typedate
				const htmlDate = (event.target as HTMLInputElement).valueAsDate
				// It can be null if user clicks "clear". Ignore it.
				if (htmlDate != null) {
					this.handleSelectedDate(getAllDayDateLocal(htmlDate), onDateSelected)
				}
			},
		})
	}

	private handleInput(text: string, onDateSelected: DatePickerAttrs["onDateSelected"]) {
		this.inputText = text
		const trimmedValue = text.trim()

		if (trimmedValue !== "") {
			try {
				const parsedDate = parseDate(trimmedValue, (referenceDate) => formatDate(referenceDate))
				onDateSelected(parsedDate)
			} catch (e) {
				// Parsing failed so the user is probably typing
			}
		}
	}

	private handleSelectedDate(date: Date, onDateSelected: DatePickerAttrs["onDateSelected"]) {
		this.inputText = formatDate(date)
		onDateSelected(date)
	}
}

type VisualDatePickerAttrs = {
	selectedDate: Date | null
	onDateSelected?: (date: Date, dayClick: boolean) => unknown
	keyHandler?: keyHandler
	wide: boolean
	startOfTheWeekOffset: number
}

/** Date picker used on desktop. Displays a month and ability to select a month. */
export class VisualDatePicker implements Component<VisualDatePickerAttrs> {
	private displayingDate: Date
	private lastSelectedDate: Date | null = null

	constructor(vnode: Vnode<VisualDatePickerAttrs>) {
		this.displayingDate = vnode.attrs.selectedDate || getStartOfDay(new Date())
	}

	view(vnode: Vnode<VisualDatePickerAttrs>): Children {
		const selectedDate = vnode.attrs.selectedDate
		if (selectedDate && !isSameDayOfDate(this.lastSelectedDate, selectedDate)) {
			this.lastSelectedDate = selectedDate
			this.displayingDate = new Date(selectedDate)

			this.displayingDate.setDate(1)
		}

		let date = new Date(this.displayingDate)
		let { weeks, weekdays } = getCalendarMonth(this.displayingDate, vnode.attrs.startOfTheWeekOffset, true)
		return m(
			".flex.flex-column",
			{
				onkeydown: (event: KeyboardEvent) => useKeyHandler(event, vnode.attrs.keyHandler),
			},
			[
				this.renderPickerHeader(vnode, date),
				m(".flex.flex-space-between", this.renderWeekDays(vnode.attrs.wide, weekdays)),
				m(
					".flex.flex-column.flex-space-around",
					{
						style: {
							fontSize: px(14),
							lineHeight: px(this.getElementWidth(vnode.attrs)),
						},
					},
					weeks.map((w) => this.renderWeek(w, vnode.attrs)),
				),
			],
		)
	}

	private renderPickerHeader(vnode: Vnode<VisualDatePickerAttrs>, date: Date): Children {
		const size = this.getElementWidth(vnode.attrs)
		return m(".flex.flex-space-between.pt-s.pb-s.items-center", [
			renderSwitchMonthArrowIcon(false, size, () => this.onPrevMonthSelected()),
			m(
				".b",
				{
					style: {
						fontSize: px(14),
					},
				},
				formatMonthWithFullYear(date),
			),
			renderSwitchMonthArrowIcon(true, size, () => this.onNextMonthSelected()),
		])
	}

	private onPrevMonthSelected() {
		this.displayingDate.setMonth(this.displayingDate.getMonth() - 1)
	}

	private onNextMonthSelected() {
		this.displayingDate.setMonth(this.displayingDate.getMonth() + 1)
	}

	private renderDay({ date, day, isPaddingDay }: CalendarDay, index: number, attrs: VisualDatePickerAttrs): Children {
		const isSelectedDay = isSameDayOfDate(date, attrs.selectedDate)
		// We need a day to tab onto if the selected day is not visible, so we use the first day of the month
		const isSubstituteDay = attrs.selectedDate?.getMonth() !== date.getMonth() && date.getDate() === 1
		const isTabbable = !isPaddingDay && (isSelectedDay || isSubstituteDay)

		const size = this.getElementWidth(attrs)
		const selector = isSelectedDay && !isPaddingDay ? ".circle.accent-bg" : ""
		return m(
			".rel.flex.items-center.justify-center",
			{
				style: {
					height: px(size),
					width: px(size),
				},
				class: isPaddingDay ? undefined : "click",
				"aria-hidden": `${isPaddingDay}`,
				"aria-label": date.toLocaleDateString(),
				"aria-selected": `${isSelectedDay}`,
				role: "option",
				tabindex: isTabbable ? TabIndex.Default : TabIndex.Programmatic,
				onclick: isPaddingDay ? undefined : () => attrs.onDateSelected?.(date, true),
				onkeydown: (event: KeyboardEvent) => {
					const key = keyboardEventToKeyPress(event)
					const target = event.target as HTMLInputElement

					if (isKeyPressed(key.key, Keys.LEFT)) {
						let targetDay

						if (target.previousElementSibling == null) {
							// If the user presses left on the first day of the week, go to the last day of the previous week
							targetDay = target.parentElement?.previousElementSibling?.children.item(6)
						} else {
							targetDay = target.previousElementSibling
						}

						if (!this.focusDayIfPossible(target, targetDay)) {
							this.onPrevMonthSelected()
							m.redraw.sync()
							this.focusLastDay(target)
						}
						event.preventDefault()
					}

					if (isKeyPressed(key.key, Keys.RIGHT)) {
						let targetDay

						if (target.nextElementSibling == null) {
							targetDay = target.parentElement?.nextElementSibling?.children.item(0)
						} else {
							targetDay = target.nextElementSibling
						}

						if (!this.focusDayIfPossible(target, targetDay)) {
							this.onNextMonthSelected()
							m.redraw.sync()
							this.focusFirstDay(target)
						}
						event.preventDefault()
					}

					if (isKeyPressed(key.key, Keys.UP)) {
						const dayAbove = target.parentElement?.previousElementSibling?.children.item(index)
						if (!this.focusDayIfPossible(target, dayAbove)) {
							// If the user presses up on the first week, go to the same day of the previous week
							this.onPrevMonthSelected()
							m.redraw.sync()
							this.focusLastWeekDay(target, index)
						}
						event.preventDefault()
					}

					if (isKeyPressed(key.key, Keys.DOWN)) {
						const dayBelow = target.parentElement?.nextElementSibling?.children.item(index)
						if (!this.focusDayIfPossible(target, dayBelow)) {
							this.onNextMonthSelected()
							m.redraw.sync()
							this.focusFirstWeekDay(target, index)
						}
						event.preventDefault()
					}

					if (isKeyPressed(key.key, Keys.HOME) && !isPaddingDay) {
						this.focusFirstDay(target)
						event.preventDefault()
					}

					if (isKeyPressed(key.key, Keys.END) && !isPaddingDay) {
						this.focusLastDay(target)
						event.preventDefault()
					}

					if (isKeyPressed(key.key, Keys.PAGE_UP) && !isPaddingDay) {
						if (key.shift) {
							this.displayingDate.setFullYear(this.displayingDate.getFullYear() - 1)
						} else {
							this.onPrevMonthSelected()
						}
						m.redraw.sync()
						this.focusFirstDay(target)
						event.preventDefault()
					}

					if (isKeyPressed(key.key, Keys.PAGE_DOWN) && !isPaddingDay) {
						if (key.shift) {
							this.displayingDate.setFullYear(this.displayingDate.getFullYear() + 1)
						} else {
							this.onNextMonthSelected()
						}
						m.redraw.sync()
						this.focusFirstDay(target)
						event.preventDefault()
					}

					if (isKeyPressed(key.key, Keys.RETURN) && !isPaddingDay) {
						attrs.onDateSelected?.(date, true)
						event.preventDefault()
					}

					if (isKeyPressed(key.key, Keys.SPACE) && !isPaddingDay) {
						attrs.onDateSelected?.(date, false)
						event.preventDefault()
					}
				},
			},
			[
				m(".abs.z1" + selector, {
					style: {
						width: px(size),
						height: px(size),
					},
				}),
				m(selector + ".full-width.height-100p.center.z2", { style: { "background-color": "transparent" } }, isPaddingDay ? null : day),
			],
		)
	}

	// Focuses on a day if it is not a padding day & returns whether it focused on the day
	private focusDayIfPossible(previousElement: HTMLElement, dayElement: globalThis.Element | null | undefined): boolean {
		const element = dayElement as HTMLInputElement | null | undefined
		if (element != null && element.ariaHidden === "false") {
			element.focus()
			// Put the currently focused element into the tab index so the next tab press follows the tab index
			element.tabIndex = 0
			previousElement.tabIndex = -1
			return true
		}
		return false
	}

	// Focus the last day of the month in the calendar
	private focusLastDay(target: HTMLInputElement) {
		const weeks = target.parentElement?.parentElement?.children
		if (weeks != null) {
			for (let i = weeks.length - 1; i >= 0; i--) {
				const week = weeks.item(i)?.children
				let isDateFound = false
				if (week != null) {
					for (let j = week.length - 1; j >= 0; j--) {
						const child = week.item(j)
						if (this.focusDayIfPossible(target, child)) {
							isDateFound = true
							break
						}
					}
				}
				if (isDateFound) break
			}
		}
	}

	// Focus a day in the final week of the calendar
	private focusLastWeekDay(target: HTMLInputElement, weekDay: number) {
		const weeks = target.parentElement?.parentElement?.children
		if (weeks != null) {
			for (let i = weeks.length - 1; i >= 0; i--) {
				const week = weeks.item(i)?.children
				if (week != null) {
					const child = week.item(weekDay)
					if (this.focusDayIfPossible(target, child)) {
						break
					}
				}
			}
		}
	}

	// Focus the first day of the month in the calendar
	private focusFirstDay(target: HTMLInputElement) {
		const weeks = target.parentElement?.parentElement?.children
		if (weeks != null) {
			for (let i = 0; i < weeks.length; i++) {
				const week = weeks.item(i)?.children
				let isDateFound = false
				if (week != null) {
					for (let j = 0; j < week.length; j++) {
						const child = week.item(j)
						if (this.focusDayIfPossible(target, child)) {
							isDateFound = true
							break
						}
					}
				}
				if (isDateFound) break
			}
		}
	}

	// Focus a day in the first week of the calendar
	private focusFirstWeekDay(target: HTMLInputElement, weekDay: number) {
		const weeks = target.parentElement?.parentElement?.children
		if (weeks != null) {
			for (let i = 0; i < weeks.length; i++) {
				const week = weeks.item(i)?.children
				if (week != null) {
					const child = week.item(weekDay)
					if (this.focusDayIfPossible(target, child)) {
						break
					}
				}
			}
		}
	}

	private getElementWidth(attrs: VisualDatePickerAttrs): number {
		return attrs.wide ? 40 : 24
	}

	private renderWeek(week: ReadonlyArray<CalendarDay>, attrs: VisualDatePickerAttrs): Children {
		return m(
			".flex.flex-space-between",
			week.map((d, i) => this.renderDay(d, i, attrs)),
		)
	}

	private renderWeekDays(wide: boolean, weekdays: readonly string[]): Children {
		const size = px(wide ? 40 : 24)
		const fontSize = px(14)
		return weekdays.map((wd) =>
			m(
				".center",
				{
					"aria-hidden": "true",
					style: {
						fontSize,
						height: size,
						width: size,
						lineHeight: size,
						color: theme.navigation_menu_icon,
					},
				},
				wd,
			),
		)
	}
}
