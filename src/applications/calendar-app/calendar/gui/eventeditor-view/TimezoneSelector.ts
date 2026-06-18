import m, { Children, Component, Vnode } from "mithril"
import { getTimeZone } from "../../../../common/calendar/date/CalendarUtils"

export type TimeZoneSelectorAttrs = {
	onSelectTimeZone: (timeZone: string) => any
}

export class TimeZoneSelector implements Component<TimeZoneSelectorAttrs> {
	private timeZonesList: string[] = Intl.supportedValuesOf("timeZone")
	private timeZonesFullText: string = this.timeZonesList.join("\0")
	private timeZonesFullTextToListIndex: number[] = new Array(this.timeZonesFullText.length + 1).fill(0)
	private selectedTimeZone: string = getTimeZone()
	private searchText: string = this.selectedTimeZone

	constructor({ attrs }: Vnode<TimeZoneSelectorAttrs>) {
		let timeZoneStartFullTextOffset = 0
		for (let i = 0; i < this.timeZonesList.length; i++) {
			const timeZone = this.timeZonesList[i]

			const timeZoneEndFullTextOffset = timeZoneStartFullTextOffset + timeZone.length + 1
			for (let j = timeZoneStartFullTextOffset; j < timeZoneEndFullTextOffset; j++) this.timeZonesFullTextToListIndex[j] = i
			timeZoneStartFullTextOffset = timeZoneEndFullTextOffset
		}
	}

	view({ attrs }: Vnode<TimeZoneSelectorAttrs>): Children {
		return m("div", [
			m("input", {
				type: "text",
				value: this.searchText,
				oninput: (event: { target: { value: string } }) => (this.searchText = event.target.value.trim()),
			}),
			m(
				"ul",
				this.searchTimeZoneList().map((timeZone) => {
					return m(
						"li",
						{
							onclick: () => {
								this.selectedTimeZone = timeZone
								this.searchText = timeZone
								attrs.onSelectTimeZone(this.selectedTimeZone)
							},
						},
						timeZone,
					)
				}),
			),
		])
	}

	searchTimeZoneList(): string[] {
		if (this.searchText.length === 0) {
			return this.timeZonesList
		}

		const searchResult: string[] = []
		let i = this.timeZonesFullText.indexOf(this.searchText)
		while (i !== -1) {
			const listIndex = this.timeZonesFullTextToListIndex[i]
			searchResult.push(this.timeZonesList[listIndex])

			i = this.timeZonesFullText.indexOf(this.searchText, i + this.searchText.length)
		}
		return searchResult
	}
}
