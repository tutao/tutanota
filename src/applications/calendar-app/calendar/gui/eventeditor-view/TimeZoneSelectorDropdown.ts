import m, { Children, Component, Vnode } from "mithril"
import { SelectOption } from "../../../../../ui/base/Select"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { getTimeZoneOffsetString, IANATimeZone, IANATimeZonesList } from "../DateTimeTextFormatterUtils"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { theme } from "../../../../../ui/theme"
import { DateTime } from "luxon"
import { DropDownSelectorNew, DropDownSelectorNewAttrs } from "../../../../../ui/base/DropDownSelectorNew"
import { lang } from "../../../../../ui/utils/LanguageViewModel"

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
	private timeZoneOptionsList: ReadonlyArray<TimeZoneSelectOption> = []
	private options: Stream<TimeZoneSelectOption[]> = stream()

	private searchText: string = ""
	private isSearching: boolean = false

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

		this.options = stream([...this.timeZoneOptionsList])
	}

	public view({ attrs }: Vnode<TimeZoneSelectorDropdownAttrs>): Children {
		const selected = this.getSelected(attrs.selectedTimeZone)!
		const selectedLabelText = `${selected.timeZoneLongName} (${selected.timeZoneGMTOffset})`

		return m(DropDownSelectorNew, {
			label: lang.makeTranslation(selectedLabelText, selectedLabelText),
			items: this.options().map((op) => ({ name: op.timeZoneName, value: op, icon: Icons.GlobeOutline })),
			selectedValue: selected,
			icon: {
				icon: Icons.GlobeOutline,
				color: theme.on_surface_variant,
			},
			selectionChangedHandler: (selectedOption) => {
				attrs.onSelectionChanged(selectedOption.value)
			},
		} satisfies DropDownSelectorNewAttrs<TimeZoneSelectOption>)
	}

	private getSelected(startTimeZone: string) {
		return this.timeZoneOptionsList.find((timeZoneOption) => timeZoneOption.value === startTimeZone)
	}
}
