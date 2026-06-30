import m, { Children, Component, Vnode } from "mithril"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { theme } from "../../../../../ui/theme"
import { DateTime } from "luxon"
import { DropDownSelectorNew, DropDownSelectorNewAttrs } from "../../../../../ui/base/DropDownSelectorNew"
import { lang } from "../../../../../ui/utils/LanguageViewModel"
import { IANATimeZoneStrings, timeZoneProvider } from "../../../../common/calendar/TimeZoneProvider"

export type TimeZoneSelectorDropdownAttrs = {
	dateTime: DateTime
	selectedTimeZone: string
	onSelectionChanged: (selectedTimezone: string) => void
}

export class TimeZoneSelectorDropdown implements Component<TimeZoneSelectorDropdownAttrs> {
	private timeZonesStrings: IANATimeZoneStrings[]

	constructor({ attrs }: Vnode<TimeZoneSelectorDropdownAttrs>) {
		this.timeZonesStrings = timeZoneProvider.getTimeZonesStrings(attrs.dateTime)
	}

	public view({ attrs }: Vnode<TimeZoneSelectorDropdownAttrs>): Children {
		let selectedTimeZoneStrings = this.timeZonesStrings.find((strings) => strings.timeZone === attrs.selectedTimeZone)
		if (!selectedTimeZoneStrings) {
			selectedTimeZoneStrings = timeZoneProvider.createTimeZoneStrings(attrs.selectedTimeZone, attrs.dateTime)
		}
		return m(DropDownSelectorNew, {
			label: lang.makeTranslation("selectedTimeZone", `${selectedTimeZoneStrings.offsetLongName} (${selectedTimeZoneStrings.gmtOffset})`),
			items: this.timeZonesStrings.map((strings) => ({
				name: strings.name,
				value: strings.timeZone,
				icon: Icons.GlobeOutline,
				secondaryTextLine: `${strings.offsetLongName} (${strings.gmtOffset})`,
			})),
			selectedValue: selectedTimeZoneStrings.timeZone,
			selectedValueDisplay: selectedTimeZoneStrings.name,
			icon: {
				icon: Icons.GlobeOutline,
				color: theme.on_surface_variant,
			},
			selectionChangedHandler: attrs.onSelectionChanged,
		} satisfies DropDownSelectorNewAttrs<string>)
	}
}
