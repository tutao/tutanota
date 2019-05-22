// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import type {CurrentView} from "../gui/base/Header"
import {ColumnType, ViewColumn} from "../gui/base/ViewColumn"
import {lang} from "../misc/LanguageViewModel"
import {ViewSlider} from "../gui/base/ViewSlider"
import {Button, ButtonType} from "../gui/base/Button"
import {Icons} from "../gui/base/icons/Icons"
import {VisualDatePicker} from "../gui/base/DatePicker"
import {theme} from "../gui/theme"
import {BootIcons} from "../gui/base/icons/BootIcons"
import type {NavButtonAttrs} from "../gui/base/NavButtonN"
import {getCalendarMonth} from "../api/common/utils/DateUtils"

export class CalendarView implements CurrentView {

	sidebarColumn: ViewColumn;
	contentColumn: ViewColumn;
	viewSlider: ViewSlider;
	newAction: Button;
	selectedDate: Stream<Date>;

	constructor() {


		const privateCalendarButton: NavButtonAttrs = {
			label: lang.get("privateCalendar_label"),
			icon: () => BootIcons.Calendar,
			href: () => m.route.get()
		}


		this.selectedDate = stream(new Date())
		this.sidebarColumn = new ViewColumn({
			view: () => m(".folder-column.scroll.overflow-x-hidden.flex.col.plr-l", [
				m(VisualDatePicker, {
					onDateSelected: this.selectedDate,
					selectedDate: this.selectedDate(),
					wide: false
				}),
				m(".folder-row.flex-space-between", [
					m("small.b.pt-s.align-self-center.ml-negative-xs",
						{style: {color: theme.navigation_button}},
						lang.get("yourCalendars_label").toLocaleUpperCase()),
				]),
				m(".folders",
					m(".folder-row.flex-start",
						m(".flex.flex-grow..center-vertically.button-height", [
							m(".calendar-checkbox", {
								style: {"border-color": "blue"}
							}),
							m(".pl-m", lang.get("privateCalendar_label"))
						])))
			])
		}, ColumnType.Foreground, 200, 300, () => lang.get("folderTitle_label"))


		this.contentColumn = new ViewColumn({
			view: () => this._renderMonth()
		}, ColumnType.Background, 300, 2000, () => {
			return "monthly"
		})

		this.viewSlider = new ViewSlider([this.sidebarColumn, this.contentColumn], "CalendarView")
		this.newAction = new Button('newEvent_action', () => this._newEvent(), () => Icons.Add)
			.setType(ButtonType.Floating)
	}


	view() {
		return m(".main-view", [
			m(this.viewSlider),
			m(this.newAction)
		])
	}

	_renderMonth() {
		const {weekdays, weeks} = getCalendarMonth(this.selectedDate())
		return m(".fill-absolute.flex.col", weeks.map((week) => {
			return m(".flex.flex-grow", week.map(d => m(".flex-grow", String(d.day))))
		}))
	}

	updateUrl() {

	}

	_newEvent() {

	}
}




