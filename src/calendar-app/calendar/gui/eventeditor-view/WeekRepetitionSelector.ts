import m, { Children, Component, Vnode } from "mithril"
import { TabIndex } from "../../../../common/api/common/TutanotaConstants.js"
import { Select, SelectAttributes } from "../../../../common/gui/base/Select.js"
import { IntervalOption } from "../CalendarGuiUtils.js"
import { lang } from "../../../../common/misc/LanguageViewModel.js"
import stream from "mithril/stream"

export interface WeekRepetitionSelectorAttrs {
	repetitionOptions: IntervalOption[]
}

/**
 */
export class WeekRepetitionSelector implements Component<WeekRepetitionSelectorAttrs> {
	private weekRepetition: number | null = null // if null, repetition occurs on same day
	private repetitionOptions: stream<IntervalOption[]> = stream([])

	constructor(vnode: Vnode<WeekRepetitionSelectorAttrs>) {
		this.repetitionOptions = stream(vnode.attrs.repetitionOptions)
	}

	view(vnode: Vnode<WeekRepetitionSelectorAttrs>): Children {
		return m(
			".flex",
			{
				style: {
					padding: "8px 14px",
					maxHeight: "44px",
				},
			},
			[
				m(".flex-grow", "On"),
				m(Select<IntervalOption, number>, {
					onchange: (newValue) => {
						if (this.weekRepetition === newValue.value) {
							return
						}

						this.weekRepetition = newValue.value
						// this.updateCustomRule(attrs.model, { interval: this.repeatInterval }) TODO write to model
						m.redraw.sync()
					},
					onclose: () => {},
					selected: this.repetitionOptions().filter((option) => option.value === this.weekRepetition)[0],
					ariaLabel: lang.get("repeatsEvery_label"),
					options: this.repetitionOptions,
					noIcon: false,
					expanded: false,
					tabIndex: Number(TabIndex.Programmatic),
					classes: ["no-appearance"],
					renderDisplay: (option) => m(".flex.items-center.gap-vpad-s", [m("span", option.name)]),
					renderOption: (option) =>
						m(
							"button.items-center.flex-grow",
							{
								class: "state-bg button-content dropdown-button pt-s pb-s button-min-height",
							},
							option.name,
						),
					keepFocus: true,
				} satisfies SelectAttributes<IntervalOption, number>),
			],
		)
	}
}
