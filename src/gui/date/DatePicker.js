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
import type {lazy} from "../../api/common/utils/Utils"
import {Icon} from "../base/Icon"
import {getStartOfDay, isSameDayOfDate} from "../../api/common/utils/DateUtils"
import {DateTime} from "luxon"
import {getAllDayDateLocal} from "../../api/common/utils/CommonCalendarUtils"
import {TextFieldN} from "../base/TextFieldN"
import {Keys} from "../../api/common/TutanotaConstants"
import type {CalendarDay} from "../../calendar/date/CalendarUtils"
import {getCalendarMonth, getDateIndicator} from "../../calendar/date/CalendarUtils"
import {parseDate} from "../../misc/DateParser"

export interface DatePickerAttrs {
	date: Stream<?Date>,
	startOfTheWeekOffset: number,
	label: TranslationText,
	nullSelectionText?: TranslationText,
	disabled?: boolean
}

export class DatePicker implements MComponent<DatePickerAttrs> {

	inputText: string = ""
	previousDate: ?Date = null
	showingDropdown: boolean = false
	domInput: ?HTMLElement = null
	invalidDate: boolean = false
	documentClickListener: ?MouseEventListener = null

	// We want to respond to the date being changed programatically and update the text in the text field
	// Unless the user is typing
	doOverwriteText: boolean = false

	constructor({attrs}: Vnode<DatePickerAttrs>) {
		const initDate = attrs.date()
		if (initDate) {
			this.inputText = formatDate(initDate)
		} else {
			this.inputText = formatDate(new Date())
		}

		attrs.date.map(date => {
			if (this.doOverwriteText && date) {
				this.inputText = formatDate(date)
			}
		})
	}

	view({attrs}: Vnode<DatePickerAttrs>): Children {
		const date = attrs.date()

		const onTextFieldInput = (text: string) => {
			this.inputText = text
			this.doOverwriteText = false
			try {
				const trimmedValue = text.trim()
				const newDate = trimmedValue !== ""
					? parseDate(trimmedValue)
					: null
				this.invalidDate = false
				attrs.date(newDate)
			} catch (e) {
				this.invalidDate = true
				attrs.date(null)
			}
			this.doOverwriteText = true
		}

		const onDropdownDateSelected = (newDate: Date) => {
			this.invalidDate = false
			this.inputText = formatDate(newDate)
			attrs.date(newDate)
		}

		const helpLabel = () => {
			if (this.showingDropdown) {
				return null
			} else if (this.invalidDate) {
				return lang.get("invalidDateFormat_msg", {"{1}": formatDate(new Date())})
			} else if (date != null) {
				return formatDateWithWeekdayAndYear(date)
			} else {
				return lang.getMaybeLazy(attrs.nullSelectionText ?? "emptyString_msg")
			}
		}

		return m("", [
			this.renderTextField(this.inputText, attrs.label, helpLabel, attrs.disabled === true, onTextFieldInput),
			this.showingDropdown
				? this.renderDropdown(date, attrs.startOfTheWeekOffset, onDropdownDateSelected)
				: null,
			// For mobile devices we render a native date picker, it's easier to use and more accessible.
			// We render invisible input which opens native picker on interaction.
			client.isMobileDevice()
				? this.renderMobileDateInput(date, onDropdownDateSelected)
				: null,
		])
	}

	renderTextField(
		text: string,
		label: TranslationText,
		helpLabel: lazy<string | null>,
		disabled: boolean,
		onInput: string => mixed
	): Children {
		return m("", {
			onclick: () => {
				if (!disabled) {
					this.showingDropdown = true
				}
			},
		}, m(TextFieldN, {
			value: () => text,
			label,
			helpLabel,
			disabled,
			oninput: onInput,
			onfocus: () => {
				this.showingDropdown = true
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

	renderDropdown(date: ?Date, startOfTheWeekOffset: number, onSelected: Date => mixed): Children {
		return m(".fixed.content-bg.z3.menu-shadow.plr.pb-s", {
			style: {
				width: "280px"
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

	renderMobileDateInput(date: ?Date, setDate: Date => mixed): Children {
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
				setDate(getAllDayDateLocal(event.target.valueAsDate))
			},
		})
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
			onclick: forward ? () => this._onNextMonthSelected(attrs) : () => this._onPrevMonthSelected(attrs),
			style: {
				fill: theme.content_fg,
				width: size,
				height: size,
			},
		}, m(Icon, {icon: forward ? Icons.ArrowForward : BootIcons.Back, style: {fill: theme.content_fg}}))
	}

	_onPrevMonthSelected: ((attrs: VisualDatePickerAttrs) => void) = (attrs: VisualDatePickerAttrs) => {
		this._displayingDate.setMonth(this._displayingDate.getMonth() - 1)
	}

	_onNextMonthSelected: ((attrs: VisualDatePickerAttrs) => void) = (attrs: VisualDatePickerAttrs) => {
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

function addMonth(date: Date, toAdd: number): Date {
	if (client.isIE()) {
		const newDate = new Date(date)
		newDate.setMonth(newDate.getMonth() + toAdd)
		return newDate
	} else {
		return DateTime.fromJSDate(date).plus({months: toAdd}).toJSDate()
	}
}


