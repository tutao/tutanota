import m, { Children, Component, Vnode } from "mithril"
import { Weekday } from "../../../../common/api/common/TutanotaConstants.js"
import { Select, SelectAttributes } from "../../../../common/gui/base/Select.js"
import { IntervalOption } from "../CalendarGuiUtils.js"
import { lang } from "../../../../common/misc/LanguageViewModel.js"
import stream from "mithril/stream"

export interface WeekRepetitionSelectorAttrs {
	repetitionOptionsAndWeekday: { options: IntervalOption[]; weekday: number }
	gatherSelectedDay: (weekday: Weekday[], interval: number) => void
	interval: number
}

/**
 * Component for selecting what specific Weekday an event should repeat on.
 * The weekday is always passed in from the outside, as a number.
 */
export class WeekRepetitionSelector implements Component<WeekRepetitionSelectorAttrs> {
	private weekRepetition: number = 0 // if 0, repetition occurs on same day
	private repetitionOptions: stream<IntervalOption[]> = stream([])
	private weekday: number

	constructor(vnode: Vnode<WeekRepetitionSelectorAttrs>) {
		const { options, weekday } = vnode.attrs.repetitionOptionsAndWeekday
		this.repetitionOptions = stream(options)
		this.weekday = weekday - 1 // decrement to account for the offset from DateTime.weekday()
		this.weekRepetition = vnode.attrs.interval
	}

	view(vnode: Vnode<WeekRepetitionSelectorAttrs>): Children {
		return m(
			".flex.justify-between",
			{
				style: {
					padding: "8px 14px",
					maxHeight: "44px",
				},
			},
			[
				m(".flex-grow", lang.getTranslation("onDays_label", { "{days}": "" }).text),
				m(
					".rel",
					m(Select<IntervalOption, number>, {
						onchange: (newValue) => {
							if (this.weekRepetition === newValue.value) {
								return
							}

							this.weekRepetition = newValue.value
							vnode.attrs.gatherSelectedDay([Object.values(Weekday)[this.weekday]], this.weekRepetition)
							m.redraw.sync()
						},
						onclose: () => {},
						selected: this.repetitionOptions().filter((option) => option.value === this.weekRepetition)[0],
						ariaLabel: lang.get("repeatsEvery_label"),
						options: this.repetitionOptions,
						noIcon: false,
						expanded: false,
						classes: ["no-appearance"],
						responsive: true,
						renderDisplay: (option) => m(".flex.items-center.gap-8", [m("span", option.name)]),
						renderOption: (option) =>
							m(
								"button.items-center.flex-grow",
								{
									class: "state-bg button-content dropdown-button pt-8 pb-8 button-min-height",
								},
								option.name,
							),
					} satisfies SelectAttributes<IntervalOption, number>),
				),
			],
		)
	}
}
