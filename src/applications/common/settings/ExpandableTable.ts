import m, { Children, Component, Vnode } from "mithril"
import stream from "mithril/stream"
import Stream from "mithril/stream"
import type { InfoLink, MaybeTranslation } from "../../../ui/utils/LanguageViewModel.js"
import type { TableAttrs } from "../../../ui/base/Table.js"
import { Table } from "../../../ui/base/Table.js"
import { SettingsExpander } from "./SettingsExpander.js"

type ExpandableTableAttrs = {
	title: MaybeTranslation
	table: TableAttrs
	infoMsg: MaybeTranslation
	infoLinkId?: InfoLink
	// ExpandableTable uses internal state whenever this isn't passed in
	expanded?: Stream<boolean>
	onExpand?: () => void
}

export class ExpandableTable implements Component<ExpandableTableAttrs> {
	expanded: Stream<boolean>

	constructor() {
		this.expanded = stream<boolean>(false)
	}

	view(vnode: Vnode<ExpandableTableAttrs>): Children {
		const { title, table, infoLinkId, infoMsg, expanded, onExpand } = vnode.attrs
		return m(
			SettingsExpander,
			{
				title,
				infoLinkId,
				infoMsg,
				onExpand,
				expanded: expanded || this.expanded,
			},
			m(Table, table),
		)
	}
}
