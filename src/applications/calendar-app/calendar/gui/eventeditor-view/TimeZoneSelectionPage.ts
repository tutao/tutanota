import m, { Children, Component, Vnode } from "mithril"
import { px } from "../../../../../ui/size"
import { CalendarEventWhenModel } from "../eventeditor-model/CalendarEventWhenModel"
import { theme } from "../../../../../ui/theme"
import { lang } from "../../../../../ui/utils/LanguageViewModel"
import { PrimaryButton, PrimaryButtonAttrs } from "../../../../../ui/base/buttons/VariantButtons"

export type TimeZoneSelectionPageAttrs = {
	width: number
	model: CalendarEventWhenModel
	onConfirm: () => void
}

export class TimeZoneSelectionPage implements Component<TimeZoneSelectionPageAttrs> {
	constructor({ attrs }: Vnode<TimeZoneSelectionPageAttrs>) {}

	view({ attrs }: Vnode<TimeZoneSelectionPageAttrs>): Children {
		return m(
			".flex.col.pb-16.pt-16.fit-height",
			{
				style: {
					width: px(attrs.width),
				},
			},
			[
				m(
					"small.uppercase.pb-8.b.text-ellipsis",
					{ style: { color: theme.on_surface } },
					lang.makeTranslation("startAndEndTimeZone_title", "Start and end time zone").text,
				), // FIXME Add translations
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
}
