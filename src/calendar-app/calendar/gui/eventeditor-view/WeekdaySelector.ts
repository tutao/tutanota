import m, { Children, Component, Vnode } from "mithril"
import { Weekday } from "../../../../common/api/common/TutanotaConstants.js"
import { client } from "../../../../common/misc/ClientDetector.js"
import { px } from "../../../../common/gui/size.js"

export interface WeekdayToTranslation {
	value: Weekday
	label: string
}

export interface WeekdaySelectorAttrs {
	items: Array<WeekdayToTranslation>
	selectedDays: Weekday[]
	gatherSelectedDays: (value: Weekday[]) => void
}

const WEEKDAY_BUTTON_MOBILE_DIMENSIONS: string = px(36)

/**
 * Weekday picker that allows minimum 0, maximum 7 days to be selected.
 * Displays each Weekday in a circle containing the first letter of the day.
 */
export class WeekdaySelector implements Component<WeekdaySelectorAttrs> {
	private isMobile: boolean = client.isMobileDevice()
	private selectedDays: Weekday[] = []

	constructor(vnode: Vnode<WeekdaySelectorAttrs>) {
		this.selectedDays = vnode.attrs.selectedDays
	}

	view(vnode: Vnode<WeekdaySelectorAttrs>): Children {
		return m(
			".flex-space-around.weekday-selector",
			{
				style: this.isMobile ? { margin: "8px 12px" } : {},
				ariaMultiselectable: true,
			},
			vnode.attrs.items.map((item) => {
				return m(WeekdaySelectorButton, {
					weekday: item,
					buttonDimensions: WEEKDAY_BUTTON_MOBILE_DIMENSIONS,
					selected: vnode.attrs.selectedDays?.includes(item.value) ?? false,
					onSelectionChanged: (weekday: Weekday) => {
						if (this.selectedDays.includes(weekday)) {
							this.selectedDays.splice(this.selectedDays.indexOf(weekday), 1)
						} else {
							this.selectedDays.push(weekday)
						}
						vnode.attrs.gatherSelectedDays(this.selectedDays)
					},
				} satisfies WeekdaySelectorButtonAttrs)
			}),
		)
	}
}

interface WeekdaySelectorButtonAttrs {
	weekday: WeekdayToTranslation
	buttonDimensions: string
	selected: boolean
	onSelectionChanged: (weekday: Weekday) => void
}

/**
 * Singular Button for the WeekdaySelector.
 */
class WeekdaySelectorButton implements Component<WeekdaySelectorButtonAttrs> {
	private isToggled: boolean
	private readonly value: Weekday

	constructor({ attrs }: Vnode<WeekdaySelectorButtonAttrs>) {
		this.isToggled = attrs.selected
		this.value = attrs.weekday.value
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
				ariaSelected: this.isToggled,
				onclick: () => {
					this.toggle()
					vnode.attrs.onSelectionChanged(this.value)
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
