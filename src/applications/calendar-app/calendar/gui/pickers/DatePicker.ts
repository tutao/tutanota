import m, { Children, Component, Vnode } from "mithril"
import { ClientDetector } from "../../../../../platform-kit/app-env/boot/ClientDetector.js"
import { formatDate, formatDateWithWeekdayAndYear, formatMonthWithFullYear } from "../../../../../ui/utils/Formatter.js"
import type { MaybeTranslation, Translation } from "../../../../../ui/utils/LanguageViewModel.js"
import { lang } from "../../../../../ui/utils/LanguageViewModel.js"
import { px } from "../../../../../ui/size.js"
import { theme } from "../../../../../ui/theme.js"

import { getStartOfDay, isSameDayOfDate, memoized, NBSP, Nullable } from "../../../../../platform-kit/utils"
import { DateTime } from "luxon"
import { getAllDayDateLocal } from "../../../../common/api/common/utils/CommonCalendarUtils.js"
import type { CalendarDay } from "../../../../common/calendar/date/CalendarUtils.js"
import { parseDate } from "../../../../common/misc/DateParser.js"
import renderSwitchMonthArrowIcon from "../../../../../ui/base/buttons/ArrowButton.js"
import { getCalendarMonth } from "../CalendarGuiUtils.js"
import { isKeyPressed, keyboardEventToKeyPress, keyHandler, KeyPress, useKeyHandler } from "../../../../../ui/utils/KeyManager.js"
import { EnvProvider, TabIndex } from "../../../../../platform-kit/app-env"
import { Keys } from "../../../../../ui/utils/KeyboardKeys"

export enum PickerPosition {
	TOP,
	BOTTOM,
}

export interface DatePickerAttrs {
	date: Nullable<Date>
	onDateSelected: (date: Date) => unknown
	startOfTheWeekOffset: number
	label: Translation
	nullSelectionText?: MaybeTranslation
	disabled?: boolean
	rightAlignDropdown?: boolean
	position?: PickerPosition
	classes?: Array<string>
}

/**
 * Date picker
 *
 * We want users to see dates in their chosen locale (ex: "DD/MM/YYYY" or "Thursday, October 8th 2026") but even though
 * our app has locale settings, this doesn't update native browser elements like `<input type="date">` which read locale
 * elsewhere (i.e. browser settings, OS settings, hardcoded/compiled into browser package, shell variables like
 * LC_ALL or LANG, etc. it's unclear)
 *
 * Although HTML `<input>` accepts some styling, the content within the element and its picker (`.showPicker()`) isn't
 * always part of the DOM or can't be fully accessed, changed, or styled in CSS/JS. There's no way to know what's being
 * shown to the user. For instance, an `<input type="datetime-local">` in Firefox renders as `dd/mm/yyyy, --:-- 📅`
 * which has quirks: the format "DD/MM/YYYY" is determined by browser/OS locale (it's complicated; see above) not by
 * us; the icon can't be hidden; there's a native picker for the date but not the time; the value we get/set is always
 * in "YYYY-MM-DDTHH:MM" (24-hour) format; we can't update the user's selection to a specific area as `.setRangeText()`
 * isn't implemented; etc. The native picker on desktop looks web-ish and floats under the input element (again, not
 * part of the DOM) while on Android/iOS is usually a fullscreen OS dialog. These have great keyboard accessibility and
 * would be a lot of code to match their functionality, but ultimately we considered it worth it to try. Despite
 * that, we still want mobile users to use their native pickers in the app and on web since they'd be most expected.
 *
 * To have both cases we use a zero-height `<input type="date">`/`<input type="time">` next to a `<input type="text">`
 * and synchronize the value between them. If we zero the width instead then the iOS picker wouldn't be centered.
 * Thankfully normal text input has `.setRangeText()` so we can add keyboard tab navigation, arrow key stepping,
 * etc. later on.
 *
 * iOS Safari and iOS WebView both don't support `.showPicker()` for anything other than `<input type="file">` but in
 * our testing it's enough to use `.focus()` to open the picker.
 *
 * Links:
 * - https://stackoverflow.com/questions/21721647/ Re: `<input type="date">` localization in Chrome
 * - https://github.com/microsoft/playwright/issues/3934 Re: Locale overrides (LC_ALL, LANG) don't affect rendering
 * - https://demo.lukewarlow.dev/showPicker/ Is a good test playground
 * - https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/showPicker#browser_compatibility Re: iOS compat
 * - https://webkit.org/b/261703 Re: iOS compat
 *
 * See also {@class VisualDatePicker}
 */
export class DatePicker implements Component<DatePickerAttrs> {
	private inputText = ""
	private showingDropdown = false
	private inputDateEl: HTMLInputElement | null = null
	private inputTextEl: HTMLInputElement | null = null
	private documentInteractionListener: ((e: MouseEvent) => unknown) | null = null
	private previousPassedDownDate: Nullable<Date> = null
	private shouldUseNativePicker = false

	constructor({ attrs }: Vnode<DatePickerAttrs>) {
		this.inputText = attrs.date ? formatDate(attrs.date) : ""
		this.previousPassedDownDate = attrs.date
		// Check once rather than each render
		this.shouldUseNativePicker = ClientDetector.get().isMobileDevice()
	}

	view({ attrs }: Vnode<DatePickerAttrs>): Children {
		const date = attrs.date ?? null

		// If the user is interacting with the textfield, then we want the textfield to accept their input, so never override the text
		// Otherwise, we want to it to reflect whatever date has been passed in, because it may have been changed programmatically
		// The same day check is because sometimes focus is lost when trying to update the date. handleInput
		//  or handleSelectedDate should be called first, but it is not and the date trying to be selected is
		//  lost. So checking if the date was actually passed in "from above" is a band-aid solution for now.
		const inputTextHasFocus = document.activeElement === this.inputTextEl
		if (!inputTextHasFocus && !isSameDayOfDate(date, this.previousPassedDownDate)) {
			this.inputText = date ? formatDate(date) : ""
			this.previousPassedDownDate = date
		}
		return m(".rel", { class: attrs.classes?.join(" ") }, [
			// Zero-width (TODO: Zero-height 100% width might be better?)
			m("input[type=date]", {
				disabled: attrs.disabled,
				style: {
					// Must have exactly the same height at the input[type=text] below, so the picker doesn't overlap
					// the input field when it appears (for non-fullscreen native pickers i.e. desktop/tablets). We
					// don't set a height manually, so we just match the font/line-height/border/padding instead :)
					"border-width": "1px 0 1px",
					"border-color": "transparent",
					width: 0,
					padding: "8px 0",
					appearance: "none",
				},
				value: date != null ? DateTime.fromJSDate(date).toISODate() : "",
				oncreate: (input) => {
					this.inputDateEl = input.dom as HTMLInputElement
				},
				oninput: (event: InputEvent) => {
					this.handleNativeInput(this.inputDateEl!, onDateSelected)
				},
			}),
			m("input[type=text].tutaui-button-outline", {
				tabIndex: Number(EnvProvider.get().isApp() ? TabIndex.Programmatic : TabIndex.Default),
				disabled: attrs.disabled,
				ariaLabel: attrs.label.text,
				style: {
					"border-color": theme.outline,
					opacity: attrs.disabled ? 0.7 : 1.0,
				},
				value: date ? formatDateWithWeekdayAndYear(date) : attrs.nullSelectionText ? lang.getTranslationText(attrs.nullSelectionText) : NBSP,
				oncreate: (input) => {
					this.inputTextEl = input.dom as HTMLInputElement
				},
				oninput: (newValue: string) => (this.inputText = newValue),
				onfocus: () => {
					if (attrs.disabled) return
					// Show the VisualDatePicker HTML version
					this.showingDropdown = true
				},
				// On focus opens the dropdown, the user can tab into it, so we shouldn't close it on blur.
				// i.e. Do not use `onblur: () => { this.showingDropdown = false },`
				onkeydown: (event: KeyboardEvent) => {
					const key = keyboardEventToKeyPress(event)
					// Toggle on enter key
					if (isKeyPressed(key.key, Keys.RETURN) && !attrs.disabled && !key.shift && !key.ctrl && !key.meta) {
						if (this.showingDropdown) {
							this.handleInput(this.inputText, attrs.onDateSelected)
							this.showingDropdown = false
						} else {
							this.showingDropdown = true
						}
					}
					if (isKeyPressed(key.key, Keys.ESC) && this.showingDropdown) {
						this.inputTextEl?.focus()
						this.showingDropdown = false
						// Closes VisualDatePicker but not any parent dialogs like CalendarEventEditDialog for example:
						event.preventDefault()
						event.stopPropagation()
					}
				},
			}),
			// TODO: We would like to show the date being typed in the dropdown
			this.showingDropdown &&
				m(
					".abs.content-bg.z3.menu-shadow.plr-12.pb-8",
					{
						"aria-modal": "true",
						"aria-label": lang.getTranslationText(attrs.label),
						style: {
							width: "240px",
							right: attrs.rightAlignDropdown ? "0" : null,
						},
						oncreate: (vnode) => {
							const listener = (e: MouseEvent) => {
								if (
									// i.e. "if click/focus is NOT inside the VisualDatePicker" then hide dropdown
									!vnode.dom.contains(e.target as HTMLElement)
								) {
									// We are subscribed to two events so this listener *will* be invoked twice, but we only
									// need to do the work once.
									if (this.showingDropdown) {
										this.showingDropdown = false
										this.handleInput(this.inputText, attrs.onDateSelected)
										m.redraw()
									}
								}
							}
							if (attrs.position === PickerPosition.TOP && vnode.dom.parentElement) {
								const bottomMargin = vnode.dom.parentElement.getBoundingClientRect().height
								;(vnode.dom as HTMLElement).style.bottom = px(bottomMargin)
							}

							// TODO: What's the purpose of this? The `window.tutao.root.getDom()` is the modal overlay so
							// why not just listen on blur of the VisualDatePicker?
							this.documentInteractionListener = listener

							const inputViewDom = window.tutao.root.getDom()
							inputViewDom.addEventListener("click", listener, true)
							inputViewDom.addEventListener("focus", listener, true)
						},
						onremove: () => {
							if (this.documentInteractionListener) {
								const mainViewDom = window.tutao.root.getDom()
								mainViewDom.removeEventListener("click", this.documentInteractionListener, true)
								mainViewDom.removeEventListener("focus", this.documentInteractionListener, true)
							}
						},
					},
					[
						m(VisualDatePicker, {
							// TODO: Are we sure we want `new Date()`? What are the implications of this.
							selectedDate: this.parseDate(this.inputText) ?? date ?? new Date(),
							onDateSelected: (newDate, dayClick) => {
								// We differentiate between different selections as we sometimes* want to keep the dropdown open but still want to select the date
								// * with keyboard-based navigation space selects the date but keeps it open while return key will work like click
								this.handleSelectedDate(newDate, attrs.onDateSelected)
								if (!dayClick) return
								// We want to retain the focus on the input for accessibility, but we still want to close the dropdown.
								if (this.inputTextEl) {
									// Focus the dom input but then override the showingDropdown right after focus.
									// It should be invoked after the normal listener since the listeners are appended to the end.

									// One would think that "focus" listeners would be called on the next event loop after we call focus() but alas.
									// So make sure to add the listener first.
									this.inputTextEl.addEventListener(
										"focus",
										() => {
											this.showingDropdown = false
											m.redraw()
										},
										{ once: true },
									)
									this.inputTextEl.focus()
								}
							},
							keyHandler: (key: KeyPress) => {
								if (isKeyPressed(key.key, Keys.ESC) && this.showingDropdown) {
									this.inputTextEl?.focus()
									this.showingDropdown = false
									return false
								}
								return true
								// TODO:
								// event.preventDefault()
								// event.stopPropagation()
							},
							wide: false,
							startOfTheWeekOffset: attrs.startOfTheWeekOffset,
						}),
					],
				),
		])
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
		return m(".flex.flex-space-between.pt-8.pb-8.items-center", [
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
