import m, { Children, Component, Vnode } from "mithril"
import { px } from "../../../../../ui/size"
import { CalendarEventWhenModel } from "../eventeditor-model/CalendarEventWhenModel"
import { theme } from "../../../../../ui/theme"
import { lang } from "../../../../../ui/utils/LanguageViewModel"
import { PrimaryButton, PrimaryButtonAttrs } from "../../../../../ui/base/buttons/VariantButtons"
import { Select, SelectAttributes, SelectOption } from "../../../../../ui/base/Select"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import { Card } from "../../../../../ui/base/Card"
import { Icon, IconSize } from "../../../../../ui/base/Icon"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { getTimeZoneLongName, getTimeZoneOffset } from "../DateTimeTextFormatterUtils"

export type TimeZoneSelectionPageAttrs = {
	width: number
	model: CalendarEventWhenModel
	onConfirm: () => void
}

interface TimeZoneSelectItem extends SelectOption<string> {
	timeZoneName: string
	timeZoneLongName: string
	timeZoneOffset: string
}

export class TimeZoneSelectionPage implements Component<TimeZoneSelectionPageAttrs> {
	private timeZoneEntriesMap: Map<string, TimeZoneSelectItem> = new Map()
	private options: Stream<TimeZoneSelectItem[]> = stream()

	oninit({ attrs }: Vnode<TimeZoneSelectionPageAttrs>) {
		let timeZoneEntriesLists: TimeZoneSelectItem[] = []

		for (const timeZone of Intl.supportedValuesOf("timeZone")) {
			const timeZoneName = timeZone.replaceAll("_", " ")
			const timeZoneEntry: TimeZoneSelectItem = {
				value: timeZone,
				timeZoneName: timeZoneName,
				ariaValue: timeZoneName,
				timeZoneLongName: getTimeZoneLongName(new Date(), timeZone),
				timeZoneOffset: getTimeZoneOffset(new Date(), timeZone),
			}

			timeZoneEntriesLists.push(timeZoneEntry)
			this.timeZoneEntriesMap.set(timeZone, timeZoneEntry)
		}

		this.options = stream(timeZoneEntriesLists)
	}

	view({ attrs }: Vnode<TimeZoneSelectionPageAttrs>): Children {
		return m(
			".flex.col.pb-16.pt-16.fit-height.gap-24",
			{
				style: {
					width: px(attrs.width),
				},
			},
			[
				m(".flex.col.gap-16", [
					m(".flex.col.gap-8", [
						m(
							"small.uppercase.pb-8.b.text-ellipsis",
							{ style: { color: theme.on_surface } },
							lang.makeTranslation("startAndEndTimeZone_title", "Start and end time zone").text,
						), // FIXME Add translations
						m(
							Card,
							{ style: { padding: px(0) } },
							m(Select<TimeZoneSelectItem, string>, {
								onchange: (val) => {
									attrs.model.startTimeZone = val.value
								},
								options: this.options,
								expanded: true,
								selected: this.getSelected(attrs.model.startTimeZone ?? attrs.model.calendarTimeZone),
								renderOption: this.renderOption,
								renderDisplay: this.renderOption,
								ariaLabel: "Calendar",
								classes: ["pr-8"],
							} satisfies SelectAttributes<TimeZoneSelectItem, string>),
						),
					]),
				]),
				m(".flex.gap-12.justify-right", [
					m(PrimaryButton, {
						label: lang.makeTranslation("confirm_action", "Confirm"),
						onclick: attrs.onConfirm,
						width: "flex",
					} satisfies PrimaryButtonAttrs),
				]),
			],
		)
	}

	private renderOption(option: TimeZoneSelectItem) {
		return m(".flex.items-center.gap-8.plr-12.pt-8.pb-8", [
			m(Icon, {
				icon: Icons.GlobeOutline,
				size: IconSize.PX24,
				style: {
					fill: theme.on_surface_variant,
				},
			}),
			m(".flex.col", [m("small.faded", "Central European Summer Time (GMT+2)"), m("span", option.timeZoneName)]),
		])
	}

	private getSelected(startTimeZone: string | null) {
		return this.options().find((timeZoneOption) => timeZoneOption.value === startTimeZone)
	}
}
