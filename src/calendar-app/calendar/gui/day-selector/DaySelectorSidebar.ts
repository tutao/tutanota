import m, { Children, Component, Vnode } from "mithril"
import { formatMonthWithFullYear } from "../../../../common/misc/Formatter.js"
import { incrementMonth, isSameDay } from "@tutao/tutanota-utils"
import { DaySelector } from "./DaySelector.js"
import renderSwitchMonthArrowIcon from "../../../../common/gui/base/buttons/ArrowButton.js"
import { isDesktop } from "../../../../common/api/common/Env"

export interface DaySelectorSidebarAttrs {
	selectedDate: Date
	onDateSelected: (date: Date, dayClick: boolean) => unknown
	startOfTheWeekOffset: number
	showDaySelection: boolean
	highlightToday: boolean
	highlightSelectedWeek: boolean
	hasEventsOn: (date: Date) => boolean
}

export class DaySelectorSidebar implements Component<DaySelectorSidebarAttrs> {
	private currentDate: Date
	private openDate: Date

	constructor(vnode: Vnode<DaySelectorSidebarAttrs>) {
		this.currentDate = vnode.attrs.selectedDate
		this.openDate = vnode.attrs.selectedDate
	}

	view(vnode: Vnode<DaySelectorSidebarAttrs>): Children {
		if (vnode.attrs.selectedDate !== this.openDate) {
			this.currentDate = vnode.attrs.selectedDate
			this.openDate = vnode.attrs.selectedDate
		}

		const disableHighlight = !isSameDay(vnode.attrs.selectedDate, this.currentDate)

		return m(
			isDesktop() ? ".plr-m.mt-form" : ".plr-m.mt-s",
			m(".elevated-bg.pt-s.pb-m.border-radius.flex.flex-column", [
				this.renderPickerHeader(this.currentDate),
				m(".flex-grow.overflow-hidden", [
					m(DaySelector, {
						selectedDate: this.currentDate,
						onDateSelected: vnode.attrs.onDateSelected,
						wide: false,
						startOfTheWeekOffset: vnode.attrs.startOfTheWeekOffset,
						isDaySelectorExpanded: true,
						handleDayPickerSwipe: (isNext) => {
							this.onMonthChange(isNext)
							m.redraw()
						},
						showDaySelection: vnode.attrs.showDaySelection && !disableHighlight,
						highlightToday: vnode.attrs.highlightToday,
						highlightSelectedWeek: vnode.attrs.highlightSelectedWeek && !disableHighlight,
						useNarrowWeekName: true,
						hasEventOn: vnode.attrs.hasEventsOn,
					}),
				]),
			]),
		)
	}

	private renderPickerHeader(date: Date): Children {
		return m(".flex.flex-space-between.pb.items-center.mlr-xs", [
			renderSwitchMonthArrowIcon(false, 24, () => this.onMonthChange(false)),
			m(
				".b.mlr-s",
				{
					style: {
						fontSize: "14px",
					},
				},
				formatMonthWithFullYear(date),
			),
			renderSwitchMonthArrowIcon(true, 24, () => this.onMonthChange(true)),
		])
	}

	private onMonthChange(forward: boolean) {
		this.currentDate = incrementMonth(this.currentDate, forward ? 1 : -1)
	}
}
