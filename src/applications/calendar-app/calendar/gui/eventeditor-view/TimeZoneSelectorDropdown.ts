import m, { Children, Component, Vnode } from "mithril"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { theme } from "../../../../../ui/theme"
import { DateTime } from "luxon"
import { DropDownSelectorNew, DropDownSelectorNewAttrs } from "../../../../../ui/base/DropDownSelectorNew"
import { lang } from "../../../../../ui/utils/LanguageViewModel"
import { availableIANATimeZones } from "../../../../common/calendar/TimeZoneData"
import { getTimeZoneGmtOffset, getTimeZoneName, getTimeZoneOffsetLongName } from "../DateTimeTextFormatterUtils"

export type TimeZoneSelectorDropdownAttrs = {
	dateTime: DateTime
	selectedTimeZone: string
	onSelectionChanged: (selectedTimezone: string) => void
}

export class TimeZoneSelectorDropdown implements Component<TimeZoneSelectorDropdownAttrs> {
	public view({ attrs }: Vnode<TimeZoneSelectorDropdownAttrs>): Children {
		return m(DropDownSelectorNew, {
			label: lang.makeTranslation("selectedTimeZone", this.createTimeZoneOffsetLine(attrs.dateTime, attrs.selectedTimeZone)),
			items: availableIANATimeZones.map((timeZone) => ({
				name: getTimeZoneName(timeZone),
				value: timeZone,
				icon: Icons.GlobeOutline,
				secondaryTextLine: this.createTimeZoneOffsetLine(attrs.dateTime, timeZone),
			})),
			selectedValue: attrs.selectedTimeZone,
			selectedValueDisplay: getTimeZoneName(attrs.selectedTimeZone),
			icon: {
				icon: Icons.GlobeOutline,
				color: theme.on_surface_variant,
			},
			selectionChangedHandler: attrs.onSelectionChanged,
		} satisfies DropDownSelectorNewAttrs<string>)
	}

	private createTimeZoneOffsetLine(dateTime: DateTime, timeZone: string) {
		return `${getTimeZoneOffsetLongName(dateTime, timeZone)} (${getTimeZoneGmtOffset(dateTime, timeZone)})`
	}
}
