//@flow
import {TextField} from "./TextField"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Icons} from "./icons/Icons"
import {Button} from "./Button"
import {client} from "../../misc/ClientDetector"
import {formatDate, formatDateWithMonth, formatMonthWithFullYear, parseDate} from "../../misc/Formatter"
import {lang} from "../../misc/LanguageViewModel"
import {px} from "../size"
import {Dialog} from "./Dialog"
import {theme} from "../theme"
import {BootIcons} from "./icons/BootIcons"
import {neverNull} from "../../api/common/utils/Utils"
import {Icon} from "./Icon"
import {getDateIndicator, getStartOfDay, isSameDayOfDate} from "../../api/common/utils/DateUtils"
import type {CalendarDay} from "../../calendar/CalendarUtils"
import {getCalendarMonth} from "../../calendar/CalendarUtils"
import {DateTime} from "luxon"
import {logins} from "../../api/main/LoginController"
import {getStartOfTheWeekOffset} from "../../calendar/CalendarUtils"

/**
 * The HTML input[type=date] is not usable on desktops because:
 * * it always displays a placeholder (mm/dd/yyyy) and several buttons and
 * * the picker can't be opened programmatically and
 * * the date format is based on the operating systems locale and not on the one set in the browser (and used by us)
 *
 * That is why we only use the picker on mobile devices. They provide native picker components
 * and allow opening the picker by forwarding the click event to the input.
 */
export class DatePicker {
	input: TextField;
	view: Function;
	invalidDate: boolean;
	date: Stream<?Date>;
	_forceCompact: boolean;
	_startOfTheWeekOffset: number

	constructor(startOfTheWeekOffset: number, labelTextIdOrTextFunction: string | lazy<string>, nullSelectionTextId: TranslationKey = "emptyString_msg", forceCompact: boolean = false) {
		this.date = stream(null)
		this._forceCompact = forceCompact
		this._startOfTheWeekOffset = startOfTheWeekOffset

		let pickerButton = new Button(labelTextIdOrTextFunction, this._showPickerDialog, () => BootIcons.Calendar)
		let inputDate: ?Date

		this.invalidDate = false
		this.input = new TextField(labelTextIdOrTextFunction, () => {
			if (this.invalidDate) {
				return lang.get("invalidDateFormat_msg", {"{1}": formatDate(new Date())})
			} else if (this.date() != null) {
				return formatDateWithMonth(neverNull(inputDate))
			} else {
				return lang.get(nullSelectionTextId)
			}
		})
		this.input._injectionsRight = () => forceCompact || client.isMobileDevice() ? [m(pickerButton)] : null
		this.input.onUpdate(value => {
			try {
				if (value.trim().length > 0) {
					let timestamp = parseDate(value)
					if (isNaN(timestamp)) {
						// always set invalidDate first to make sure that functions depending on the date stream can read the current invalidDate value
						this.invalidDate = false
						inputDate = null
					} else {
						this.invalidDate = false
						inputDate = new Date(timestamp)
					}
				} else {
					this.invalidDate = false
					inputDate = null
				}
			} catch (e) {
				this.invalidDate = true
			}
		})
		this.input.onblur.map(() => {
			this.date(inputDate)
		})
	}

	view = () => {
		return m("", [
			m(this.input),
			(this._forceCompact || client.isMobileDevice()
				? null
				: m(VisualDatePicker, {
					selectedDate: this.date(),
					onDateSelected: (newDate) => this.setDate(newDate),
					wide: false,
					startOfTheWeekOffset: this._startOfTheWeekOffset
				}))
		])
	}

	_showPickerDialog = () => {
		let date: ?Date
		const dialog = Dialog.showActionDialog({
			title: "",
			child: {
				view: () => m(VisualDatePicker, {
					selectedDate: date || this.date(),
					onDateSelected: (newDate, dayClick) => {
						if (dayClick) {
							this.setDate(newDate)
							dialog.close()
						}
					},
					wide: true,
					startOfTheWeekOffset: this._startOfTheWeekOffset
				}),
			},
			okAction: null,
			allowCancel: true
		})
	}

	setDate(date: ?Date) {
		this.invalidDate = false
		this.date(date)
		if (this.input.isEmpty() && this.input._domInput) {
			this.input.animate()
		}
		this.input.value(date != null ? formatDate(date) : "")
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
	_currentDate: Date;

	constructor(vnode: Vnode<VisualDatePickerAttrs>) {
		this._displayingDate = vnode.attrs.selectedDate || getStartOfDay(new Date())
	}

	view(vnode: Vnode<VisualDatePickerAttrs>) {
		const selectedDate = vnode.attrs.selectedDate
		this._currentDate = getStartOfDay(new Date())
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

	_switchMonthArrowIcon(forward: boolean, attrs: VisualDatePickerAttrs) {
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

	_onPrevMonthSelected = (attrs: VisualDatePickerAttrs) => {
		this._displayingDate.setMonth(this._displayingDate.getMonth() - 1)
		const selectedDate = addMonth(this._lastSelectedDate || new Date(), -1)
		attrs.onDateSelected && attrs.onDateSelected(selectedDate, false)
	}

	_onNextMonthSelected = (attrs: VisualDatePickerAttrs) => {
		this._displayingDate.setMonth(this._displayingDate.getMonth() + 1)
		const selectedDate = addMonth(this._lastSelectedDate || new Date(), 1)
		attrs.onDateSelected && attrs.onDateSelected(selectedDate, false)
	}

	_dayVdom({date, day, paddingDay}: CalendarDay, attrs: VisualDatePickerAttrs): VirtualElement {
		const size = px(this._elWidth(attrs))
		return m(".center.click" + (paddingDay ? "" : getDateIndicator(date, attrs.selectedDate, this._currentDate)), {
			style: {
				height: size,
				width: size,
			},
			onclick: !paddingDay && (() => {
				attrs.onDateSelected && attrs.onDateSelected(date, true)
			})
		}, paddingDay ? null : day)
	}

	_elWidth(attrs: VisualDatePickerAttrs) {
		return attrs.wide ? 40 : 24
	}

	_weekVdom(week: Array<CalendarDay>,
	          attrs: VisualDatePickerAttrs): VirtualElement {
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


