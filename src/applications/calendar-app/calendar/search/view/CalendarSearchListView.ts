import m, { Children, Component, Vnode } from "mithril"
import { assertMainOrNode } from "@tutao/app-env"
import { downcast } from "@tutao/utils"
import { List, ListAttrs, MultiselectMode, RenderConfig } from "../../../../../ui/base/List.js"
import { component_size } from "../../../../../ui/size.js"
import ColumnEmptyMessageBox from "../../../../../ui/base/ColumnEmptyMessageBox.js"
import { theme } from "../../../../../ui/theme.js"
import { VirtualRow } from "../../../../../ui/base/ListUtils.js"
import { styles } from "../../../../../ui/styles.js"
import { KindaCalendarRow } from "../../gui/CalendarRow.js"
import { ListElementListModel } from "../../../../common/misc/ListElementListModel"
import { CalendarInfoBase } from "../../model/CalendarModel"
import { Icons } from "../../../../../ui/base/icons/Icons"
import { CalendarEvent } from "@tutao/entities/tutanota"

assertMainOrNode()

export class CalendarSearchResultListEntry {
	constructor(readonly entry: CalendarEvent) {}

	get _id(): IdTuple {
		return this.entry._id
	}
}

export interface CalendarSearchListViewAttrs {
	listModel: ListElementListModel<CalendarSearchResultListEntry>
	onSingleSelection: (item: CalendarSearchResultListEntry) => unknown
	isFreeAccount: boolean
	cancelCallback: () => unknown | null // TODO add search highlights?
	availableCalendars: ReadonlyArray<CalendarInfoBase>
}

export class CalendarSearchListView implements Component<CalendarSearchListViewAttrs> {
	private attrs: CalendarSearchListViewAttrs

	constructor({ attrs }: Vnode<CalendarSearchListViewAttrs>) {
		this.attrs = attrs
	}

	view({ attrs }: Vnode<CalendarSearchListViewAttrs>): Children {
		const icon = Icons.CalendarFilled
		const renderConfig = this.calendarRenderConfig

		return attrs.listModel.isEmptyAndDone()
			? m(ColumnEmptyMessageBox, {
					icon,
					message: "searchNoResults_msg",
					color: theme.on_surface_variant,
				})
			: m(List, {
					state: attrs.listModel.state,
					renderConfig,
					onLoadMore: () => {
						attrs.listModel?.loadMore()
					},
					onRetryLoading: () => {
						attrs.listModel?.retryLoading()
					},
					onSingleSelection: (item: CalendarSearchResultListEntry) => {
						attrs.listModel?.onSingleSelection(item)
						attrs.onSingleSelection(item)
					},
					onSingleTogglingMultiselection: (item: CalendarSearchResultListEntry) => {
						attrs.listModel.onSingleInclusiveSelection(item, styles.isSingleColumnLayout())
					},
					onRangeSelectionTowards: (item: CalendarSearchResultListEntry) => {
						attrs.listModel.selectRangeTowards(item)
					},
					onStopLoading() {
						if (attrs.cancelCallback != null) {
							attrs.cancelCallback()
						}

						attrs.listModel.stopLoading()
					},
				} satisfies ListAttrs<CalendarSearchResultListEntry, SearchResultListRow>)
	}

	private readonly calendarRenderConfig: RenderConfig<CalendarSearchResultListEntry, SearchResultListRow> = {
		itemHeight: component_size.list_row_height,
		multiselectionAllowed: MultiselectMode.Disabled,
		swipe: null,
		createElement: (dom: HTMLElement) => {
			const row: SearchResultListRow = new SearchResultListRow(new KindaCalendarRow(dom, this.attrs.availableCalendars))
			m.render(dom, row.render())
			return row
		},
	}
}

export class SearchResultListRow implements VirtualRow<CalendarSearchResultListEntry> {
	top: number

	// this is our own entry which we need for some reason (probably easier to deal with than a lot of sum type entries)
	private _entity: CalendarSearchResultListEntry | null = null
	get entity(): CalendarSearchResultListEntry | null {
		return this._entity
	}

	private _delegate: KindaCalendarRow

	constructor(delegate: KindaCalendarRow) {
		this._delegate = delegate
		this.top = 0
	}

	update(entry: CalendarSearchResultListEntry, selected: boolean, isInMultiSelect: boolean): void {
		this._entity = entry

		this._delegate.update(downcast(entry.entry), selected, isInMultiSelect)
	}

	render(): Children {
		return this._delegate.render()
	}
}
