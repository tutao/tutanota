import m, { Children, ClassComponent, CommonAttributes, Component, Vnode } from "mithril"
import { ClientDetector } from "../../../../../platform-kit/app-env/boot/ClientDetector.js"
import { formatDate, formatDateWithWeekdayAndYear, formatMonthWithFullYear } from "../../../../../ui/utils/Formatter.js"
import type { MaybeTranslation, Translation } from "../../../../../ui/utils/LanguageViewModel.js"
import { lang } from "../../../../../ui/utils/LanguageViewModel.js"
import { rem, font_size, px } from "../../../../../ui/size.js"
import { theme } from "../../../../../ui/theme.js"

import { LegacyTextField } from "../../../../../ui/base/LegacyTextField"
import { AriaPopupType } from "../../../../../ui/AriaUtils"
import { getStartOfDay, isSameDayOfDate, memoized, NBSP } from "../../../../../platform-kit/utils"
import { getAllDayDateLocal } from "../../../../common/api/common/utils/CommonCalendarUtils.js"
import type { CalendarDay } from "../../../../common/calendar/date/CalendarUtils.js"
import { parseDate } from "../../../../common/misc/DateParser.js"
import renderSwitchMonthArrowIcon from "../../../../../ui/base/buttons/ArrowButton.js"
import { getCalendarMonth, getElementWidth } from "../CalendarGuiUtils.js"
import { isKeyPressed, keyboardEventToKeyPress, keyHandler, KeyPress, useKeyHandler } from "../../../../../ui/utils/KeyManager.js"
import { Keys } from "../../../../../ui/utils/KeyboardKeys"
import { TabIndex } from "@tutao/app-env"

// TODO(gg): Remove this option. Auto-detect available space and flip above/below position automatically. Write it as a
// general Popover/Modal component. IntersectionObserver/ResizeObserver are overkill, viewport and getClientBoundingRect
// are enough if we prevent page scrolling while the popover is open. See Adobe's React Aria from Adobe. Consider adding
// right/left alignment too since must component-libraries do that.
export enum PickerPosition {
	TOP,
	BOTTOM, // Default. Never explicitly used.
}

export interface DatePickerAttrs {
	date: Date | null
	onDateSelected: (date: Date) => unknown
	startOfTheWeekOffset: number
	label: Translation
	nullSelectionText?: MaybeTranslation
	disabled?: boolean
	position?: PickerPosition
	classes?: Array<string>
	forMailSendTime?: boolean
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
	private inputDateEl?: HTMLInputElement
	private inputTextEl?: HTMLInputElement
	private dropdownEl?: HTMLDivElement

	/**
	 * Please note we don't store a date in component state. Only `attrs.date` (passed by our parent) is passed into
	 * two `<input>` boxes, or if `attrs.date` is null, then `new Date()` i.e. today's date:
	 *
	 * `<input type="text">` When blurred, displays a long localized date (Fri, Jun 5, 2026).
	 *                       When focused, displays a numerical date (DD/MM/YYYY).
	 *
	 * `<input type="date">` Zero-width, never actually shown, because it has bad locale formatting. Used on mobile
	 *                       iOS/Android since it can spawn a native date picker popup (rendered by the browser/OS).
	 *
	 * `<VisualDatePicker>`  HTML date picker. Reads `<input type="text">`'s `.value`
	 *
	 * Care was taken to make sure the keyboard users can tab through all the elements. We set the focus and tab index
	 * as needed when the user exits their date picker (both native or VisualDatePicker)
	 *
	 * This means our parent must wire up our `date`+`onDateSelected` attributes to the same value, else our values
	 * will get out of date.
	 */

	view({ attrs }: Vnode<DatePickerAttrs>): Children {
		if (attrs.date) {
			const isoTrimmed = this.dateToInputDateValue(attrs.date)
			if (this.inputDateEl && this.inputDateEl.value !== isoTrimmed) this.inputDateEl.value = isoTrimmed
		}
		const prettyText = attrs.date
			? formatDateWithWeekdayAndYear(attrs.date) // Long locale format (Fri, Jun 5, 2026)
			: attrs.nullSelectionText
				? lang.getTranslationText(attrs.nullSelectionText)
				: NBSP
		const inputContent =
			this.inputTextEl && document.activeElement === this.inputTextEl
				? this.inputTextEl.value // Don't interrupt the user as they're typing, keep the state as is
				: this.showingDropdown || document.activeElement === this.inputDateEl || attrs.forMailSendTime
					? formatDate(attrs.date ?? new Date()) // If null, show today in their locale format (DD/MM/YYYY)
					: prettyText
		const sharedAttrs = {
			value: inputContent,
			disabled: attrs.disabled,
			oninput: (ev: InputEvent & { redraw?: false }) => {
				const parsedDate = this.inputTextEl && this.parseDate(this.inputTextEl.value)
				if (parsedDate) attrs.onDateSelected(parsedDate)
				else ev.redraw = false
			},
			onfocus: (ev: FocusEvent) => {
				// Ignore if they're _leaving_ the date picker popup/dropdown (either native or VisualDatePicker)
				if (this.showingDropdown || ev.relatedTarget === this.inputDateEl) return
				if (this.inputTextEl) {
					this.inputTextEl.value = formatDate(attrs.date ?? new Date())
				}
				if (attrs.disabled) return
				if (ClientDetector.get().isMobileDevice()) {
					this.showNativeDatePicker()
				} else {
					// Show the non-native VisualDatePicker instead
					this.showingDropdown = true
				}
			},
			onblur: (ev: FocusEvent) => {
				// Closing the dropdown does NOT happen here since they may have tabbed into the picker
				const parsedDate = this.inputTextEl && this.parseDate(this.inputTextEl.value)
				if (parsedDate) attrs.onDateSelected(parsedDate)
			},
			onkeydown: (ev: KeyboardEvent) => {
				const key = keyboardEventToKeyPress(ev)
				if (isKeyPressed(key.key, Keys.RETURN) && !attrs.disabled && !key.shift && !key.ctrl && !key.meta) {
					const parsedDate = this.inputTextEl && this.parseDate(this.inputTextEl.value)
					if (parsedDate) attrs.onDateSelected(parsedDate)
					// Toggle
					this.showingDropdown = !this.showingDropdown
				}
				if (isKeyPressed(key.key, Keys.ESC) && this.showingDropdown) {
					this.showingDropdown = false
					// Don't close any parent dialogs like CalendarEventEditDialog
					ev.stopPropagation()
				}
			},
		}
		// TODO(gg): Normalize/Fix attribute abuse across codebase, then remove this shim and use `...sharedAttrs`
		const { onkeydown, oninput, onfocus, ...sharedAttrsLegacyTextField } = sharedAttrs
		return m(".rel", { class: attrs.classes?.join(" ") }, [
			attrs.forMailSendTime
				? m(LegacyTextField, {
						label: attrs.label,
						helpLabel: () => m("", prettyText),
						hasPopup: AriaPopupType.Dialog,
						onDomInputCreated: (input) => {
							this.inputTextEl = input as HTMLInputElement
						},
						// HACK: Need to fix codebase to use real standard web APIs. Bad component design is hiding
						// real event objects, including `relatedTarget` info and Mithril's `redraw` boolean. Lost. Sad.
						keyHandler: (key) => {
							onkeydown(
								new KeyboardEvent("keydown", {
									key: key.key,
									shiftKey: key.shift,
									ctrlKey: key.ctrl,
									altKey: key.alt,
									metaKey: key.meta,
								}),
							)
							return true // HACK for TS
						},
						// HACK: Ditto
						oninput: (inputElValue, inputEl) => {
							oninput({} as InputEvent)
						},
						// HACK: Ditto
						onfocus: (wrapperEl, inputEl) => {
							onfocus({ relatedTarget: null } as FocusEvent)
						},
						// HACK: Switch to `...sharedAttrs` soon
						...sharedAttrsLegacyTextField,
					})
				: m("input[type=text].tutaui-button-outline.full-width", {
						ariaLabel: attrs.label.text,
						style: {
							"border-color": theme.outline,
							fontSize: rem(font_size.smaller_em),
							opacity: attrs.disabled ? 0.7 : 1.0,
						},
						oncreate: (vnode) => {
							this.inputTextEl = vnode.dom as HTMLInputElement
						},
						...sharedAttrs,
					}),
			// Zero-width <input type="date"> (TODO(gg): Zero-height 100% width might be better?)
			// Note: It cannot be display:none else browsers (esp iOS) won't render the native picker at all
			m("input[type=date]", {
				// We don't want users to enter via tab; if they do, they have to hit tab like 3-4 times to get out
				tabindex: TabIndex.Programmatic,
				disabled: attrs.disabled,
				style: {
					width: 0,
					// This helps browsers decide where to place their native picker under/over the input field
					position: "absolute",
					left: 0,
					// We want exactly the same height at the input[type=text] above so the native picker doesn't
					// block any words in the input field. Chose to match the border/padding instead of setting a height
					fontSize: rem(font_size.smaller_em),
					"border-width": "1px 0",
					"border-color": "transparent",
					padding: "8px 0",
					appearance: "none",
				},
				value: attrs.date ? this.dateToInputDateValue(attrs.date) : "",
				oncreate: (input) => {
					this.inputDateEl = input.dom as HTMLInputElement
				},
				// When the native picker closes on iOS, it doesn't always call oninput() and never calls onblur()
				onfocusout: () => {
					if (this.inputDateEl) this.inputDateEl.tabIndex = Number(TabIndex.Programmatic)
					const htmlDate = this.inputDateEl?.valueAsDate // Explained in comment below
					if (htmlDate) attrs.onDateSelected(getAllDayDateLocal(htmlDate))
				},
				// Unreliable to only rely on onfocusout, so also listen for when the native picker selects a date
				oninput: (ev: InputEvent) => {
					const htmlDate = this.inputDateEl?.valueAsDate // Explained in comment below
					if (htmlDate) attrs.onDateSelected(getAllDayDateLocal(htmlDate))
				},
				// Re: valueAsDate:
				// https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/valueAsDate
				// https://www.w3.org/TR/html52/sec-forms.html#date-state-typedate
				// valueAsDate is always 00:00 UTC, but we need localtime via getAllDayDateLocal(). Some browsers have a
				// clear or reset button in their native picker UI, which sets null. We ignore that for now, since our
				// parent component won't expect null in their onDateSelected() function.
			}),
			this.showingDropdown &&
				m(
					DropdownWithRootCaptureListener,
					{
						oncreate: (vnode) => {
							this.dropdownEl = vnode.dom as HTMLDivElement
						},
						label: lang.getTranslationText(attrs.label),
						position: attrs.position,
						rootCaptureListener: ({ target }) => {
							if (
								this.showingDropdown &&
								this.dropdownEl &&
								!this.dropdownEl.contains(target as Node) && // wClick in VisualDatePicker
								target !== this.inputTextEl &&
								target !== this.inputDateEl
							) {
								this.showingDropdown = false
								const parsedDate = this.inputTextEl && this.parseDate(this.inputTextEl.value)
								if (parsedDate) attrs.onDateSelected(parsedDate)
							}
						},
					},
					m(VisualDatePicker, {
						// Base the date on the typed value not attrs.date
						selectedDate: this.inputTextEl ? this.parseDate(this.inputTextEl.value) : null,
						onDateSelected: (newDate, dayClick) => {
							// Differentiate between keyboard vs click/enter selections to keep the dropdown open.
							// If they've selected a day, they aren't typing right now, so it's safe to update
							if (this.inputTextEl) this.inputTextEl.value = formatDate(newDate)
							if (!dayClick) return
							attrs.onDateSelected(newDate)
							// Order of these two lines is important: onfocus() checks this.showingDropdown value
							if (this.inputTextEl) this.inputTextEl.focus()
							this.showingDropdown = false
						},
						keyHandler: (key: KeyPress) => {
							if (isKeyPressed(key.key, Keys.ESC) && this.showingDropdown) {
								// Order of these two lines is important: onfocus() check this.showingDropdown value
								if (this.inputTextEl) this.inputTextEl.focus()
								this.showingDropdown = false
								// TODO(gg): Unintuitive boolean semantics. Use stopPropagation please.
								return false // event.stopPropagation()
							}
							return true
						},
						wide: false,
						startOfTheWeekOffset: attrs.startOfTheWeekOffset,
					}),
				),
		])
	}

	/**
	 * An `<input type="date">`'s `'.value =` must be of the form `YYYY-MM-DD` with zero-padded digits.
	 * ISO string is 2026-11-05T17:37:28.558Z, so substring is 2026-11-05
	 */
	private dateToInputDateValue(date: Date) {
		return `${date.getFullYear()}-${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`
	}

	// TODO(gg): Factor into another file to be shared by TimePicker.ts
	private showNativeDatePicker() {
		if (!this.inputDateEl) return
		// It's only unimplemented in iOS Safari+Webview (macOS is fine) but check directly rather than
		// using ClientDetector.get().isIos() in case they add support soon.
		if ("showPicker" in HTMLInputElement.prototype) {
			try {
				this.inputDateEl.showPicker()
			} catch (e) {
				// https://developer.chrome.com/blog/show-picker/#how-to
				if (e.name !== "NotAllowedError") throw e
			}
		}
		// There's no way to detect if showPicker() is no-op https://github.com/whatwg/html/issues/7790.
		// Only way to open a native picker on iOS is <input type="date"> focus(). Not even click().
		if (ClientDetector.get().isIos()) {
			this.inputDateEl.tabIndex = Number(TabIndex.Default)
			this.inputDateEl.focus()
		}
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

// TODO(gg): Discuss w Willow about these type tradeoffs
type DropdownWithRootCaptureListenerAttrs = CommonAttributes<DropdownWithRootCaptureListenerAttrs, unknown> & {
	label: string
	position?: PickerPosition
	rootCaptureListener: (event: MouseEvent | FocusEvent) => void
}
class DropdownWithRootCaptureListener implements ClassComponent<DropdownWithRootCaptureListenerAttrs> {
	private captureListener?: (e: MouseEvent) => unknown

	view({ attrs, children }: Vnode<DropdownWithRootCaptureListenerAttrs>) {
		// prettier-ignore
		return m(".abs.content-bg.z3.menu-shadow.plr-12.pb-8", {
			"aria-modal": "true",
			"aria-label": attrs.label,
			style: {
				width: "240px",
				// Note: We use `position: fixed` to create a new stacking context so the picker doesn't influence
				// overflow/scroll of modals (open the search page and change the date range to see this). However,
				// we combine `transform: translateX(0px)` to break fixed positioning so it'll scroll with the page
				position: attrs.position === PickerPosition.TOP ? "absolute" : "fixed",
			},
			oncreate: (vnode) => {
				// TODO(gg): PickerPosition.TOP is used in RepeatRuleEditor.ts where the picker can overflow the modal
				if (attrs.position === PickerPosition.TOP && vnode.dom.parentElement) {
					const bottomMargin = vnode.dom.parentElement.getBoundingClientRect().height
					;(vnode.dom as HTMLElement).style.bottom = px(bottomMargin)
				}
				// TODO(gg): Switch to `onfocusout` similar to our Select.ts (Ctrl+Shift+F for focusout)
				this.captureListener = attrs.rootCaptureListener
				const rootEl = window.tutao.root.getDom()
				setTimeout(() => {
					rootEl.addEventListener("click", this.captureListener, true)
					rootEl.addEventListener("focus", this.captureListener, true)
				}, 100)
			},
			onremove: () => {
				if (this.captureListener) {
					const rootEl = window.tutao.root.getDom()
					rootEl.removeEventListener("click", this.captureListener, true)
					rootEl.removeEventListener("focus", this.captureListener, true)
				}
			},
		},
		children)
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
				// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#the_event_listener_callback
				// Ahh it's a Mithril thing. It's in the EventDict Mithril source.
				onkeydown: (event: KeyboardEvent) => useKeyHandler(event, vnode.attrs.keyHandler),
			},
			[
				this.renderPickerHeader(vnode, date),
				m(".flex.flex-space-between", this.renderWeekDays(vnode.attrs.wide, weekdays)),
				m(
					".flex.flex-column.flex-space-around",
					{
						style: {
							fontSize: rem(font_size.smaller_em),
							lineHeight: px(getElementWidth(vnode.attrs.wide)),
						},
					},
					weeks.map((w) => this.renderWeek(w, vnode.attrs)),
				),
			],
		)
	}

	private renderPickerHeader(vnode: Vnode<VisualDatePickerAttrs>, date: Date): Children {
		const size = getElementWidth(vnode.attrs.wide)
		return m(".flex.flex-space-between.pt-8.pb-8.items-center", [
			renderSwitchMonthArrowIcon(false, size, () => this.onPrevMonthSelected()),
			m(
				".b",
				{
					style: {
						fontSize: rem(font_size.smaller_em),
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

		const size = getElementWidth(attrs.wide)
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
				tabindex: Number(isTabbable ? TabIndex.Default : TabIndex.Programmatic),
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
				m(
					selector + ".full-width.height-100p.center.z2",
					{
						style: { "background-color": "transparent" },
					},
					isPaddingDay ? null : day,
				),
			],
		)
	}

	// Focuses on a day if it is not a padding day & returns whether it focused on the day
	private focusDayIfPossible(previousElement: HTMLElement, dayElement: globalThis.Element | null | undefined): boolean {
		const element = dayElement as HTMLInputElement | null | undefined
		if (element != null && element.ariaHidden === "false") {
			element.focus()
			// Put the currently focused element into the tab index so the next tab press follows the tab index
			element.tabIndex = Number(TabIndex.Default)
			previousElement.tabIndex = Number(TabIndex.Programmatic)
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

	private renderWeek(week: ReadonlyArray<CalendarDay>, attrs: VisualDatePickerAttrs): Children {
		return m(
			".flex.flex-space-between",
			week.map((d, i) => this.renderDay(d, i, attrs)),
		)
	}

	private renderWeekDays(wide: boolean, weekdays: readonly string[]): Children {
		const size = px(getElementWidth(wide))
		const fontSize = rem(font_size.smaller_em)
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
