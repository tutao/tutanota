import { noOp } from "@tutao/tutanota-utils"
import m, { ClassComponent, Vnode } from "mithril"
import { getTimeFromClickInteraction } from "../date/CalendarUtils"
import { RowBounds } from "./CalendarTimeGrid"
import { Time } from "../date/Time"
import { TimeColumn } from "./TimeColumn"

/**
 * Handler function called when a calendar cell is interacted with.
 * @param baseDate - The date of the calendar day this cell refers to
 * @param time - The time within that day this cell represents
 */
export type CellActionHandler = (baseDate: Date, time: Time) => unknown

export interface CalendarTimeCellAttrs {
	/**
	 * Optional text to display in the center of the cell (typically the formatted time).
	 *
	 * When defined, also sets an ID on the cell element for querying via `document.getElementById()`.
	 */
	text?: string
	/** The date and time this cell represents */
	dateTime: {
		baseDate: Date
		time: Time
	}
	layout: {
		rowBounds: RowBounds
		subColumnCount: number
	}
	interactions?: {
		onCellPressed?: CellActionHandler
		onCellContextMenuPressed?: CellActionHandler
	}
	showBorderBottom: boolean
}

/**
 * A single cell in a time grid.
 *
 * Represents a time slot that can be clicked to create events or perform other actions.
 * Shows hover effects when interactive handlers are provided.
 */
export class CalendarTimeCell implements ClassComponent<CalendarTimeCellAttrs> {
	view({ attrs }: Vnode<CalendarTimeCellAttrs>) {
		const showHoverEffect = attrs.interactions?.onCellPressed || attrs.interactions?.onCellContextMenuPressed
		const conditionalClasses: Array<string> = []
		if (showHoverEffect) conditionalClasses.push("interactable-cell")
		if (attrs.showBorderBottom) conditionalClasses.push("border-bottom")

		return m(
			".rel.z1.flex.small.justify-center.items-center",
			{
				id: attrs.text ? TimeColumn.getTimeCellId(attrs.dateTime.time.hour) : undefined,
				class: conditionalClasses.join(" "),
				style: {
					gridRow: `${attrs.layout.rowBounds.start} / ${attrs.layout.rowBounds.end}`,
					gridColumn: `1 / span ${attrs.layout.subColumnCount}`,
				} satisfies Partial<CSSStyleDeclaration>,
				onclick: attrs.interactions?.onCellPressed
					? (e: MouseEvent) => {
							e.stopImmediatePropagation()
							const eventBaseTime = getTimeFromClickInteraction(e, attrs.dateTime.time)
							attrs.interactions?.onCellPressed?.(attrs.dateTime.baseDate, eventBaseTime)
						}
					: noOp,
				oncontextmenu: attrs.interactions?.onCellContextMenuPressed
					? (e: MouseEvent) => {
							e.preventDefault()
							const eventBaseTime = getTimeFromClickInteraction(e, attrs.dateTime.time)
							attrs.interactions?.onCellContextMenuPressed?.(attrs.dateTime.baseDate, eventBaseTime)
						}
					: null,
			},
			attrs?.text,
		)
	}
}
