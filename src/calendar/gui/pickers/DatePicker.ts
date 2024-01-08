import m, { Children, Component, Vnode } from "mithril"
import { Icons } from "../../../gui/base/icons/Icons.js"
import { client } from "../../../misc/ClientDetector.js"
import { formatDate, formatDateWithWeekdayAndYear, formatMonthWithFullYear } from "../../../misc/Formatter.js"
import type { TranslationText } from "../../../misc/LanguageViewModel.js"
import { lang } from "../../../misc/LanguageViewModel.js"
import { px } from "../../../gui/size.js"
import { theme } from "../../../gui/theme.js"
import { BootIcons } from "../../../gui/base/icons/BootIcons.js"
import { Icon } from "../../../gui/base/Icon.js"
import { getStartOfDay, isSameDayOfDate } from "@tutao/tutanota-utils"
import { DateTime } from "luxon"
import { getAllDayDateLocal } from "../../../api/common/utils/CommonCalendarUtils.js"
import { TextField } from "../../../gui/base/TextField.js"
import { Keys } from "../../../api/common/TutanotaConstants.js"
import type { CalendarDay } from "../../date/CalendarUtils.js"
import { parseDate } from "../../../misc/DateParser.js"
import { isKeyPressed } from "../../../misc/KeyManager.js"

import { getCalendarMonth } from "../CalendarGuiUtils.js"

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
	private documentClickListener: ((e: MouseEvent) => unknown) | null = null
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
				oninput: (text) => this.handleInput(text, onDateSelected),
				onfocus: () => {
					this.showingDropdown = true
					this.textFieldHasFocus = true
				},
				onblur: () => {
					this.textFieldHasFocus = false
				},
				oncreate: (vnode) => {
					this.domInput = vnode.dom as HTMLElement
				},
				keyHandler: (key) => {
					if (isKeyPressed(key.key, Keys.TAB)) {
						this.showingDropdown = false
					}

					return true
				},
			}),
		)
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

	private renderDropdown({ date, onDateSelected, startOfTheWeekOffset, rightAlignDropdown }: DatePickerAttrs): Children {
		return m(
			".fixed.content-bg.z3.menu-shadow.plr.pb-s",
			{
				style: {
					width: "280px",
					right: rightAlignDropdown ? "0" : null,
				},
				onblur: () => (this.showingDropdown = false),
				oncreate: (vnode) => {
					const listener = (e: MouseEvent) => {
						if (!vnode.dom.contains(e.target as HTMLElement)) {
							this.showingDropdown = false
							m.redraw()
						}
					}

					this.documentClickListener = listener
					document.addEventListener("click", listener, true)
				},
				onremove: (vnode) => {
					if (this.documentClickListener) {
						document.removeEventListener("click", this.documentClickListener, true)
					}
				},
			},
			m(VisualDatePicker, {
				selectedDate: date,
				onDateSelected: (newDate, dayClick) => {
					this.handleSelectedDate(newDate, onDateSelected)

					if (dayClick) {
						// Do not close dropdown on changing a month
						this.showingDropdown = false
					}
				},
				wide: false,
				startOfTheWeekOffset: startOfTheWeekOffset,
			}),
		)
	}

	private renderMobileDateInput({ date, onDateSelected }: DatePickerAttrs): Children {
		return m("input.fill-absolute", {
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
		return m(".flex.flex-column", [
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
		])
	}

	private renderPickerHeader(vnode: Vnode<VisualDatePickerAttrs>, date: Date): Children {
		return m(".flex.flex-space-between.pt-s.pb-s.items-center", [
			this.renderSwitchMonthArrowIcon(false, vnode.attrs),
			m(
				".b",
				{
					style: {
						fontSize: px(14),
					},
				},
				formatMonthWithFullYear(date),
			),
			this.renderSwitchMonthArrowIcon(true, vnode.attrs),
		])
	}

	private renderSwitchMonthArrowIcon(forward: boolean, attrs: VisualDatePickerAttrs): Children {
		const size = px(this.getElementWidth(attrs))
		return m(
			".icon.flex.justify-center.items-center.click",
			{
				onclick: forward ? () => this.onNextMonthSelected() : () => this.onPrevMonthSelected(),
				style: {
					fill: theme.content_fg,
					width: size,
					height: size,
				},
			},
			m(Icon, {
				icon: forward ? Icons.ArrowForward : BootIcons.Back,
				style: {
					fill: theme.content_fg,
				},
			}),
		)
	}

	private onPrevMonthSelected() {
		this.displayingDate.setMonth(this.displayingDate.getMonth() - 1)
	}

	private onNextMonthSelected() {
		this.displayingDate.setMonth(this.displayingDate.getMonth() + 1)
	}

	private renderDay({ date, day, isPaddingDay }: CalendarDay, attrs: VisualDatePickerAttrs): Children {
		const isSelectedDay = isSameDayOfDate(date, attrs.selectedDate)
		const size = this.getElementWidth(attrs)
		const selector = isSelectedDay ? ".circle.accent-bg" : ""
		return m(
			".rel.click.flex.items-center.justify-center",
			{
				style: {
					height: px(size),
					width: px(size),
				},
				"aria-hidden": `${isPaddingDay}`,
				"aria-label": date.toLocaleDateString(),
				"aria-selected": `${isSelectedDay}`,
				role: "option",
				onclick: isPaddingDay ? undefined : () => attrs.onDateSelected?.(date, true),
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

	private getElementWidth(attrs: VisualDatePickerAttrs): number {
		return attrs.wide ? 40 : 24
	}

	private renderWeek(week: ReadonlyArray<CalendarDay>, attrs: VisualDatePickerAttrs): Children {
		return m(
			".flex.flex-space-between",
			week.map((d) => this.renderDay(d, attrs)),
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
