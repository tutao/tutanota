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
import { deviceConfig } from "../../../../common/misc/DeviceConfig"

export type TimeZoneSelectorAttrs = {
	width: number
	calendarTimeZone: string
	selectedTimeZone: string | null
	onSelectTimeZone: (timeZone: string | null) => any
	selectedTime: Date
	timeFormat: TimeFormat
}

type TimeZoneEntry = {
	timeZone: string
	timeZoneName: string
	timeZoneLongName: string
	timeZoneOffset: string
	clockTimeInTimeZone: string
}

export class TimeZoneSelector implements Component<TimeZoneSelectorAttrs> {
	private selectedTime: Date = new Date()

	private timeZoneEntriesLists: TimeZoneEntry[] = []
	private timeZoneEntriesMap: Map<string, TimeZoneEntry> = new Map()
	private searchText: string = ""

	constructor({ attrs }: Vnode<TimeZoneSelectorAttrs>) {
		this.selectedTime = attrs.selectedTime

		// Initialize this.timeZoneEntriesLists and this.timeZoneEntriesMap
		for (const timeZone of Intl.supportedValuesOf("timeZone")) {
			const selectedTimeInTimeZone = DateTime.fromJSDate(this.selectedTime).setZone(timeZone)
			const timeZoneEntry: TimeZoneEntry = {
				timeZone,
				timeZoneName: timeZone.replaceAll("_", " "),
				timeZoneLongName: getTimeZoneLongName(timeZone),
				timeZoneOffset: getTimeZoneOffset(timeZone),
				clockTimeInTimeZone: timeStringFromParts(
					selectedTimeInTimeZone.hour,
					selectedTimeInTimeZone.minute,
					attrs.timeFormat === TimeFormat.TWELVE_HOURS,
				),
			}

			this.timeZoneEntriesLists.push(timeZoneEntry)
			this.timeZoneEntriesMap.set(timeZone, timeZoneEntry)
		}
	}

	view({ attrs }: Vnode<TimeZoneSelectorAttrs>): Children {
		let lastUsedTimeZones = deviceConfig.getLastSelectedTimeZonesFIFOQueue()
		// If lastUsedTimeZones is empty, prefill it with the calendar's current time zone
		if (lastUsedTimeZones.length === 0) {
			deviceConfig.enqueueLastSelectedTimeZone(attrs.calendarTimeZone)
			lastUsedTimeZones = deviceConfig.getLastSelectedTimeZonesFIFOQueue()
		}

		const timeZonesSearchResults = search(this.searchText, this.timeZoneEntriesLists, ["timeZoneName", "timeZoneLongName"], false)

		// TODO: Finalize wording and add translations
		const searchPlaceholderText = "Search for a time zone"
		const lastUsedHeadingText = "LAST USED"
		const searchResultsHeadingText = "SEARCH RESULTS"

		return m(
			".flex.col.pb-16",
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
				m("small.b.pb-8", lastUsedHeadingText),
				m(
					".flex.col.gap-8",
					lastUsedTimeZones.map((timeZone) => {
						const timeZoneEntry = this.timeZoneEntriesMap.get(timeZone)!
						return this.renderTimeZonesListItem(attrs, timeZoneEntry)
					}),
				),
				m("small.b.pt-16.pb-8", searchResultsHeadingText),
				m(
					".flex.col.gap-8.overflow-y-scroll",
					timeZonesSearchResults.map((timeZoneEntry) => this.renderTimeZonesListItem(attrs, timeZoneEntry)),
				),
			],
		)
	}

	private renderTimeZonesListItem(attrs: TimeZoneSelectorAttrs, timeZoneEntry: TimeZoneEntry) {
		return m(
			BaseButton,
			{
				label: { text: timeZoneEntry.timeZoneName, testId: timeZoneEntry.timeZoneName },
				onclick: () => {
					deviceConfig.enqueueLastSelectedTimeZone(timeZoneEntry.timeZone)
					attrs.onSelectTimeZone(timeZoneEntry.timeZone)
				},
			} satisfies BaseButtonAttrs,
			m(Card, { classes: ["flex", "gap-8"], style: { padding: `${size.spacing_8}px ${size.spacing_16}px` } } satisfies CardAttrs, [
				m(Icon, { icon: Icons.GlobeOutline, size: IconSize.PX24 }),
				m(".flex.col.flex-grow.min-width-0.button-min-height", [
					m(".text-ellipsis", `${timeZoneEntry.timeZoneName} ${timeZoneEntry.clockTimeInTimeZone}`),
					m("small.faded", `${timeZoneEntry.timeZoneLongName} (${timeZoneEntry.timeZoneOffset})`),
				]),
				timeZoneEntry.timeZone === attrs.selectedTimeZone
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
	}
}
