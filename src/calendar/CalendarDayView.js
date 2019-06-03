//@flow

import m from "mithril"

type CalendarDayViewAttrs = {
	selectedDate: Stream<Date>,
	eventsForDays: Map<number, Array<CalendarEvent>>,
	onNewEvent: (date: ?Date) => mixed,
	onEventClicked: (event: CalendarEvent) => mixed
}

const hourHeight = 30

export class CalendarDayView implements MComponent<CalendarDayViewAttrs> {

	view(vnode: Vnode<CalendarDayViewAttrs>): Children {
		return m("", "Day")
	}
}
