import type { CalendarEvent } from "../../../common/api/entities/tutanota/TypeRefs.js"
import m, { Children, VnodeDOM } from "mithril"

import { SelectableRowContainer, SelectableRowContainerAttrs, SelectableRowSelectedSetter } from "../../../common/gui/SelectableRowContainer.js"
import { setHTMLElementTextWithHighlighting, VirtualRow } from "../../../common/gui/base/ListUtils.js"
import { getTimeZone } from "../../../common/calendar/date/CalendarUtils.js"
import { ViewHolder } from "../../../common/gui/base/List.js"
import { styles } from "../../../common/gui/styles.js"
import { DefaultAnimationTime } from "../../../common/gui/animation/Animations.js"

import { formatEventDuration, getEventColor } from "./CalendarGuiUtils.js"
import { GroupColors } from "../view/CalendarView.js"
import { SearchToken } from "../../../common/api/common/utils/QueryTokenUtils"
import { CalendarInfoBase } from "../model/CalendarModel"

export class CalendarRow implements VirtualRow<CalendarEvent> {
	top: number

	entity: CalendarEvent | null
	colors: GroupColors = new Map()

	private selectionSetter!: SelectableRowSelectedSetter
	private calendarIndicatorDom!: HTMLElement
	private summaryDom!: HTMLElement
	private durationDom!: HTMLElement
	private highlightedStrings?: readonly SearchToken[]

	constructor(
		readonly domElement: HTMLElement,
		private readonly availableCalendars: ReadonlyArray<CalendarInfoBase>,
		private readonly getHighlightedStrings?: () => readonly SearchToken[],
	) {
		this.top = 0
		this.entity = null

		for (let { id, color } of availableCalendars) {
			this.colors.set(id, color)
		}
	}

	update(event: CalendarEvent, selected: boolean, isInMultiSelect: boolean): void {
		const oldEntity = this.entity
		this.entity = event
		const oldHighlightedStrings = this.highlightedStrings
		this.highlightedStrings = this.getHighlightedStrings?.()

		if (oldEntity !== this.entity || oldHighlightedStrings !== this.highlightedStrings) {
			setHTMLElementTextWithHighlighting(this.summaryDom, event.summary, this.highlightedStrings)
		}

		this.calendarIndicatorDom.style.backgroundColor = `#${getEventColor(event, this.colors)}`
		this.durationDom.innerText = formatEventDuration(this.entity, getTimeZone(), false)

		this.selectionSetter(selected, isInMultiSelect)
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		return m(
			SelectableRowContainer,
			{
				onSelectedChangeRef: (changer) => {
					this.selectionSetter = changer
				},
			} satisfies SelectableRowContainerAttrs,
			m(
				".flex.items-center.gap-16.click.border-radius",
				{
					class: (styles.isDesktopLayout() ? "" : "state-bg") + "limit-width full-width",
					style: {
						transition: `background ${DefaultAnimationTime}ms`,
					},
				},
				[
					m("", {
						style: {
							minWidth: "16px",
							minHeight: "16px",
							borderRadius: "50%",
						},
						oncreate: (vnode: VnodeDOM): void => {
							this.calendarIndicatorDom = vnode.dom as HTMLElement
						},
					}),
					m(".flex.col", { class: "min-width-0" }, [
						m("p.b.m-0.badge-line-height", {
							class: "text-ellipsis",
							oncreate: (vnode: VnodeDOM): void => {
								this.summaryDom = vnode.dom as HTMLElement
							},
						}),
						m(".smaller", {
							oncreate: (vnode: VnodeDOM): void => {
								this.durationDom = vnode.dom as HTMLElement
							},
						}),
					]),
				],
			),
		)
	}
}

export class KindaCalendarRow implements ViewHolder<CalendarEvent> {
	readonly cr: CalendarRow
	entity: CalendarEvent | null = null

	constructor(
		dom: HTMLElement,
		private readonly availableCalendars: ReadonlyArray<CalendarInfoBase>,
		private readonly getHighlightedStrings?: () => readonly SearchToken[],
	) {
		this.cr = new CalendarRow(dom, availableCalendars, getHighlightedStrings)
		m.render(dom, this.cr.render())
	}

	update(item: CalendarEvent, selected: boolean, isInMultiSelect: boolean) {
		this.entity = item
		this.cr.update(item, selected, isInMultiSelect)
	}

	render(): Children {
		return this.cr.render()
	}
}
