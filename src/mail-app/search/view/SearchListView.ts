import m, { Children, Component, Vnode } from "mithril"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { downcast, isSameTypeRef, TypeRef } from "@tutao/tutanota-utils"
import { MailRow } from "../../mail/view/MailRow"
import { ListModel } from "../../../common/misc/ListModel.js"
import { List, ListAttrs, MultiselectMode, RenderConfig } from "../../../common/gui/base/List.js"
import { size } from "../../../common/gui/size.js"
import { KindaContactRow } from "../../contacts/view/ContactListView.js"
import { SearchableTypes } from "./SearchViewModel.js"
import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import ColumnEmptyMessageBox from "../../../common/gui/base/ColumnEmptyMessageBox.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { theme } from "../../../common/gui/theme.js"
import { VirtualRow } from "../../../common/gui/base/ListUtils.js"
import { styles } from "../../../common/gui/styles.js"
import { KindaCalendarRow } from "../../../calendar-app/calendar/gui/CalendarRow.js"
import { AllIcons } from "../../../common/gui/base/Icon.js"

assertMainOrNode()

export class SearchResultListEntry {
	constructor(readonly entry: SearchableTypes) {}

	get _id(): IdTuple {
		return this.entry._id
	}
}

export interface SearchListViewAttrs {
	listModel: ListModel<SearchResultListEntry>
	onSingleSelection: (item: SearchResultListEntry) => unknown
	currentType: TypeRef<Mail> | TypeRef<Contact> | TypeRef<CalendarEvent>
	isFreeAccount: boolean
	cancelCallback: () => unknown | null
}

export class SearchListView implements Component<SearchListViewAttrs> {
	private listModel: ListModel<SearchResultListEntry>

	constructor({ attrs }: Vnode<SearchListViewAttrs>) {
		this.listModel = attrs.listModel
	}

	view({ attrs }: Vnode<SearchListViewAttrs>): Children {
		this.listModel = attrs.listModel
		const { icon, renderConfig } = this.getRenderItems(attrs.currentType)

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
					onSingleSelection: (item: SearchResultListEntry) => {
						attrs.listModel?.onSingleSelection(item)
						attrs.onSingleSelection(item)
					},
					onSingleTogglingMultiselection: (item: SearchResultListEntry) => {
						attrs.listModel.onSingleInclusiveSelection(item, styles.isSingleColumnLayout())
					},
					onRangeSelectionTowards: (item: SearchResultListEntry) => {
						attrs.listModel.selectRangeTowards(item)
					},
					onStopLoading() {
						if (attrs.cancelCallback != null) {
							attrs.cancelCallback()
						}

						attrs.listModel.stopLoading()
					},
			  } satisfies ListAttrs<SearchResultListEntry, SearchResultListRow>)
	}

	private getRenderItems(type: TypeRef<Mail> | TypeRef<Contact> | TypeRef<CalendarEvent>): {
		icon: AllIcons
		renderConfig: RenderConfig<SearchResultListEntry, SearchResultListRow>
	} {
		if (isSameTypeRef(type, ContactTypeRef)) {
			return {
				icon: BootIcons.Contacts,
				renderConfig: this.contactRenderConfig,
			}
		} else if (isSameTypeRef(type, CalendarEventTypeRef)) {
			return {
				icon: BootIcons.Calendar,
				renderConfig: this.calendarRenderConfig,
			}
		} else {
			return {
				icon: BootIcons.Mail,
				renderConfig: this.mailRenderConfig,
			}
		}
	}

	private readonly calendarRenderConfig: RenderConfig<SearchResultListEntry, SearchResultListRow> = {
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Disabled,
		swipe: null,
		createElement: (dom) => {
			const row: SearchResultListRow = new SearchResultListRow(new KindaCalendarRow(dom))
			m.render(dom, row.render())
			return row
		},
	}

	private readonly mailRenderConfig: RenderConfig<SearchResultListEntry, SearchResultListRow> = {
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
		createElement: (dom) => {
			const row: SearchResultListRow = new SearchResultListRow(
				new MailRow(true, () => row.entity && this.listModel.onSingleExclusiveSelection(row.entity)),
			)
			m.render(dom, row.render())
			return row
		},
	}

	private readonly contactRenderConfig: RenderConfig<SearchResultListEntry, SearchResultListRow> = {
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
		createElement: (dom) => {
			const row: SearchResultListRow = new SearchResultListRow(
				new KindaContactRow(dom, () => row.entity && this.listModel.onSingleExclusiveSelection(row.entity)),
			)
			m.render(dom, row.render())
			return row
		},
	}
}

export class SearchResultListRow implements VirtualRow<SearchResultListEntry> {
	top: number
	// set from List
	domElement: HTMLElement | null = null

	// this is our own entry which we need for some reason (probably easier to deal with than a lot of sum type entries)
	private _entity: SearchResultListEntry | null = null
	get entity(): SearchResultListEntry | null {
		return this._entity
	}

	private _delegate: MailRow | KindaContactRow | KindaCalendarRow

	constructor(delegate: MailRow | KindaContactRow | KindaCalendarRow) {
		this._delegate = delegate
		this.top = 0
	}

	update(entry: SearchResultListEntry, selected: boolean, isInMultiSelect: boolean): void {
		this._delegate.domElement = this.domElement
		this._entity = entry

		this._delegate.update(downcast(entry.entry), selected, isInMultiSelect)
	}

	render(): Children {
		return this._delegate.render()
	}
}
