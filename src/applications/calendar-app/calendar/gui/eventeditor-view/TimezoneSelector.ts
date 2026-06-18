import m, { Children, Component, Vnode } from "mithril"
import { getTimeZone } from "../../../../common/calendar/date/CalendarUtils"
import { search } from "../../../../common/api/common/utils/PlainTextSearch"

export type TimeZoneSelectorAttrs = {
	onSelectTimeZone: (timeZone: string) => any
}

export class TimeZoneSelector implements Component<TimeZoneSelectorAttrs> {
	private timeZonesSearchList: { timeZone: string }[]
	private selectedTimeZone: string
	private searchText: string

	constructor({ attrs }: Vnode<TimeZoneSelectorAttrs>) {
		this.timeZonesSearchList = Intl.supportedValuesOf("timeZone").map((timeZone) => ({ timeZone }))
		this.selectedTimeZone = this.searchText = getTimeZone()
	}

	view({ attrs }: Vnode<TimeZoneSelectorAttrs>): Children {
		return m("div", [
			m("input", {
				type: "text",
				value: this.searchText,
				oninput: (event: { target: { value: string } }) => (this.searchText = event.target.value),
			}),
			m(
				"ul",
				search(this.searchText, this.timeZonesSearchList, ["timeZone"], false).map(({ timeZone }) =>
					m(
						"li",
						{
							onclick: () => {
								this.selectedTimeZone = timeZone
								this.searchText = timeZone
								attrs.onSelectTimeZone(this.selectedTimeZone)
							},
						},
						timeZone,
					),
				),
			),
		])
	}
}
