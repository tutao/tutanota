import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
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
import { LegacyTextFieldType as TextFieldType } from "../../../../../ui/base/LegacyTextField"
import { InputButton, InputButtonAttributes } from "../../../../../ui/base/InputButton"

// TODO: Ideally this would be auto-detected on available space and flip automatically but that logic would be large and
// best factored out into a more general purpose Popover-type wrapper component. IntersectionObserver and ResizeObserver
// might be overkill; viewport and getClientBoundingRect is probably enough as long as the popover is above all other
// containers (as native date picker is) and won't get stuck in a modal. Libraries like React Aria from Adobe prevent
// scrolling while the picker is open (!) which also means the math is done once at render not while scrolling.
export enum PickerPosition {
	TOP,
	BOTTOM, // Default. Never explicitly used.
}

export interface DatePickerAttrs {
	date?: Date
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
	private showingDropdown = false
	private inputDateEl?: HTMLInputElement = undefined
	private inputTextEl?: HTMLInputElement = undefined
	private clickCaptureListener?: (e: MouseEvent) => unknown = undefined

	/**
	 * Concept:
	 * <input type="date"> Zero-width, has bad locale formatting so never shown. Useful for mobile devices.
	 * <...>               UI textbox. Shows formatDateWithWeekdayAndYear (Fri, Jun 5, 2026) until focused, then
     *                     switches to DD/MM/YYYY and allows the user to type a new value. For any character input, if
     *                     the text field parses as is valid date
     * <VisualDatePicker>  Dropdown interactive calendar date picker
	 *
	 * State:
     * <input type="date"> Date value "source of truth".
	 * <input type="text"> If blurred: displays the date in localized form; if focused: displays DD/MM/YYYY editor.
     *                     Note that this changes the `input.value` which will mess up the cursor position. For state,
     *                     we sync the value with the date input.
	 * vs
	 * <input type="date"> R:attrs.date s.t native date picker opens the correct day. W:oninput:upstream(local date)
	 * <input type="text"> Swaps display:none/block. R:attrs.date to show DD/MM/YYYY. W:oninput:upstream(local date)
	 * <span>              Swaps display:none/block. R:attrs.date to show formatDateWithWeekdayAndYear. W:N/A
	 * <VisualDatePicker selectedDate={attrs.date ?? NOW} onDateSelected={() => upstream(local date)} is the R/W pair.

	 * Pro: Really simple state handling
	 * Con: If the parent doesn't wire up our date+onDateSelected to the same value, then all our inputs get out of date
	 */

	constructor({ attrs }: Vnode<DatePickerAttrs>) {
		// TODO: Can't use a DOM node as a state store if it's not yet defined...
		// this.inputDateEl.valueAsDate = attrs.date
		// Instead use attr as source of truth? Everytime we type a character it'll update the inputTextEl's oninput and
		// if the date parses successfully then we call onDateSelected, which should update our parent, who's managing
		// our `date` attr in their state. This redraws the DatePicker, so we'll have to use onbeforeupdate or onupdate
		// to make sure we don't lose focus.
	}

	view({ attrs }: Vnode<DatePickerAttrs>): Children {
		return m(".rel", { class: attrs.classes?.join(" ") }, [
			// Zero-width <input type="date"> (TODO: Zero-height 100% width might be better?)
			m("input", {
				type: TextFieldType.Date,
				tabindex: "-1",
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
				value: attrs.date ? DateTime.fromJSDate(attrs.date).toISODate() : "",
				oncreate: (input) => {
					this.inputDateEl = input.dom as HTMLInputElement
				},
				// Called when the native picker (iOS/Android) sets a date
				oninput: () => {
					// https://www.w3.org/TR/html52/sec-forms.html#date-state-typedate
					// valueAsDate is always 00:00 UTC, but we need localtime via getAllDayDateLocal(). Some browsers
					// have a "Clear" button in their native picker UI, which sets null we ignore for now since
					// consumers of DatePicker don't expect null in their onDateSelected() function.
					const htmlDate = this.inputDateEl!.valueAsDate
					if (htmlDate) attrs.onDateSelected(getAllDayDateLocal(htmlDate))
				},
			}),
			m(InputButton, {
				type: TextFieldType.Text,
				tabIndex: Number(EnvProvider.get().isApp() ? TabIndex.Programmatic : TabIndex.Default),
				disabled: attrs.disabled,
				ariaLabel: attrs.label,
				// This inputValue is only shown on click, so if our `attrs.date` is null then initialize it to today's
				// date so they know what date format to type into the box. TODO(gg): Doesn't work lol.
				inputValue: formatDate(attrs.date ?? new Date()),
				display: attrs.date
					? formatDateWithWeekdayAndYear(attrs.date)
					: attrs.nullSelectionText
						? lang.getTranslationText(attrs.nullSelectionText)
						: NBSP,
				oncreate: (input: VnodeDOM<InputButtonAttributes>) => {
					// Used for focus() tricks
					this.inputTextEl = input.dom as HTMLInputElement
				},
				// Parse the typed value and hopefully, if it's valid, display it in the currently open VisualDatePicker
				oninput: (newValue) => {
					const parsedDate = this.parseDate(newValue) // i.e. this.inputTextEl!.value
					if (parsedDate) attrs.onDateSelected(parsedDate)
					// TODO(gg): Calling onDateSelected sets `inputValue = formatDate(attrs.date)` immediately
					// overwriting our typed content... Need intermediate state? Maybe?
				},
				onfocus: () => {
					if (attrs.disabled) return
					if (ClientDetector.get().isMobileDevice()) {
						// It's only unimplemented in iOS Safari+Webview (macOS is fine) but check directly rather than
						// using ClientDetector.get().isIos() in case they add support soon.
						if ("showPicker" in HTMLInputElement.prototype) {
							this.inputDateEl!.showPicker()
						} else {
							this.inputDateEl!.focus()
							// TODO: Is this necessary? What's the behaviour like on iOS? Does it open the keyboard?
							// prettier-ignore
							this.inputDateEl!.addEventListener("blur", () => {
								this.inputTextEl!.focus()
							}, { once: true })
						}
					} else {
						// Show the non-native VisualDatePicker instead
						this.showingDropdown = true
					}
				},
				// Our onfocus opens the dropdown, but the user can tab into it, we shouldn't close it onblur.
				// i.e. Do not use `onblur: () => { this.showingDropdown = false },`
				onkeydown: (event: KeyboardEvent) => {
					const key = keyboardEventToKeyPress(event)
					if (isKeyPressed(key.key, Keys.RETURN) && !attrs.disabled && !key.shift && !key.ctrl && !key.meta) {
						const parsedDate = this.parseDate(this.inputTextEl!.value)
						if (parsedDate) attrs.onDateSelected(parsedDate)
						// Toggle
						this.showingDropdown = !this.showingDropdown
					}
					if (isKeyPressed(key.key, Keys.ESC) && this.showingDropdown) {
						// Closes VisualDatePicker but not any parent dialogs like CalendarEventEditDialog for example:
						this.showingDropdown = false
						event.stopPropagation()
					}
				},
			} satisfies InputButtonAttributes),
			this.showingDropdown &&
				m(
					".abs.content-bg.z3.menu-shadow.plr-12.pb-8",
					{
						"aria-modal": "true",
						"aria-label": lang.getTranslationText(attrs.label),
						style: {
							width: "240px",
							right: attrs.rightAlignDropdown ? "0" : null,
							// bottom: px() TODO: NEAT. PickerPosition.TOP goes UP above the element...
						},
						oncreate: (vnode) => {
							const listener = ({ target }: MouseEvent) => {
								if (
									!vnode.dom.contains(target as Node) && // Click anywhere inside calendar
									target !== this.inputTextEl &&
									target !== this.inputDateEl
								) {
									// We are subscribed to two events so this listener *will* be invoked twice, but we only
									// need to do the work once.
									if (this.showingDropdown) {
										this.showingDropdown = false
										const parsedDate = this.parseDate(this.inputDateEl!.value)
										if (parsedDate) attrs.onDateSelected(parsedDate)
									}
								}
							}
							// TODO: PickerPosition.TOP used `position: fixed` but we used `transform: translateX(0px)`
							// so fixed positioning didn't work. It'd pull the element out of the stacking context, but
							// wouldn't be "fixed" during scroll - it'd just scroll with the page - so I removed that.
							// This is only used in RepeatRuleEditor.ts where the picker could hit the modal bottom.
							if (attrs.position === PickerPosition.TOP && vnode.dom.parentElement) {
								const bottomMargin = vnode.dom.parentElement.getBoundingClientRect().height
								;(vnode.dom as HTMLElement).style.bottom = px(bottomMargin)
							}

							// TODO: Switch to `onfocusout` similar to our Select.ts (Ctrl+Shift+F for focusout)
							this.clickCaptureListener = listener

							const rootEl = window.tutao.root.getDom() as HTMLElement
							setTimeout(() => {
								rootEl.addEventListener("click", listener, true)
								rootEl.addEventListener("focus", listener, true)
							}, 100)
						},
						onremove: () => {
							if (this.clickCaptureListener) {
								const rootEl = window.tutao.root.getDom()
								rootEl.removeEventListener("click", this.clickCaptureListener, true)
								rootEl.removeEventListener("focus", this.clickCaptureListener, true)
							}
							this.inputTextEl!.focus()
						},
					},
					[
						m(VisualDatePicker, {
							// Similar to our input above, if our `attrs.date` is null then initialize it to today's date
							selectedDate: attrs.date ?? new Date(),
							onDateSelected: (newDate, dayClick) => {
								// Differentiate between keyboard vs click/enter selections to keep the dropdown open
								if (!dayClick) return
								attrs.onDateSelected(newDate)
								// Order of these two lines is important: onfocus() sets this.showingDropdown to true
								this.inputTextEl!.focus()
								this.showingDropdown = false
							},
							// TODO(gg): Unintuitive boolean semantics here. Returning false. Ahh it's a Mithril thing...
							keyHandler: (key: KeyPress) => {
								if (isKeyPressed(key.key, Keys.ESC) && this.showingDropdown) {
									// Order of these two lines is important: onfocus() sets this.showingDropdown to true
									this.inputTextEl!.focus()
									this.showingDropdown = false
									return false
								}
								return true
							},
							wide: false,
							startOfTheWeekOffset: attrs.startOfTheWeekOffset,
						}),
					],
				),
		])
	}

	private parseDate = memoized((text: string): Date | null => {
		try {
			return parseDate(text.trim(), (referenceDate) => formatDate(referenceDate))
		} catch (e) {
			// Parsing failed so the user is probably typing
			return null
		}
	})
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
				// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#the_event_listener_callback
				// ???
				// Ahh it's a Mithril thing. It's in the EventDict Mithril source. Yikes.
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
