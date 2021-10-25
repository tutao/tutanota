//@flow
import m from "mithril"
import {Icons} from "../base/icons/Icons"
import {client} from "../../misc/ClientDetector"
import {formatDate, formatDateWithWeekdayAndYear, formatMonthWithFullYear} from "../../misc/Formatter"
import type {TranslationText} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {px} from "../size"
import {theme} from "../theme"
import {BootIcons} from "../base/icons/BootIcons"
import {Icon} from "../base/Icon"
import {getStartOfDay, isSameDayOfDate} from "../../api/common/utils/DateUtils"
import {DateTime} from "luxon"
import {getAllDayDateLocal} from "../../api/common/utils/CommonCalendarUtils"
import {TextFieldN} from "../base/TextFieldN"
import {Keys} from "../../api/common/TutanotaConstants"
import type {CalendarDay} from "../../calendar/date/CalendarUtils"
import {getCalendarMonth, getDateIndicator} from "../../calendar/date/CalendarUtils"
import {parseDate} from "../../misc/DateParser"

/**
 * The HTML input[type=date] is not usable on desktops because:
 * * it always displays a placeholder (mm/dd/yyyy) and several buttons and
 * * the picker can't be opened programmatically and
 * * the date format is based on the operating systems locale and not on the one set in the browser (and used by us)
 *
 * That is why we only use the picker on mobile devices. They provide native picker components
 * and allow opening the picker by forwarding the click event to the input.
 */
export interface DatePickerAttrs {
	date: Date,
	onDateSelected: Date => mixed,
	startOfTheWeekOffset: number,
	label: TranslationText,
	nullSelectionText?: TranslationText,
	disabled?: boolean,
	rightAlignDropdown?: bool
}

export class DatePicker implements MComponent<DatePickerAttrs> {

	inputText: string = ""
	showingDropdown: boolean = false
	domInput: ?HTMLElement = null
	documentClickListener: ?MouseEventListener = null

	textFieldHasFocus: boolean = false

	constructor({attrs}: Vnode<DatePickerAttrs>) {
		const initDate = attrs.date
		if (initDate) {
			this.inputText = formatDate(initDate)
		} else {
			this.inputText = formatDate(new Date())
		}
	}

	view({attrs}: Vnode<DatePickerAttrs>): Children {

		const date = attrs.date

		// If the user is interacting with the textfield, then we want the textfield to accept their input, so never override the text
		// Otherwise, we want to it to reflect whatever date has been passed in, because it may have been changed programatically
		if (!this.textFieldHasFocus) {
			this.inputText = formatDate(date)
		}

		return m(".rel", [
			this._renderTextField(attrs),
			this.showingDropdown
				? this._renderDropdown(attrs)
				: null,
			// For mobile devices we render a native date picker, it's easier to use and more accessible.
			// We render invisible input which opens native picker on interaction.
			client.isMobileDevice()
				? this._renderMobileDateInput(attrs)
				: null,
		])
	}

	_renderTextField(
		{
			date,
			onDateSelected,
			label,
			nullSelectionText,
			disabled
		}: DatePickerAttrs,
	): Children {
		return m("", {
			onclick: () => {
				if (!disabled) {
					this.showingDropdown = true
				}
			},
		}, m(TextFieldN, {
			value: () => this.inputText,
			label,
			helpLabel: () => this._renderHelpLabel(date, nullSelectionText),
			disabled,
			oninput: this._getTextInputHandler(onDateSelected),
			onfocus: () => {
				this.showingDropdown = true
				this.textFieldHasFocus = true
			},
			onblur: () => {
				this.textFieldHasFocus = false
			},
			oncreate: (vnode) => {
				this.domInput = vnode.dom
			},
			keyHandler: (key) => {
				if (key.keyCode === Keys.TAB.code) {
					this.showingDropdown = false
				}
				return true
			}
		}))
	}

	_renderHelpLabel(date: ?Date, nullSelectionText: ?TranslationText): Children {
		if (this.showingDropdown) {
			return null
		} else if (date != null) {
			return formatDateWithWeekdayAndYear(date)
		} else {
			return lang.getMaybeLazy(nullSelectionText ?? "emptyString_msg")
		}
	}

	_renderDropdown(
		{
			date,
			onDateSelected,
			startOfTheWeekOffset,
			rightAlignDropdown,
		}: DatePickerAttrs
	): Children {

		const onSelected = this._getDateSelectedHandler(onDateSelected)
		return m(".fixed.content-bg.z3.menu-shadow.plr.pb-s", {
			style: {
				width: "280px",
				right: rightAlignDropdown ? "0" : null
			},
			onblur: () => this.showingDropdown = false,
			oncreate: (vnode) => {
				const listener: MouseEventListener = (e) => {
					if (!vnode.dom.contains(e.target)) {
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
			}
		}, m(VisualDatePicker, {
			selectedDate: date,
			onDateSelected: (newDate, dayClick) => {
				onSelected(newDate)
				if (dayClick) { // Do not close dropdown on changing a month
					this.showingDropdown = false
				}
			},
			wide: false,
			startOfTheWeekOffset: startOfTheWeekOffset
		}))
	}

	_renderMobileDateInput({date, onDateSelected}: DatePickerAttrs): Children {
		const onSelected = this._getDateSelectedHandler(onDateSelected)
		return m("input.fill-absolute", {
			type: "date",
			style: {
				opacity: 0,
				// This overrides platform-specific width setting, we want to cover the whole field
				minWidth: "100%",
				minHeight: "100%"
			},
			// Format as ISO date format (YYYY-MM-dd). We use luxon for that because JS Date only supports full format with time.
			value: date != null ? DateTime.fromJSDate(date).toISODate() : "",
			oninput: (event) => {
				// valueAsDate is always 00:00 UTC
				// https://www.w3.org/TR/html52/sec-forms.html#date-state-typedate
				onSelected(getAllDayDateLocal(event.target.valueAsDate))
			},
		})
	}

	_getTextInputHandler(setDateCallback: Date => mixed): string => mixed {
		return text => {
			this.inputText = text
			const trimmedValue = text.trim()
			if (trimmedValue !== "") {
				try {
					const parsedDate = parseDate(trimmedValue)
					setDateCallback(parsedDate)
				} catch (e) {
					// Parsing failed so the user is probably typing
				}
			}
		}
	}

	_getDateSelectedHandler(setDateCallback: Date => mixed): Date => mixed {
		return date => {
			this.inputText = formatDate(date)
			setDateCallback(date)
		}
	}
}

type VisualDatePickerAttrs = $Attrs<{
	selectedDate: ?Date,
	onDateSelected?: (date: Date, dayClick: boolean) => mixed;
	wide: boolean,
	startOfTheWeekOffset: number
}>

export class VisualDatePicker implements MComponent<VisualDatePickerAttrs> {
	_displayingDate: Date;
	_lastSelectedDate: ?Date;

	constructor(vnode: Vnode<VisualDatePickerAttrs>) {
		this._displayingDate = vnode.attrs.selectedDate || getStartOfDay(new Date())
	}

	view(vnode: Vnode<VisualDatePickerAttrs>): Children {
		const selectedDate = vnode.attrs.selectedDate
		if (selectedDate && !isSameDayOfDate(this._lastSelectedDate, selectedDate)) {
			this._lastSelectedDate = selectedDate
			this._displayingDate = new Date(selectedDate)
			this._displayingDate.setDate(1)
		}

		let date = new Date(this._displayingDate)
		const {weeks, weekdays} = getCalendarMonth(this._displayingDate, vnode.attrs.startOfTheWeekOffset, true)

		return m(".flex.flex-column", [
			m(".flex.flex-space-between.pt-s.pb-s.items-center", [
				this._switchMonthArrowIcon(false, vnode.attrs),
				m(".b", {
					style: {
						fontSize: px(14)
					}
				}, formatMonthWithFullYear(date)),
				this._switchMonthArrowIcon(true, vnode.attrs)
			]),
			m(".flex.flex-space-between", this._weekdaysVdom(vnode.attrs.wide, weekdays)),
			m(".flex.flex-column.flex-space-around", {
				style: {
					fontSize: px(14),
					lineHeight: px((this._elWidth(vnode.attrs)))
				}
			}, weeks.map(w => this._weekVdom(w, vnode.attrs)))
		])
	}

	_switchMonthArrowIcon(forward: boolean, attrs: VisualDatePickerAttrs): Children {
		const size = px(this._elWidth(attrs))
		return m(".icon.flex.justify-center.items-center.click", {
			onclick: forward
				? () => this._onNextMonthSelected()
				: () => this._onPrevMonthSelected(),
			style: {
				fill: theme.content_fg,
				width: size,
				height: size,
			},
		}, m(Icon, {icon: forward ? Icons.ArrowForward : BootIcons.Back, style: {fill: theme.content_fg}}))
	}

	_onPrevMonthSelected() {
		this._displayingDate.setMonth(this._displayingDate.getMonth() - 1)
	}

	_onNextMonthSelected() {
		this._displayingDate.setMonth(this._displayingDate.getMonth() + 1)
	}

	_dayVdom({date, day, paddingDay}: CalendarDay, attrs: VisualDatePickerAttrs): Children {
		const size = px(this._elWidth(attrs))
		return m(".center.click" + (paddingDay ? "" : getDateIndicator(date, attrs.selectedDate)), {
			style: {
				height: size,
				width: size,
			},
			onclick: !paddingDay && (() => {
				attrs.onDateSelected && attrs.onDateSelected(date, true)
			})
		}, paddingDay ? null : day)
	}

	_elWidth(attrs: VisualDatePickerAttrs): number {
		return attrs.wide ? 40 : 24
	}

	_weekVdom(week: Array<CalendarDay>,
	          attrs: VisualDatePickerAttrs): Children {
		return m(".flex.flex-space-between", week.map(d => this._dayVdom(d, attrs)))
	}

	_weekdaysVdom(wide: boolean, weekdays: string[]): Children {
		const size = px(wide ? 40 : 24)
		const fontSize = px(14)
		return weekdays.map(wd => m(".center", {
				style: {
					fontSize,
					height: size,
					width: size,
					lineHeight: size,
					color: theme.content_border,
				}
			}, wd)
		)
	}
}