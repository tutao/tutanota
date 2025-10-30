import m, { Children, Component, Vnode } from "mithril"
import { client } from "../../../../common/misc/ClientDetector.js"
import { formatDate, formatDateWithWeekdayAndYear, formatMonthWithFullYear } from "../../../../common/misc/Formatter.js"
import type { MaybeTranslation } from "../../../../common/misc/LanguageViewModel.js"
import { lang } from "../../../../common/misc/LanguageViewModel.js"
import { px } from "../../../../common/gui/size.js"
import { theme } from "../../../../common/gui/theme.js"

import { getStartOfDay, isSameDayOfDate, memoized, NBSP } from "@tutao/tutanota-utils"
import { DateTime } from "luxon"
import { getAllDayDateLocal } from "../../../../common/api/common/utils/CommonCalendarUtils.js"
import { TextField, TextFieldType } from "../../../../common/gui/base/TextField.js"
import type { CalendarDay } from "../../../../common/calendar/date/CalendarUtils.js"
import { parseDate } from "../../../../common/misc/DateParser.js"
import renderSwitchMonthArrowIcon from "../../../../common/gui/base/buttons/ArrowButton.js"
import { getCalendarMonth } from "../CalendarGuiUtils.js"
import { isKeyPressed, keyboardEventToKeyPress, keyHandler, KeyPress, useKeyHandler } from "../../../../common/misc/KeyManager.js"
import { Keys, TabIndex } from "../../../../common/api/common/TutanotaConstants.js"
import { AriaPopupType } from "../../../../common/gui/AriaUtils.js"
import { isApp, isIOSApp } from "../../../../common/api/common/Env.js"
import { InputButton, InputButtonAttributes, InputButtonVariant } from "../../../../common/gui/base/InputButton.js"

export enum PickerPosition {
	TOP,
	BOTTOM,
}

export interface DatePickerAttrs {
	date?: Date
	onDateSelected: (date: Date) => unknown
	startOfTheWeekOffset: number
	label: MaybeTranslation
	nullSelectionText?: MaybeTranslation
	disabled?: boolean
	rightAlignDropdown?: boolean
	useInputButton?: boolean
	position?: PickerPosition
	classes?: Array<string>
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
	private previousPassedDownDate?: Date

	constructor({ attrs }: Vnode<DatePickerAttrs>) {
		this.inputText = attrs.date ? formatDate(attrs.date) : ""
		this.previousPassedDownDate = attrs.date
	}

	view({ attrs }: Vnode<DatePickerAttrs>): Children {
		const date = attrs.date

		// If the user is interacting with the textfield, then we want the textfield to accept their input, so never override the text
		// Otherwise, we want to it to reflect whatever date has been passed in, because it may have been changed programmatically
		// The same day check is because sometimes focus is lost when trying to update the date. handleInput
		//  or handleSelectedDate should be called first, but it is not and the date trying to be selected is
		//  lost. So checking if the date was actually passed in "from above" is a band-aid solution for now.
		if (!this.textFieldHasFocus && !isSameDayOfDate(date, this.previousPassedDownDate)) {
			this.inputText = date ? formatDate(date) : ""
			this.previousPassedDownDate = date
		}

		return m(".rel", { class: attrs.classes?.join(" ") }, [
			!attrs.useInputButton ? this.renderTextField(attrs) : this.renderInputButtonPicker(attrs),
			this.showingDropdown ? this.renderDropdown(attrs) : null,
			// For mobile devices we render a native date picker, it's easier to use and more accessible.
			// We render invisible input which opens native picker on interaction.
			client.isMobileDevice() && !attrs.useInputButton ? this.renderMobileDateInput(attrs) : null,
		])
	}

	private renderInputButtonPicker({ disabled, date, onDateSelected, label, nullSelectionText }: DatePickerAttrs): Children {
		return m.fragment({}, [
			isApp()
				? m("input.fill-absolute.invisible.tutaui-button-outline", {
						disabled,
						type: TextFieldType.Date,
						style: {
							zIndex: 1,
							border: `2px solid ${theme.outline}`,
							width: "auto",
							height: "auto",
							padding: 0,
							appearance: "none",
							opacity: disabled ? 0.7 : 1.0,
						},
						value: date != null ? DateTime.fromJSDate(date).toISODate() : "",
						oninput: (event: InputEvent) => {
							this.handleNativeInput(event.target as HTMLInputElement, onDateSelected)
						},
					})
				: null,
			m(InputButton, {
				tabIndex: Number(isApp() ? TabIndex.Programmatic : TabIndex.Default),
				ariaLabel: lang.getTranslationText(label),
				inputValue: this.inputText,
				oninput: (newValue: string) => (this.inputText = newValue),
				display: date ? formatDateWithWeekdayAndYear(date) : nullSelectionText ? lang.getTranslationText(nullSelectionText) : NBSP,
				variant: InputButtonVariant.OUTLINE,
				disabled,
				type: TextFieldType.Text,
				onclick: () => {
					if (!disabled) {
						this.showingDropdown = true
					}
				},
				onfocus: (_, input) => {
					this.textFieldHasFocus = true
				},
				oncreate: (input: any) => {
					if (this.domInput == null) {
						this.domInput = input.dom as HTMLInputElement
					}
				},
				onblur: () => {
					this.textFieldHasFocus = false
				},
				onkeydown: (event: KeyboardEvent) => {
					const key = keyboardEventToKeyPress(event)
					if (!this.handleInputKeyEvents(key, disabled, onDateSelected)) {
						event.preventDefault()
						event.stopPropagation()
					}
				},
				containerStyle: isApp()
					? {
							zIndex: "2",
							position: "inherit",
							borderColor: "transparent",
							pointerEvents: "none",
						}
					: {},
			} satisfies InputButtonAttributes),
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
				oninput: (text) => {
					// we want to hold on to the text for when we actually want to process it
					this.inputText = text
				},
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
					return this.handleInputKeyEvents(key, disabled, onDateSelected)
				},
			}),
		)
	}

	private handleEscapePress(key: KeyPress): boolean {
		if (isKeyPressed(key.key, Keys.ESC) && this.showingDropdown) {
			this.domInput?.focus()
			this.showingDropdown = false
			return false
		}
		return true
	}

	private renderHelpLabel(date: Date | null | undefined, nullSelectionText: MaybeTranslation | null): Children {
		if (date != null) {
			return [m("", formatDateWithWeekdayAndYear(date)), nullSelectionText ? m("", lang.getTranslationText(nullSelectionText)) : null]
		} else {
			return lang.getTranslationText(nullSelectionText ?? "emptyString_msg")
		}
	}

	private renderDropdown({ date, onDateSelected, startOfTheWeekOffset, rightAlignDropdown, label, position }: DatePickerAttrs): Children {
		// We would like to show the date being typed in the dropdown
		const dropdownDate = this.parseDate(this.inputText) ?? date ?? new Date()
		return m(
			".content-bg.z3.menu-shadow.plr.pb-s",
			{
				"aria-modal": "true",
				"aria-label": lang.getTranslationText(label),
				style: {
					width: "240px",
					right: rightAlignDropdown ? "0" : null,
				},
				class: position === PickerPosition.TOP ? "abs" : "fixed",
				oncreate: (vnode) => {
					const listener = (e: MouseEvent) => {
						if (!vnode.dom.contains(e.target as HTMLElement) && !this.domInput?.contains(e.target as HTMLElement)) {
							// We are subscribed to two events so this listener *will* be invoked twice, but we only need to do the work once.
							if (this.showingDropdown) {
								this.showingDropdown = false
								this.handleInput(this.inputText, onDateSelected)
								m.redraw()
							}
						}
					}

					if (position === PickerPosition.TOP && vnode.dom.parentElement) {
						const bottomMargin = vnode.dom.parentElement.getBoundingClientRect().height
						;(vnode.dom as HTMLElement).style.bottom = px(bottomMargin)
					}

					this.documentInteractionListener = listener

					const inputViewDom = document.querySelector("#root") as HTMLElement
					inputViewDom.addEventListener("click", listener, true)
					inputViewDom.addEventListener("focus", listener, true)
				},
				onremove: () => {
					if (this.documentInteractionListener) {
						const mainViewDom = document.querySelector("#root") as HTMLElement
						mainViewDom.removeEventListener("click", this.documentInteractionListener, true)
						mainViewDom.removeEventListener("focus", this.documentInteractionListener, true)
					}
				},
			},
			m(VisualDatePicker, {
				selectedDate: dropdownDate,
				onDateSelected: (newDate, dayClick) => {
					// We differentiate between different selections as we sometimes* want to keep the dropdown open but still want to select the date
					// * with keyboard-based navigation space selects the date but keeps it open while return key will work like click
					this.handleSelectedDate(newDate, onDateSelected)
					if (dayClick) {
						// We want to retain the focus on the input for accessibility, but we still want to close the dropdown.
						if (this.domInput) {
							// Focus the dom input but then override the showingDropdown right after focus.
							// It should be invoked after the normal listener since the listeners are appended to the end.

							// One would think that "focus" listeners would be called on the next event loop after we call focus() but alas.
							// So make sure to add the listener first.
							this.domInput.addEventListener(
								"focus",
								() => {
									this.showingDropdown = false
									m.redraw()
								},
								{ once: true },
							)
							this.domInput.focus()
						}
					}
				},
				keyHandler: (key: KeyPress) => this.handleEscapePress(key),
				wide: false,
				startOfTheWeekOffset: startOfTheWeekOffset,
			}),
		)
	}

	private renderMobileDateInput({ date, onDateSelected, disabled }: DatePickerAttrs): Children {
		return m("input.fill-absolute.z1", {
			disabled: disabled,
			type: TextFieldType.Date,
			style: {
				opacity: 0,
				// This overrides platform-specific width setting, we want to cover the whole field
				minWidth: "100%",
				minHeight: "100%",
			},
			oncreate: (vnode) => {
				// We set the date's value oncreate only. Otherwise, the value would be set on every redraw, and since
				// we handle date selection onfocusout on iOS, this would result in date having an outdated value if
				// a redraw happens between input and focusout events.

				// Format as ISO date format (YYYY-MM-dd). We use luxon for that because JS Date only supports full format with time.
				const vnodeDom = vnode.dom as HTMLInputElement
				vnodeDom.value = date != null ? (DateTime.fromJSDate(date).toISODate() ?? "") : ""
			},

			// On iOS we use "onfocusout" instead of "oninput" because the native date picker changes the input immediately, triggering an "oninput" event.
			// And tapping "done" has the same effect as tapping outside the picker, it only closes the picker.
			// Note that "onfocusout" firing on picker opening and closing only happens on iOS.
			[isIOSApp() ? "onfocusout" : "oninput"]: ({ target }: { target: HTMLInputElement }) => {
				this.handleNativeInput(target, onDateSelected)
			},
		})
	}

	private handleInput(text: string, onDateSelected: DatePickerAttrs["onDateSelected"]) {
		this.inputText = text
		const parsedDate = this.parseDate(text)
		if (parsedDate) {
			onDateSelected(parsedDate)
		}
	}

	private handleSelectedDate(date: Date, onDateSelected: DatePickerAttrs["onDateSelected"]) {
		this.inputText = formatDate(date)
		onDateSelected(date)
	}

	private parseDate = memoized((text: string): Date | null => {
		const trimmedValue = text.trim()

		if (trimmedValue !== "") {
			try {
				return parseDate(trimmedValue, (referenceDate) => formatDate(referenceDate))
			} catch (e) {
				// Parsing failed so the user is probably typing
			}
		}
		return null
	})

	private handleInputKeyEvents(key: KeyPress, disabled: boolean | undefined, onDateSelected: (date: Date) => unknown): boolean {
		if (isKeyPressed(key.key, Keys.RETURN) && !disabled && !key.shift && !key.ctrl && !key.meta) {
			if (this.showingDropdown) {
				this.handleInput(this.inputText, onDateSelected)
				this.showingDropdown = false
			} else {
				this.showingDropdown = true
			}
			return false
		}
		return this.handleEscapePress(key)
	}

	private handleNativeInput(inputElement: HTMLInputElement, onDateSelected: (date: Date) => unknown) {
		// valueAsDate is always 00:00 UTC
		// https://www.w3.org/TR/html52/sec-forms.html#date-state-typedate
		const htmlDate = inputElement.valueAsDate
		// It can be null if user clicks "clear". Ignore it.
		if (htmlDate != null) {
			this.handleSelectedDate(getAllDayDateLocal(htmlDate), onDateSelected)
		}
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
						color: theme.on_surface_variant,
					},
				},
				wd,
			),
		)
	}
}
