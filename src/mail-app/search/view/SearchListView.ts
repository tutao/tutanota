import m, { Children, Component, Vnode } from "mithril"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { downcast, isSameTypeRef, TypeRef } from "@tutao/tutanota-utils"
import { MailRow } from "../../mail/view/MailRow"
import { ListElementListModel } from "../../../common/misc/ListElementListModel.js"
import { List, ListAttrs, MultiselectMode, RenderConfig } from "../../../common/gui/base/List.js"
import { component_size, size } from "../../../common/gui/size.js"
import { KindaContactRow } from "../../contacts/view/ContactListView.js"
import { SearchableTypes } from "./SearchViewModel.js"
import { CalendarEvent, CalendarEventTypeRef, Contact, ContactTypeRef, Mail, MailFolder } from "../../../common/api/entities/tutanota/TypeRefs.js"
import ColumnEmptyMessageBox from "../../../common/gui/base/ColumnEmptyMessageBox.js"
import { BootIcons } from "../../../common/gui/base/icons/BootIcons.js"
import { theme } from "../../../common/gui/theme.js"
import { VirtualRow } from "../../../common/gui/base/ListUtils.js"
import { styles } from "../../../common/gui/styles.js"
import { KindaCalendarRow } from "../../../calendar-app/calendar/gui/CalendarRow.js"
import { AllIcons } from "../../../common/gui/base/Icon.js"
import type { SearchToken } from "../../../common/api/common/utils/QueryTokenUtils"
import { shouldAlwaysShowMultiselectCheckbox } from "../../../common/gui/SelectableRowContainer"
import { ListColumnWrapper } from "../../../common/gui/ListColumnWrapper"
import { CalendarInfoBase } from "../../../calendar-app/calendar/model/CalendarModel"

assertMainOrNode()

export class SearchResultListEntry {
	constructor(readonly entry: SearchableTypes) {}

	get _id(): IdTuple {
		return this.entry._id
	}
}

export interface SearchListViewAttrs {
	listModel: ListElementListModel<SearchResultListEntry>
	onSingleSelection: (item: SearchResultListEntry) => unknown
	currentType: TypeRef<Mail | Contact | CalendarEvent>
	isFreeAccount: boolean
	cancelCallback: () => unknown | null
	getLabelsForMail: (mail: Mail) => MailFolder[]
	highlightedStrings: readonly SearchToken[]
	availableCalendars: ReadonlyArray<CalendarInfoBase>
}

export class SearchListView implements Component<SearchListViewAttrs> {
	private attrs: SearchListViewAttrs

	private get listModel(): ListElementListModel<SearchResultListEntry> {
		return this.attrs.listModel
	}

	constructor({ attrs }: Vnode<SearchListViewAttrs>) {
		this.attrs = attrs
	}

	view({ attrs }: Vnode<SearchListViewAttrs>): Children {
		this.attrs = attrs
		const { icon, renderConfig } = this.getRenderItems(attrs.currentType)

		return m(
			ListColumnWrapper,
			{ headerContent: null, class: styles.isSingleColumnLayout() ? undefined : "column-resize-margin" },
			attrs.listModel.isEmptyAndDone()
				? m(ColumnEmptyMessageBox, {
						icon,
						message: "searchNoResults_msg",
						color: theme.on_surface_variant,
					})
				: m(List, {
						state: attrs.listModel.state,
						renderConfig,
						onLoadMore: () => {
							this.listModel.loadMore()
						},
						onRetryLoading: () => {
							this.listModel.retryLoading()
						},
						onSingleSelection: (item: SearchResultListEntry) => {
							this.listModel.onSingleSelection(item)
							attrs.onSingleSelection(item)
						},
						onSingleTogglingMultiselection: (item: SearchResultListEntry) => {
							this.listModel.onSingleInclusiveSelection(item, styles.isSingleColumnLayout())
						},
						onRangeSelectionTowards: (item: SearchResultListEntry) => {
							this.listModel.selectRangeTowards(item)
						},
						onStopLoading: () => {
							if (attrs.cancelCallback != null) {
								attrs.cancelCallback()
							}

							this.listModel.stopLoading()
						},
					} satisfies ListAttrs<SearchResultListEntry, SearchResultListRow>),
		)
	}

	private getRenderItems(type: TypeRef<Mail | Contact | CalendarEvent>): {
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

	private readonly mailRenderConfig: RenderConfig<SearchResultListEntry, SearchResultListRow> = {
		itemHeight: component_size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
		createElement: (dom) => {
			const row: SearchResultListRow = new SearchResultListRow(
				new MailRow(
					true,
					(mail) => this.attrs.getLabelsForMail(mail),
					() => row.entity && this.listModel.onSingleExclusiveSelection(row.entity),
					() => this.attrs.highlightedStrings,
				),
			)
			m.render(dom, row.render())
			return row
		},
	}

	private readonly contactRenderConfig: RenderConfig<SearchResultListEntry, SearchResultListRow> = {
		itemHeight: component_size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		swipe: null,
		createElement: (dom) => {
			const row: SearchResultListRow = new SearchResultListRow(
				new KindaContactRow(
					dom,
					() => row.entity && this.listModel.onSingleExclusiveSelection(row.entity),
					() => shouldAlwaysShowMultiselectCheckbox(),
					() => this.attrs.highlightedStrings,
				),
			)
			m.render(dom, row.render())
			return row
		},
	}
}

export class SearchResultListRow implements VirtualRow<SearchResultListEntry> {
	top: number

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
		this._entity = entry

		this._delegate.update(downcast(entry.entry), selected, isInMultiSelect)
	}

	render(): Children {
		return this._delegate.render()
	}
}
