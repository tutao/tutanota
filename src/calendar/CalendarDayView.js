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
	return d
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
						hours.map(n => m(".calendar-hour", {
							style: {
								'border-bottom': `1px solid ${theme.content_border}`,
								height: px(hourHeight)
							},
							onclick: (e) => {
								e.stopPropagation()
								vnode.attrs.onNewEvent(n)
							},
						}, m(".pt.pl-s.pr-s", {
							style: {
								width: "60px",
								height: '100%',
								'border-right': `2px solid ${theme.content_border}`,
							},
						}, formatTime(n)))),
						events.map((ev) => this._renderEvent(vnode.attrs, ev))
					])
			])
	}

	_renderEvent(attrs: CalendarDayViewAttrs, ev: CalendarEvent): Children {
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
				onclick: () => attrs.onEventClicked(ev)
			}, ev.summary)
		}
	}
}
