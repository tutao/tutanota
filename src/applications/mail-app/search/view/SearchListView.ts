import { assertMainOrNode } from "@tutao/app-env"
import type { SearchToken } from "../../../../ui/utils/QueryTokenUtils"
import { ListModel } from "../../../common/misc/ListModel"
import { SearchableTypes } from "../../../common/search/SearchUtils"

assertMainOrNode()

export class SearchResultListEntry {
	constructor(readonly entry: SearchableTypes) {}

	get _id(): IdTuple {
		return this.entry._id
	}
}

export interface CommonSearchListViewAttrs<T> {
	listModel: ListModel<T, Id>
	onSingleSelection: (item: T) => unknown
	isFreeAccount: boolean
	highlightedStrings: readonly SearchToken[]
}
