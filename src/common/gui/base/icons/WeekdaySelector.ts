import m, { Children, Component, Vnode } from "mithril"
import { Weekdays } from "../../../api/common/TutanotaConstants.js"

export interface WeekdaySelectorItem {
	value: Weekdays
	label: string
}

export interface WeekdaySelectorAttrs {
	items: Array<WeekdaySelectorItem>
}

/**
 * Weekday picker that allows at least 1, maximum 7 days to be selected.
 * Displays each Weekday in a circle containing the first letter of the day.
 */
export class WeekdaySelector implements Component<WeekdaySelectorAttrs> {
	view(vnode: Vnode<WeekdaySelectorAttrs>): Children {
		return m(
			".flex-space-around",
			{
				style: {
					margin: "4px 12px",
					height: "52px",
				},
			},
			vnode.attrs.items.map((item) => {
				return m(WeekdaySelectorButton, { weekday: item })
			}),
		)
	}
}

interface WeekdaySelectorButtonAttrs {
	weekday: WeekdaySelectorItem
	onEditorClosed?: () => unknown // callback for when Editor is closed to pass back values
}

/**
 *
 */
class WeekdaySelectorButton implements Component<WeekdaySelectorButtonAttrs> {
	private isToggled: boolean = false

	get highlightedCircleClass() {
		return this.isToggled ? "calendar-selected-day-circle" : "weekday-button-unselected-circle"
	}

	get highlightedTextClass() {
		return this.isToggled ? "calendar-selected-day-text" : "weekday-button-unselected-text"
	}

	// "toggles" the switch
	private toggle() {
		this.isToggled = !this.isToggled
	}

	view(vnode: Vnode<WeekdaySelectorButtonAttrs>): Children {
		return m(
			"button.rel.click.flex.items-center.justify-center.flex-grow-shrink-0",
			{
				role: "option",
				onclick: () => {
					this.toggle()
				},
			},
			[
				m(".abs.z1.circle", {
					class: this.highlightedCircleClass,
					style: {
						width: "36px",
						height: "36px",
					},
				}),
				m(
					".full-width.center.z2",
					{
						class: this.highlightedTextClass,
					},
					vnode.attrs.weekday.label,
				),
			],
		)
	}
}
