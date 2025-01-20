import m, { Children, Component, Vnode } from "mithril"
import { Weekdays } from "../../../api/common/TutanotaConstants.js"
import { client } from "../../../misc/ClientDetector.js"
import { px } from "../../size.js"

export interface WeekdaySelectorItem {
	value: Weekdays
	label: string
}

export interface WeekdaySelectorAttrs {
	items: Array<WeekdaySelectorItem>
	selectedDays: Weekdays[] | null
	selectionChanged: (value: Weekdays) => unknown
}

const WEEKDAY_BUTTON_MOBILE_DIMENSIONS: string = px(36)
const WEEKDAY_BUTTON_WEB_DIMENSIONS: string = px(44)

/**
 * Weekday picker that allows minimum 0, maximum 7 days to be selected.
 * Displays each Weekday in a circle containing the first letter of the day.
 */
export class WeekdaySelector implements Component<WeekdaySelectorAttrs> {
	private isMobile: boolean = client.isMobileDevice()

	view(vnode: Vnode<WeekdaySelectorAttrs>): Children {
		return m(
			".flex-space-around.weekday-selector",
			{
				style: this.isMobile ? { margin: "4px 12px" } : {},
			},
			vnode.attrs.items.map((item) => {
				return m(WeekdaySelectorButton, {
					weekday: item,
					buttonDimensions: this.isMobile ? WEEKDAY_BUTTON_MOBILE_DIMENSIONS : WEEKDAY_BUTTON_WEB_DIMENSIONS,
					selected: vnode.attrs.selectedDays?.includes(item.value) ?? false,
				})
			}),
		)
	}

	private gatherSelectedWeekdays() {}
}

interface WeekdaySelectorButtonAttrs {
	weekday: WeekdaySelectorItem
	buttonDimensions: string
	selected: boolean
}

/**
 * Singular Button for the WeekdaySelector.
 */
class WeekdaySelectorButton implements Component<WeekdaySelectorButtonAttrs> {
	private isToggled: boolean

	constructor({ attrs }: Vnode<WeekdaySelectorButtonAttrs>) {
		this.isToggled = attrs.selected
	}

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
						width: vnode.attrs.buttonDimensions,
						height: vnode.attrs.buttonDimensions,
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
