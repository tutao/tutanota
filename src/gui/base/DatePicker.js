//@flow
import {TextField} from "./TextField"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Icons} from "./icons/Icons"
import {Button} from "./Button"
import {client} from "../../misc/ClientDetector"
import {formatDate, formatDateWithMonth, parseDate} from "../../misc/Formatter"
import {lang} from "../../misc/LanguageViewModel"
import {px} from "../size"
import {Dialog} from "./Dialog"
import {theme} from "../theme"
import {BootIcons} from "./icons/BootIcons"
import {neverNull} from "../../api/common/utils/Utils"
import {Icon} from "./Icon"
import {getStartOfDay} from "../../api/common/utils/DateUtils"

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
	_forceCompact: boolean

	constructor(labelTextIdOrTextFunction: string | lazy<string>, nullSelectionTextId: TranslationKey = "emptyString_msg", forceCompact: boolean = false) {
		this.date = stream(null)
		this._forceCompact = forceCompact

		let pickerButton = new Button(labelTextIdOrTextFunction, this._showPickerDialog, () => BootIcons.Calendar)

		this.invalidDate = false
		this.input = new TextField(labelTextIdOrTextFunction, () => {
			if (this.invalidDate) {
				return lang.get("invalidDateFormat_msg", {"{1}": formatDate(new Date())})
			} else if (this.date() != null) {
				return formatDateWithMonth(neverNull(this.date()))
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
						this.date(null)
					} else {
						this.invalidDate = false
						this.date(new Date(timestamp))
					}
				} else {
					this.invalidDate = false
					this.date(null)
				}
			} catch (e) {
				this.invalidDate = true
			}
		})
	}

	view = () => {
		return [
			m(this.input),
			(this._forceCompact || client.isMobileDevice()
				? null
				: m(VisualDatePicker, {
					selectedDate: this.date(),
					onDateSelected: (newDate) => this.setDate(newDate),
					wide: false
				}))
		]
	}

	_showPickerDialog = () => {
		let date: ?Date
		const dialog = Dialog.showActionDialog({
			title: "",
			child: {
				view: () => m(VisualDatePicker, {
					selectedDate: date || this.date(),
					onDateSelected: (newDate) => {date = newDate},
					wide: true
				}),
			},
			okAction: () => {
				date && this.setDate(date)
				dialog.close()
			},
			allowCancel: true
		})
	}

	setDate(date: Date) {
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
	onDateSelected?: (date: Date) => mixed;
	wide: boolean
}>

export class VisualDatePicker implements MComponent<VisualDatePickerAttrs> {
	_displayingDate: Date;
	_lastSelectedDate: ?Date;

	constructor(vnode: Vnode<VisualDatePickerAttrs>) {
		this._displayingDate = vnode.attrs.selectedDate || getStartOfDay(new Date())
	}

	view(vnode: Vnode<VisualDatePickerAttrs>) {
		const selectedDate = vnode.attrs.selectedDate
		if (selectedDate && !this._sameDate(this._lastSelectedDate, selectedDate)) {
			this._lastSelectedDate = selectedDate
			this._displayingDate = new Date(selectedDate)
			this._displayingDate.setDate(1)
		}

		const weeks = [[]];
		let day = 1;
		let date = new Date(this._displayingDate)
		let currentYear = date.getFullYear();

		let month = date.getMonth();
		let monthData = {
			year: date.getFullYear(),
			month: date.getMonth(),
			date: new Date(date)
		};
		// add "padding" days
		let firstDay = date.getDay();
		let d;
		for (d = 0; d < firstDay; d++) {
			weeks[0].push({day: null, date: null});
		}
		// add actual days
		while (date.getMonth() === month) {
			if (weeks[0].length && d % 7 === 0) {
				// start new week
				weeks.push([]);
			}
			const dayInfo = {
				date: new Date(date.getFullYear(), month, day),
				year: currentYear,
				month: month,
				day: day,
			};
			weeks[weeks.length - 1].push(dayInfo);
			date.setDate(++day);
			d++;
		}
		// add remaining "padding" days
		while (d < 42) {
			if (d % 7 === 0) {
				weeks.push([]);
			}
			weeks[weeks.length - 1].push({day: null, date: null});
			d += 1;
		}

		const weekdays = []
		const weekdaysDate = new Date()
		weekdaysDate.setDate(weekdaysDate.getDate() - weekdaysDate.getDay())
		for (let i = 0; i < 7; i++) {
			weekdays.push(weekdaysDate.toLocaleDateString([], {weekday: "narrow"}))
			weekdaysDate.setDate(weekdaysDate.getDate() + 1)
		}

		return m(".flex.flex-column", [
			m(".flex.flex-space-between.pt-s.pb-s.items-center", [
				this._calIcon(false, vnode.attrs),
				m(".b", {
					style: {
						fontSize: px(14)
					}
				}, monthData.date.toLocaleString([], {month: "long", year: "numeric"})),
				this._calIcon(true, vnode.attrs)
			]),
			m(".flex.flex-space-between", this._weekdaysVdom(vnode.attrs.wide, weekdays)),
			m(".flex.flex-column.flex-space-around", {
				style: {
					fontSize: px(14),
					lineHeight: px((this._elWidth(vnode.attrs)) + 2)
				}
			}, weeks.map(w => this._weekVdom(w, vnode.attrs)))
		])
	}

	_calIcon(forward: boolean, attrs: VisualDatePickerAttrs) {
		const size = px(this._elWidth(attrs))
		return m(".icon.flex.justify-center.items-center.click", {
			onclick: forward ? this._onNextMonthSelected : this._onPrevMonthSelected,
			style: {
				fill: theme.content_fg,
				width: size,
				height: size,
			},
		}, m(Icon, {icon: forward ? Icons.ArrowForward : BootIcons.Back, style: {fill: theme.content_fg}}))
	}

	_onPrevMonthSelected = () => {
		this._displayingDate.setMonth(this._displayingDate.getMonth() - 1)
	}

	_onNextMonthSelected = () => {
		this._displayingDate.setMonth(this._displayingDate.getMonth() + 1)
	}

	_dayVdom({date, day}: {date: ?Date, day: ?number}, attrs: VisualDatePickerAttrs): VirtualElement {
		const size = px(this._elWidth(attrs))
		return m(".center.click" +
			(date && this._sameDate(date, attrs.selectedDate) ? ".date-selected" : ""), {
			style: {
				height: size,
				width: size
			},
			onclick: date && (() => attrs.onDateSelected && attrs.onDateSelected(date))
		}, day)
	}

	_elWidth(attrs: VisualDatePickerAttrs) {
		return attrs.wide ? 40 : 24
	}

	_weekVdom(week: Array<{date: ?Date, year?: number, month?: number, day: ?number}>,
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
					color: theme.content_border
				}
			}, wd)
		)
	}

	_sameDate(date1: ?Date, date2: ?Date) {
		return !date1 && !date2
			|| date1 && date2
			&& date1.getFullYear() === date2.getFullYear()
			&& date1.getMonth() === date2.getMonth()
			&& date1.getDate() === date2.getDate()
	}
}
