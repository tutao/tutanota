import { CommonSearchListViewAttrs, SearchResultListEntry, SearchResultListRow } from "../../../../mail-app/search/view/SearchListView"
import { CalendarInfoBase } from "../../model/CalendarModel"
import m, { Children, Component, Vnode } from "mithril"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { MultiselectMode, RenderConfig } from "../../../../../ui/base/List"
import { component_size } from "../../../../../ui/size"
import { KindaCalendarRow } from "../../gui/CalendarRow"
import { renderListColumnWrapper } from "../../../../mail-app/search/view/MailSearchListView"

export interface CalendarSearchListViewAttrs extends CommonSearchListViewAttrs {
	cancelCallback: () => unknown | null
	availableCalendars: ReadonlyArray<CalendarInfoBase>
	currentStartDate: Date | null
	extendSearchResult: (extendDate: Date) => unknown
}

export class CalendarSearchListView implements Component<CalendarSearchListViewAttrs> {
	private attrs: CalendarSearchListViewAttrs
	constructor({ attrs }: Vnode<CalendarSearchListViewAttrs>) {
		this.attrs = attrs
	}

	view({ attrs }: Vnode<CalendarSearchListViewAttrs>): Children {
		this.attrs = attrs
		return renderListColumnWrapper(attrs.listModel, Icons.CalendarFilled, attrs.onSingleSelection, this.calendarRenderConfig, attrs.cancelCallback)
	}
	private readonly calendarRenderConfig: RenderConfig<SearchResultListEntry, SearchResultListRow> = {
		itemHeight: component_size.list_row_height,
		multiselectionAllowed: MultiselectMode.Disabled,
		swipe: null,
		createElement: (dom) => {
			const row: SearchResultListRow = new SearchResultListRow(
				new KindaCalendarRow(dom, this.attrs.availableCalendars, () => this.attrs.highlightedStrings),
			)
			m.render(dom, row.render())
			return row
		},
	}
}
