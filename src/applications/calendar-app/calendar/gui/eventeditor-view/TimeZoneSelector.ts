import m, { Children, Component, Vnode } from "mithril"
import { search } from "../../../../common/api/common/utils/PlainTextSearch"
import { Card, CardAttrs } from "../../../../../ui/base/Card"
import { px, size } from "../../../../../ui/size"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { Icon, IconSize } from "../../../../../ui/base/Icon"
import { BaseSearchBar, BaseSearchBarAttrs } from "../../../../../ui/base/BaseSearchBar"
import { timeStringFromParts } from "../../../../../ui/utils/Formatter"
import { TimeFormat } from "@tutao/app-env"
import { DateTime } from "luxon"
import { theme } from "../../../../../ui/theme"
import { IconButton, IconButtonAttrs } from "../../../../../ui/base/IconButton"
import { BaseButton, BaseButtonAttrs } from "../../../../../ui/base/buttons/BaseButton"
import { getTimeZoneLongName, getTimeZoneOffset } from "../DateTimeTextFormatterUtils"

export type TimeZoneSelectorAttrs = {
	width: number
	selectedTimeZone: string | null
	onSelectTimeZone: (timeZone: string | null) => any
	selectedTime: Date
	timeFormat: TimeFormat
}

type ListItem = {
	timeZone: string
	timeZoneName: string
	timeZoneLongName: string
	timeZoneOffset: string
	timeString: string
}

export class TimeZoneSelector implements Component<TimeZoneSelectorAttrs> {
	private selectedTime: Date = new Date()

	private list: ListItem[] = []
	private searchText: string = ""

	constructor({ attrs }: Vnode<TimeZoneSelectorAttrs>) {
		this.selectedTime = attrs.selectedTime

		this.list = Intl.supportedValuesOf("timeZone").map((timeZone) => {
			const selectedTimeInTimeZone = DateTime.fromJSDate(this.selectedTime).setZone(timeZone)
			const timeString = timeStringFromParts(selectedTimeInTimeZone.hour, selectedTimeInTimeZone.minute, attrs.timeFormat === TimeFormat.TWELVE_HOURS)

			return {
				timeZone,
				timeZoneName: timeZone.replaceAll("_", " "),
				timeZoneLongName: getTimeZoneLongName(timeZone),
				timeZoneOffset: getTimeZoneOffset(timeZone),
				timeString,
			}
		})
	}

	view({ attrs }: Vnode<TimeZoneSelectorAttrs>): Children {
		// TODO: Finalize search placeholder wording and add translations
		const searchPlaceholderText = "Search for a time zone"
		return m(
			".flex.col",
			{
				style: {
					width: px(attrs.width),
				},
			},
			[
				m(
					".pt-16.pb-16",
					{
						style: {
							"background-color": theme.surface_container,
						},
					},
					m(BaseSearchBar, {
						text: this.searchText,
						busy: false,
						placeholder: searchPlaceholderText,
						onInput: (text) => (this.searchText = text),
						onClear: () => (this.searchText = ""),
					} satisfies BaseSearchBarAttrs),
				),
				m(
					".flex.col.gap-8.overflow-y-scroll",
					search(this.searchText, this.list, ["timeZone", "timeZoneInLongFormat"], false).map((item) => {
						return m(
							BaseButton,
							{
								label: { text: item.timeZoneName, testId: item.timeZoneName },
								onclick: () => {
									attrs.onSelectTimeZone(item.timeZone)
								},
							} satisfies BaseButtonAttrs,
							m(Card, { classes: ["flex", "gap-8"], style: { padding: `${size.spacing_8}px ${size.spacing_16}px` } } satisfies CardAttrs, [
								m(Icon, { icon: Icons.GlobeOutline, size: IconSize.PX24 }),
								m(".flex.col.flex-grow.min-width-0.button-min-height", [
									m(".text-ellipsis", `${item.timeZoneName} ${item.timeString}`),
									m("small.faded", `${item.timeZoneLongName} (${item.timeZoneOffset})`),
								]),
								item.timeZone === attrs.selectedTimeZone
									? m(IconButton, {
											icon: Icons.X,
											title: "remove_action",
											click: (e) => {
												e.stopPropagation()
												attrs.onSelectTimeZone(null)
											},
										} satisfies IconButtonAttrs)
									: null,
							]),
						)
					}),
				),
			],
		)
	}
}
