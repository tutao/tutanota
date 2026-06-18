import m, { Children, Component, Vnode } from "mithril"
import { getTimeZone } from "../../../../common/calendar/date/CalendarUtils"
import { search } from "../../../../common/api/common/utils/PlainTextSearch"
import { Card } from "../../../../../ui/base/Card"
import { px } from "../../../../../ui/size"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { Icon, IconSize } from "../../../../../ui/base/Icon"
import { BaseSearchBar, BaseSearchBarAttrs } from "../../../../../ui/base/BaseSearchBar"

export type TimeZoneSelectorAttrs = {
	width: number
	onSelectTimeZone: (timeZone: string) => any
}

export class TimeZoneSelector implements Component<TimeZoneSelectorAttrs> {
	private timeZonesSearchList: { timeZone: string }[]
	private selectedTimeZone: string
	private searchText: string

	constructor({ attrs }: Vnode<TimeZoneSelectorAttrs>) {
		this.timeZonesSearchList = Intl.supportedValuesOf("timeZone").map((timeZone) => ({ timeZone: timeZone.replaceAll("_", " ") }))
		this.selectedTimeZone = this.searchText = getTimeZone()
	}

	view({ attrs }: Vnode<TimeZoneSelectorAttrs>): Children {
		// TODO: Finalize search placeholder wording and add translations
		const searchPlaceholderText = "Search for a time zone"
		return m(
			".flex.col.items-stretch.gap-16.pt-8",
			{
				style: { width: px(attrs.width) },
			},
			[
				m(
					"div",
					m(BaseSearchBar, {
						text: this.searchText,
						busy: false,
						onInput: (text) => (this.searchText = text),
						onClear: () => (this.searchText = ""),
					} satisfies BaseSearchBarAttrs),
				),
				m.fragment(
					{},
					search(this.searchText, this.timeZonesSearchList, ["timeZone"], false).map(({ timeZone }) => {
						return m(
							"button",
							{
								onclick: () => (this.searchText = timeZone),
							},
							m(Card, { classes: ["flex", "gap-8"] }, [m(Icon, { icon: Icons.GlobeOutline, size: IconSize.PX24 }), timeZone]),
						)
					}),
				),
			],
		)
	}
}
