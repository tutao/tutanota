//@flow

import m from "mithril"
import {numberRange} from "../api/common/utils/ArrayUtils"
import {theme} from "../gui/theme"
import {px} from "../gui/size"
import {formatDateWithWeekday, formatTime} from "../misc/Formatter"
import {getFromMap} from "../api/common/utils/MapUtils"
import {colorForBg, isAllDayEvent} from "./CalendarUtils"
import {DAY_IN_MILLIS} from "../api/common/utils/DateUtils"
import {defaultCalendarColor} from "../api/common/TutanotaConstants"

type CalendarDayViewAttrs = {
	selectedDate: Stream<Date>,
	eventsForDays: Map<number, Array<CalendarEvent>>,
	onNewEvent: (date: ?Date) => mixed,
	onEventClicked: (event: CalendarEvent) => mixed
}

const hourHeight = 60
const hours = numberRange(0, 23).map((n) => {
	const d = new Date()
	d.setHours(n, 0, 0, 0)
	return formatTime(d)
})
const allHoursHeight = hourHeight * hours.length

export class CalendarDayView implements MComponent<CalendarDayViewAttrs> {

	view(vnode: Vnode<CalendarDayViewAttrs>): Children {
		const events = getFromMap(vnode.attrs.eventsForDays, vnode.attrs.selectedDate().getTime(), () => [])
		return m(".fill-absolute.flex.col",
			[
				m("", [
					m("h1.plr.pt.pb", formatDateWithWeekday(vnode.attrs.selectedDate())),
					m(".plr", events.map(e => {
						if (isAllDayEvent(e)) {
							return m("", e.summary)
						} else {
							return null
						}
					}))
				]),
				m(".scroll.col.rel",
					[
						hours.map(n => m("", {
							style: {
								'border-bottom': `1px solid ${theme.content_border}`,
								height: px(hourHeight)
							}
						}, m(".pt.pl-s.pr-s", {
							style: {
								width: "60px",
								height: '100%',
								'border-right': `2px solid ${theme.content_border}`,
							},
						}, n))),
						events.map(ev => {
							if (isAllDayEvent(ev)) {
								return null
							} else {
								const startTime = (ev.startTime.getHours() * 60 + ev.startTime.getMinutes()) * 60 * 1000
								const height = (ev.endTime.getTime() - ev.startTime.getTime()) / (1000 * 60 * 60) * hourHeight
								return m(".abs", {
									style: {
										left: 0,
										right: 0,
										top: px(startTime / DAY_IN_MILLIS * allHoursHeight),
										height: px(height),
										background: "#" + defaultCalendarColor,
										marginLeft: "60px",
										color: colorForBg(defaultCalendarColor),
									},
									onclick: () => vnode.attrs.onEventClicked(ev)
								}, ev.summary)
							}
						})
					])
			])
	}
}
