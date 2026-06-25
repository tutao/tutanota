import { CalendarInfoBase } from "../../model/CalendarModel"
import m, { Children, Component, Vnode } from "mithril"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { MultiselectMode, RenderConfig } from "../../../../../ui/base/List"
import { component_size } from "../../../../../ui/size"
import { KindaCalendarRow } from "../../gui/CalendarRow"
import { CalendarEvent } from "@tutao/entities/tutanota"
import { CommonSearchListViewAttrs, renderListColumnWrapper } from "../../../../common/search/SearchUtils"
import { EnvProvider } from "@tutao/app-env"

EnvProvider.assertMainOrNode()

export interface CalendarSearchListViewAttrs extends CommonSearchListViewAttrs<CalendarEvent> {
	cancelCallback: () => unknown | null
	availableCalendars: ReadonlyArray<CalendarInfoBase>
	currentStartDate: Date | null
	extendSearchResult: (extendDate: Date) => unknown
}

/** Displays search results for calendar search */
export class CalendarSearchListView implements Component<CalendarSearchListViewAttrs> {
	private attrs: CalendarSearchListViewAttrs
	constructor({ attrs }: Vnode<CalendarSearchListViewAttrs>) {
		this.attrs = attrs
	}

	view({ attrs }: Vnode<CalendarSearchListViewAttrs>): Children {
		this.attrs = attrs
		return renderListColumnWrapper(attrs.listModel, Icons.CalendarFilled, attrs.onSingleSelection, this.calendarRenderConfig, attrs.cancelCallback)
	}
	private readonly calendarRenderConfig: RenderConfig<CalendarEvent, KindaCalendarRow> = {
		itemHeight: component_size.list_row_height,
		multiselectionAllowed: MultiselectMode.Disabled,
		swipe: null,
		createElement: (dom) => {
			const row = new KindaCalendarRow(dom, this.attrs.availableCalendars, () => this.attrs.highlightedStrings)
			m.render(dom, row.render())
			return row
		},
	}
}
