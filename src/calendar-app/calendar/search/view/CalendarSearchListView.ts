import m, { Children, Component, Vnode } from "mithril"
import { assertMainOrNode } from "../../../../common/api/common/Env"
import { downcast, TypeRef } from "@tutao/tutanota-utils"
import { ListModel } from "../../../../common/misc/ListModel.js"
import { List, ListAttrs, MultiselectMode, RenderConfig } from "../../../../common/gui/base/List.js"
import { size } from "../../../../common/gui/size.js"
import { CalendarEvent } from "../../../../common/api/entities/tutanota/TypeRefs.js"
import ColumnEmptyMessageBox from "../../../../common/gui/base/ColumnEmptyMessageBox.js"
import { BootIcons } from "../../../../common/gui/base/icons/BootIcons.js"
import { lang } from "../../../../common/misc/LanguageViewModel.js"
import { theme } from "../../../../common/gui/theme.js"
import { VirtualRow } from "../../../../common/gui/base/ListUtils.js"
import { styles } from "../../../../common/gui/styles.js"
import { KindaCalendarRow } from "../../gui/CalendarRow.js"

assertMainOrNode()

export class CalendarSearchResultListEntry {
	constructor(readonly entry: CalendarEvent) {}

	get _id(): IdTuple {
		return this.entry._id
	}
}

export interface CalendarSearchListViewAttrs {
	listModel: ListModel<CalendarSearchResultListEntry>
	onSingleSelection: (item: CalendarSearchResultListEntry) => unknown
	isFreeAccount: boolean
	cancelCallback: () => unknown | null
}

export class CalendarSearchListView implements Component<CalendarSearchListViewAttrs> {
	private listModel: ListModel<CalendarSearchResultListEntry>

	constructor({ attrs }: Vnode<CalendarSearchListViewAttrs>) {
		this.listModel = attrs.listModel
	}

	view({ attrs }: Vnode<CalendarSearchListViewAttrs>): Children {
		this.listModel = attrs.listModel
		const icon = BootIcons.Calendar
		const renderConfig = this.calendarRenderConfig

		return attrs.listModel.isEmptyAndDone()
			? m(ColumnEmptyMessageBox, {
					icon,
					message: () => lang.get("searchNoResults_msg"),
					color: theme.list_message_bg,
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
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Disabled,
		swipe: null,
		createElement: (dom: HTMLElement) => {
			const row: SearchResultListRow = new SearchResultListRow(new KindaCalendarRow(dom))
			m.render(dom, row.render())
			return row
		},
	}
}

export class SearchResultListRow implements VirtualRow<CalendarSearchResultListEntry> {
	top: number
	// set from List
	domElement: HTMLElement | null = null

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
		this._delegate.domElement = this.domElement!
		this._entity = entry

		this._delegate.update(downcast(entry.entry), selected, isInMultiSelect)
	}

	render(): Children {
		return this._delegate.render()
	}
}
