//@flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Icons} from "../base/icons/Icons"
import {client} from "../../misc/ClientDetector"
import {
	formatDate,
	formatDateWithWeekdayAndYear,
	formatMonthWithFullYear
} from "../../misc/Formatter"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {px} from "../size"
import {theme} from "../theme"
import {BootIcons} from "../base/icons/BootIcons"
import {neverNull} from "../../api/common/utils/Utils"
import {Icon} from "../base/Icon"
import {getStartOfDay, isSameDayOfDate} from "../../api/common/utils/DateUtils"
import {DateTime} from "luxon"
import {getAllDayDateLocal} from "../../api/common/utils/CommonCalendarUtils"
import {TextFieldN} from "../base/TextFieldN"
import {Keys} from "../../api/common/TutanotaConstants"
import {getCalendarMonth, getDateIndicator} from "../../calendar/date/CalendarUtils"
import type {CalendarDay} from "../../calendar/date/CalendarUtils"
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
export class DatePicker implements Component {
	invalidDate: boolean;
	date: Stream<?Date>;
	_dateString: Stream<string>;
	_startOfTheWeekOffset: number;
	_showingDropdown: boolean;
	_disabled: boolean;
	_label: TranslationKey | lazy<string>
	_nullSelectionHelpLabel: TranslationKey
	_domInput: ?HTMLElement

	constructor(startOfTheWeekOffset: number, labelTextIdOrTextFunction: TranslationKey | lazy<string>, nullSelectionTextId: TranslationKey = "emptyString_msg", disabled: boolean = false, dateStream?: Stream<?Date>) {
		this.date = dateStream ? dateStream : stream(null)
		const initDate = this.date()
		this._dateString = stream(initDate ? formatDate(initDate) : "")
		this._startOfTheWeekOffset = startOfTheWeekOffset
		this._showingDropdown = false
		this._disabled = disabled
		this._label = labelTextIdOrTextFunction
		this._nullSelectionHelpLabel = nullSelectionTextId
		this.invalidDate = false
		this._domInput = null
		this._dateString.map(value => {
			try {
				if (value.trim().length > 0) {
					this.date(parseDate(value))
					this.invalidDate = false
				} else {
					this.invalidDate = false
					this.date(null)
				}
			} catch (e) {
				this.invalidDate = true
			}
		})
	}

	_documentClickListener: ?MouseEventListener;

	view: (() => Children) = () => {
		const date = this.date()

		const helpLabel = () => {
			if (this._showingDropdown) {
				return null
			} else if (this.invalidDate) {
				return lang.get("invalidDateFormat_msg", {"{1}": formatDate(new Date())})
			} else if (this.date() != null) {
				return formatDateWithWeekdayAndYear(neverNull(this.date()))
			} else {
				return lang.get(this._nullSelectionHelpLabel)
			}
		}

		return m(".rel", [
			m("div", {
				onclick: () => {
					if (!this._disabled) {
						this._showingDropdown = true
					}
				},

			}, m(TextFieldN, {
				label: this._label,
				helpLabel,
				disabled: this._disabled,
				value: this._dateString,
				onfocus: () => {
					this._showingDropdown = true
				},
				oncreate: (vnode) => {
					this._domInput = vnode.dom
				},
				keyHandler: (key) => {
					if (key.keyCode === Keys.TAB.code) {
						this._showingDropdown = false
					}
					return true
				}
			})),
			this._showingDropdown
				? m(".fixed.content-bg.z3.menu-shadow.plr.pb-s", {
					style: {width: "280px"},
					onblur: () => this._showingDropdown = false,
					oncreate: (vnode) => {
						const listener: MouseEventListener = (e) => {
							if (!vnode.dom.contains(e.target)) {
								this._showingDropdown = false
								m.redraw()
							}
						}
						this._documentClickListener = listener
						document.addEventListener("click", listener, true)
					},
					onremove: (vnode) => {
						this._documentClickListener && document.removeEventListener("click", this._documentClickListener, true)
					}
				}, m(VisualDatePicker, {
					selectedDate: this.date(),
					onDateSelected: (newDate, dayClick) => {
						this.setDate(newDate)
						if (dayClick) { // Do not close dropdown on changing a month
							this._showingDropdown = false
						}
					},
					wide: false,
					startOfTheWeekOffset: this._startOfTheWeekOffset
				}))
				: null,
			// For mobile devices we render a native date picker, it's easier to use and more accessible.
			// We render invisible input which opens native picker on interaction.
			client.isMobileDevice()
				? m("input.fill-absolute", {
					type: "date",
					style: {
						opacity: 0,
						// This overrides platform-specific width setting, we want to cover the whole field
						minWidth: "100%",
						minHeight: "100%"
					},
					// Format as ISO date format (YYY-MM-dd). We use luxon for that because JS Date only supports full format with time.
					value: date != null ? DateTime.fromJSDate(date).toISODate() : "",
					oninput: (event) => {
						// valueAsDate is always 00:00 UTC
						// https://www.w3.org/TR/html52/sec-forms.html#date-state-typedate
						this.setDate(getAllDayDateLocal(event.target.valueAsDate))
					},
				})
				: null,
		])
	}

	setDate(date: ?Date) {
		this.invalidDate = false
		this.date(date)
		this._dateString(date && formatDate(date) || "")
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

	view(vnode: Vnode<VisualDatePickerAttrs>): Children {
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
		const selectedDate = addMonth(this._lastSelectedDate || new Date(), -1)
		attrs.onDateSelected && attrs.onDateSelected(selectedDate, false)
	}

	_onNextMonthSelected: ((attrs: VisualDatePickerAttrs) => void) = (attrs: VisualDatePickerAttrs) => {
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

	_elWidth(attrs: VisualDatePickerAttrs): number {
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


