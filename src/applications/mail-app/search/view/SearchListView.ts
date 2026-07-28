import { Children } from "mithril"
import { assertMainOrNode } from "@tutao/app-env"
import { downcast } from "@tutao/utils"
import { MailRow } from "../../mail/view/MailRow"
import { KindaContactRow } from "../../contacts/view/ContactListView.js"
import { SearchableTypes } from "./SearchViewModel.js"
import { VirtualRow } from "../../../../ui/base/ListUtils.js"
import { KindaCalendarRow } from "../../../calendar-app/calendar/gui/CalendarRow.js"
import type { SearchToken } from "../../../../ui/utils/QueryTokenUtils"
import { ListModel } from "../../../common/misc/ListModel"

assertMainOrNode()

export class SearchResultListEntry {
	constructor(readonly entry: SearchableTypes) {}

	get _id(): IdTuple {
		return this.entry._id
	}
}

export interface CommonSearchListViewAttrs {
	listModel: ListModel<SearchResultListEntry, Id>
	onSingleSelection: (item: SearchResultListEntry) => unknown
	isFreeAccount: boolean
	highlightedStrings: readonly SearchToken[]
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
