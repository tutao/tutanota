import m, { Children, Component, Vnode } from "mithril"
import { search } from "../../../../common/api/common/utils/PlainTextSearch"
import { Card } from "../../../../../ui/base/Card"
import { px } from "../../../../../ui/size"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { Icon, IconSize } from "../../../../../ui/base/Icon"
import { BaseSearchBar, BaseSearchBarAttrs } from "../../../../../ui/base/BaseSearchBar"
import { lang } from "../../../../../ui/utils/LanguageViewModel"
import { timeStringFromParts } from "../../../../../ui/utils/Formatter"
import { TimeFormat } from "@tutao/app-env"

export type TimeZoneSelectorAttrs = {
	width: number
	selectedTimeZone?: string
	onSelectTimeZone: (timeZone: string) => any
	selectedTime: Date
	timeFormat: TimeFormat
}

type ListItem = {
	timeZone: string
	timeZoneInLongFormat: string
	shortTimeInTimeZone: string
}

export class TimeZoneSelector implements Component<TimeZoneSelectorAttrs> {
	private selectedTimeZone: string | null = null
	private selectedTime: Date = new Date()

	private list: ListItem[] = []
	private searchText: string = ""

	constructor({ attrs }: Vnode<TimeZoneSelectorAttrs>) {
		this.selectedTimeZone = attrs.selectedTimeZone ?? null
		this.selectedTime = attrs.selectedTime

		this.list = Intl.supportedValuesOf("timeZone").map((timeZone) => {
			const dateTimeFormat = new Intl.DateTimeFormat(lang.languageTag, { timeZoneName: "long", timeZone })

			let timeZoneInLongFormat = ""
			for (const part of dateTimeFormat.formatToParts(this.selectedTime)) {
				if (part.type === "timeZoneName") {
					timeZoneInLongFormat = part.value
				}
			}

			const selectedTimeInTimeZone = new Date(this.selectedTime.toLocaleString("en-US", { timeZone }))
			const shortTimeInTimeZone = timeStringFromParts(
				selectedTimeInTimeZone.getHours(),
				selectedTimeInTimeZone.getMinutes(),
				attrs.timeFormat === TimeFormat.TWELVE_HOURS,
			)

			return { timeZone: timeZone.replaceAll("_", " "), timeZoneInLongFormat, shortTimeInTimeZone }
		})
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
					"",
					m(BaseSearchBar, {
						text: this.searchText,
						busy: false,
						placeholder: searchPlaceholderText,
						onInput: (text) => (this.searchText = text),
						onClear: () => (this.searchText = ""),
					} satisfies BaseSearchBarAttrs),
				),
				search(this.searchText, this.list, ["timeZone", "timeZoneInLongFormat"], false).map((item) => {
					return m(
						"button",
						{
							onclick: () => {
								this.selectedTimeZone = item.timeZone.replaceAll(" ", "_")
								attrs.onSelectTimeZone(this.selectedTimeZone)
							},
						},
						m(Card, { classes: ["flex", "gap-8"] }, [
							m(Icon, { icon: Icons.GlobeOutline, size: IconSize.PX24 }),
							m(".flex.col", [m("", `${item.timeZone} ${item.shortTimeInTimeZone}`), m("", item.timeZoneInLongFormat)]),
						]),
					)
				}),
			],
		)
	}
}
