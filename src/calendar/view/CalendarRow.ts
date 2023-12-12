import type { CalendarEvent } from "../../api/entities/tutanota/TypeRefs.js"
import { locator } from "../../api/main/MainLocator.js"
import m, { Children } from "mithril"

import { SelectableRowContainer, SelectableRowContainerAttrs, SelectableRowSelectedSetter } from "../../gui/SelectableRowContainer.js"
import { VirtualRow } from "../../gui/base/ListUtils.js"
import { CalendarAgendaItemView, CalendarAgendaItemViewAttrs } from "./CalendarAgendaItemView.js"
import { formatEventDuration, getEventColor, getGroupColors, getTimeZone } from "../date/CalendarUtils.js"
import { ViewHolder } from "../../gui/base/List.js"

export class CalendarRow implements VirtualRow<CalendarEvent> {
	top: number

	entity: CalendarEvent | null
	colors: Map<any, any>

	private selectionSetter!: SelectableRowSelectedSetter

	constructor(readonly domElement: HTMLElement, private readonly onSelected: (event: CalendarEvent) => unknown) {
		this.top = 0
		this.entity = null
		this.colors = getGroupColors(locator.logins.getUserController().userSettingsGroupRoot)
	}

	update(event: CalendarEvent): void {
		this.entity = event
		m.render(this.domElement, this.render())
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		if (!this.entity) return null
		return m(
			SelectableRowContainer,
			{
				onSelectedChangeRef: (changer) => {
					this.selectionSetter = changer
				},
			} satisfies SelectableRowContainerAttrs,
			[
				m(CalendarAgendaItemView, {
					event: this.entity,
					color: getEventColor(this.entity, this.colors),
					click: (domEvent) => this.entity && this.onSelected(this.entity),
					zone: getTimeZone(),
					day: this.entity.startTime,
					timeText: formatEventDuration(this.entity, getTimeZone(), false), //renderCalendarEventTimesForDisplay(this.entity),
					limitSummaryWidth: true,
				} satisfies CalendarAgendaItemViewAttrs),
			],
		)
	}
}

export class KindaCalendarRow implements ViewHolder<CalendarEvent> {
	readonly cr: CalendarRow
	domElement: HTMLElement
	entity: CalendarEvent | null = null

	constructor(dom: HTMLElement, onToggleSelection: (item: CalendarEvent) => unknown) {
		this.cr = new CalendarRow(dom, onToggleSelection)
		this.domElement = dom
		m.render(dom, this.cr.render())
	}

	update(item: CalendarEvent, selected: boolean, isInMultiSelect: boolean) {
		this.entity = item
		this.cr.update(item)
	}

	render(): Children {
		return this.cr.render()
	}
}
