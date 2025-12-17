import { noOp } from "@tutao/tutanota-utils"
import m, { ClassComponent, Vnode } from "mithril"
import { getTimeFromClickInteraction } from "../date/CalendarUtils"
import { RowBounds } from "./CalendarTimeGrid"
import { Time } from "../date/Time"
import { CalendarTimeColumn } from "./CalendarTimeColumn"

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
	showBorderRight?: boolean // ensures right border doesnt disappear on hover for time column cells
}

/**
 * A single cell in a time grid.
 *
 * Represents a time slot that can be clicked to create events or perform other actions.
 * Shows hover effects when interactive handlers are provided.
 */
export class CalendarTimeCell implements ClassComponent<CalendarTimeCellAttrs> {
	view({ attrs }: Vnode<CalendarTimeCellAttrs>) {
		return m(
			".rel.z1.flex.small.justify-center.items-center.text-center",
			{
				id: attrs.text ? CalendarTimeColumn.getTimeCellId(attrs.dateTime.time.hour) : undefined,
				class: this.resolveClasses(attrs),
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

	private resolveClasses(attrs: CalendarTimeCellAttrs) {
		const classes: Array<string> = []

		const showHoverEffect = Boolean(attrs.interactions?.onCellPressed || attrs.interactions?.onCellContextMenuPressed)
		if (showHoverEffect) {
			classes.push("interactable-cell")
		}
		if (attrs.showBorderBottom) {
			classes.push("border-bottom")
		}
		if (attrs.text) {
			classes.push("pl-8", "pr-8")
		}

		if (attrs.showBorderRight) {
			classes.push("border-right")
		}
		return classes.join(" ")
	}
}
