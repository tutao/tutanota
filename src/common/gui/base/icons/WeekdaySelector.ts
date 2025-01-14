import m, { Children, Component, Vnode } from "mithril"
import { px } from "../../size.js"

export interface WeekdaySelectorItem<T> {
	value: T
	label: string
	selected: boolean
}

export interface WeekdaySelectorAttrs<T> {
	onValueSelected: (item: WeekdaySelectorItem<T>) => unknown
	items: Array<WeekdaySelectorItem<T>>
}

/**
 * Weekday picker that allows at least 1, maximum 7 days to be selected.
 * Displays each Weekday in a circle containing the first letter of the day.
 */
export class WeekdaySelector<T> implements Component<WeekdaySelectorAttrs<T>> {
	view(vnode: Vnode<WeekdaySelectorAttrs<T>>): Children {
		return vnode.attrs.items.map((item) => {
			let circleClass = ""
			let textClass = ""
			if (item.selected) {
				circleClass = "calendar-selected-day-circle"
				textClass = "calendar-selected-day-text"
			}

			return m(
				"button.click.items-center.justify-center",
				{
					role: "option",
					onclick: () => {
						vnode.attrs.onValueSelected(item)
					},
				},
				[
					m(".abs.z1.circle", {
						class: circleClass,
						style: {
							width: px(40 * 0.625),
							height: px(40 * 0.625),
						},
					}),
					m(
						".full-width.height-100p.center.z2",
						{
							class: textClass,
							style: {
								fontSize: px(14),
							},
						},
						item.label,
					),
				],
			)
		})
	}
}
