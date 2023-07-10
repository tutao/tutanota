import m, { Children, Component, Vnode } from "mithril"
import { assertMainOrNode } from "../../api/common/Env"
import { downcast, isSameTypeRef, TypeRef } from "@tutao/tutanota-utils"
import { MailRow } from "../../mail/view/MailRow"
import { ListModel } from "../../misc/ListModel.js"
import { List, ListAttrs, MultiselectMode, RenderConfig } from "../../gui/base/List.js"
import { size } from "../../gui/size.js"
import { KindaContactRow } from "../../contacts/view/ContactListView.js"
import { SearchableTypes } from "./SearchViewModel.js"
import { Contact, Mail, MailTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox.js"
import { BootIcons } from "../../gui/base/icons/BootIcons.js"
import { lang } from "../../misc/LanguageViewModel.js"
import { theme } from "../../gui/theme.js"
import { VirtualRow } from "../../gui/base/ListUtils.js"

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
	currentType: TypeRef<Mail> | TypeRef<Contact>
	isFreeAccount: boolean
}

export class SearchListView implements Component<SearchListViewAttrs> {
	private listModel: ListModel<SearchResultListEntry>

	constructor({ attrs }: Vnode<SearchListViewAttrs>) {
		this.listModel = attrs.listModel
	}

	view({ attrs }: Vnode<SearchListViewAttrs>): Children {
		this.listModel = attrs.listModel

		const showingMail = isSameTypeRef(attrs.currentType, MailTypeRef)
		return attrs.listModel
			? attrs.listModel.isEmptyAndDone()
				? m(ColumnEmptyMessageBox, {
						icon: showingMail ? BootIcons.Mail : BootIcons.Contacts,
						message: () =>
							lang.get("searchNoResults_msg") + "\n" + (attrs.isFreeAccount ? lang.get("goPremium_msg") : lang.get("switchSearchInMenu_label")),
						color: theme.list_message_bg,
				  })
				: m(List, {
						state: attrs.listModel.state,
						renderConfig: showingMail ? this.mailRenderConfig : this.contactRenderConfig,
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
						onSingleExclusiveSelection: (item: SearchResultListEntry) => {
							attrs.listModel.onSingleInclusiveSelection(item)
						},
						selectRangeTowards: (item: SearchResultListEntry) => {
							attrs.listModel.selectRangeTowards(item)
						},
						onStopLoading() {
							attrs.listModel.stopLoading()
						},
				  } satisfies ListAttrs<SearchResultListEntry, SearchResultListRow>)
			: null
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
	domElement: HTMLElement | null = null // set from List

	// this is our own entry which we need for some reason (probably easier to deal with than a lot of sum type entries)
	private _entity: SearchResultListEntry | null = null
	get entity(): SearchResultListEntry | null {
		return this._entity
	}

	private _delegate: MailRow | KindaContactRow

	constructor(delegate: MailRow | KindaContactRow) {
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
