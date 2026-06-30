import m, { Children, Component, Vnode } from "mithril"
import { px } from "../../../../../ui/size"
import { theme } from "../../../../../ui/theme"
import { lang, TranslationKey } from "../../../../../ui/utils/LanguageViewModel"
import { PrimaryButton, PrimaryButtonAttrs, SecondaryButton } from "../../../../../ui/base/buttons/VariantButtons"
import { TimeZoneSelectorDropdown } from "./TimeZoneSelectorDropdown"
import { IANATimeZone } from "../DateTimeTextFormatterUtils"
import { Checkbox, CheckboxAttrs } from "../../../../../ui/base/Checkbox"
import { CalendarEventWhenModel } from "../eventeditor-model/CalendarEventWhenModel"

export type TimeZoneSelectionPageAttrs = {
	width: number
	whenModel: CalendarEventWhenModel
	separateStartAndEndTimeZone: boolean
	onToggleSeparateStartAndEndTimeZone: (useSeparateEndTimeZone: boolean) => void
	onRemoveTimeZone: () => void
	onConfirm: (startTimeZone: IANATimeZone, endTimezone: IANATimeZone) => void
}

export class TimeZoneSelectionPage implements Component<TimeZoneSelectionPageAttrs> {
	private selectedStartTimeZone: IANATimeZone
	private selectedEndTimeZone: IANATimeZone

	constructor({ attrs }: Vnode<TimeZoneSelectionPageAttrs>) {
		this.selectedStartTimeZone = attrs.whenModel.getStartTimeZoneOrDefault()
		this.selectedEndTimeZone = attrs.whenModel.getEndTimeZoneOrDefault()
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
					this.renderStartTimeZoneDropdown(attrs),
					attrs.separateStartAndEndTimeZone && this.renderEndTimeZoneDropdown(),
					this.renderUseSeparateEndTimeZoneCheckbox(attrs),
				]),
				m(".flex.gap-12.justify-right", [
					m(SecondaryButton, {
						label: lang.getTranslation("removeTimeZone_action"),
						onclick: () => {
							attrs.onRemoveTimeZone()
							attrs.onToggleSeparateStartAndEndTimeZone(false)

							this.selectedStartTimeZone = attrs.whenModel.getStartTimeZoneOrDefault()
							this.selectedEndTimeZone = attrs.whenModel.getEndTimeZoneOrDefault()
						},
						width: "flex",
					} satisfies PrimaryButtonAttrs),
					m(PrimaryButton, {
						label: lang.getTranslation("confirm_action"),
						onclick: () => attrs.onConfirm(this.selectedStartTimeZone, this.selectedEndTimeZone),
						width: "flex",
					} satisfies PrimaryButtonAttrs),
				]),
			],
		)
	}

	private renderStartTimeZoneDropdown(attrs: TimeZoneSelectionPageAttrs): Children {
		return this.renderTimeZoneDropdown(
			attrs.separateStartAndEndTimeZone ? "startTimeZone_title" : "startAndEndTimeZone_title",
			this.selectedStartTimeZone,
			(newTimeZone) => {
				this.selectedStartTimeZone = newTimeZone
				if (!attrs.separateStartAndEndTimeZone) {
					this.selectedEndTimeZone = newTimeZone
				}
			},
		)
	}

	private renderEndTimeZoneDropdown(): Children {
		return this.renderTimeZoneDropdown("endTimeZone_title", this.selectedEndTimeZone, (newTimeZone) => {
			this.selectedEndTimeZone = newTimeZone
		})
	}

	private renderTimeZoneDropdown(
		titleTranslationKey: TranslationKey,
		selectedTimeZone: IANATimeZone,
		onSelectionChanged: (newTimeZone: IANATimeZone) => void,
	): Children {
		return m(".flex.col.gap-8", [
			m("small.uppercase.b.text-ellipsis", { style: { color: theme.on_surface } }, lang.getTranslation(titleTranslationKey).text),
			m(TimeZoneSelectorDropdown, { selectedTimeZone, onSelectionChanged }),
		])
	}

	private renderUseSeparateEndTimeZoneCheckbox(attrs: TimeZoneSelectionPageAttrs) {
		return m(Checkbox, {
			label: () => lang.getTranslation("useSeparateEndTimeZone_label").text,
			checked: attrs.separateStartAndEndTimeZone,
			onChecked: (separateEndTimeZone) => {
				if (!separateEndTimeZone) {
					this.selectedEndTimeZone = this.selectedStartTimeZone
				}
				attrs.onToggleSeparateStartAndEndTimeZone(separateEndTimeZone)
			},
		} satisfies CheckboxAttrs)
	}
}
