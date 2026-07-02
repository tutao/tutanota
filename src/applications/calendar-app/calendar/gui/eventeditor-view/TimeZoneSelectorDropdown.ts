import m, { Children, Component, Vnode } from "mithril"
import { Card } from "../../../../../ui/base/Card"
import { px } from "../../../../../ui/size"
import { Select, SelectAttributes, SelectOption } from "../../../../../ui/base/Select"
import stream from "mithril/stream"
import { getTimeZoneOffsetString, IANATimeZone, IANATimeZonesList } from "../DateTimeTextFormatterUtils"
import { Icon, IconSize } from "../../../../../ui/base/Icon"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { theme } from "../../../../../ui/theme"
import { DateTime } from "luxon"

export type TimeZoneSelectorDropdownAttrs = {
	dateTime: DateTime
	selectedTimeZone: IANATimeZone
	onSelectionChanged: (selectedTimezone: IANATimeZone) => void
}

interface TimeZoneSelectOption extends SelectOption<IANATimeZone> {
	timeZoneName: string
	timeZoneLongName: string
	timeZoneGMTOffset: string
}

export class TimeZoneSelectorDropdown implements Component<TimeZoneSelectorDropdownAttrs> {
	private timeZoneOptionsList: TimeZoneSelectOption[] = []

	oninit({ attrs }: Vnode<TimeZoneSelectorDropdownAttrs>) {
		this.timeZoneOptionsList = IANATimeZonesList.map((timeZone) => {
			const dateTimeInTimeZone = attrs.dateTime.setZone(timeZone)

			const timeZoneName = timeZone.replaceAll("_", " ")
			return {
				value: timeZone,
				timeZoneName: timeZoneName,
				ariaValue: timeZoneName,
				timeZoneLongName: dateTimeInTimeZone.offsetNameLong ?? "",
				timeZoneGMTOffset: `GMT${getTimeZoneOffsetString(dateTimeInTimeZone)}`,
			}
		})
	}

	public view({ attrs }: Vnode<TimeZoneSelectorDropdownAttrs>): Children {
		return m(
			Card,
			{ style: { padding: px(0) } },
			m(Select<TimeZoneSelectOption, string>, {
				onchange: (val) => {
					attrs.onSelectionChanged(val.value)
				},
				options: stream(this.timeZoneOptionsList),
				expanded: true,
				selected: this.getSelected(attrs.selectedTimeZone),
				renderOption: this.renderOption,
				renderDisplay: this.renderOption,
				ariaLabel: "Calendar",
				classes: ["pr-8"],
			} satisfies SelectAttributes<TimeZoneSelectOption, string>),
		)
	}

	private renderOption(option: TimeZoneSelectOption) {
		return m(".flex.items-center.gap-8.plr-12.pt-8.pb-8", [
			m(Icon, {
				icon: Icons.GlobeOutline,
				size: IconSize.PX24,
				style: {
					fill: theme.on_surface_variant,
				},
			}),
			m(".flex.col", [m("small.faded", `${option.timeZoneLongName} (${option.timeZoneGMTOffset})`), m("span", option.timeZoneName)]),
		])
	}

	private getSelected(startTimeZone: string) {
		return this.timeZoneOptionsList.find((timeZoneOption) => timeZoneOption.value === startTimeZone)
	}
}
