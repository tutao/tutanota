import m, { Children, Component, Vnode } from "mithril"
import stream from "mithril/stream"
import type { InfoLink, TranslationKey } from "../misc/LanguageViewModel.js"
import type { TableAttrs } from "../gui/base/Table.js"
import { Table } from "../gui/base/Table.js"
import { SettingsExpander } from "./SettingsExpander.js"
import type { lazy } from "@tutao/tutanota-utils"
import Stream from "mithril/stream"

type ExpandableTableAttrs = {
	title: TranslationKey | lazy<string>
	table: TableAttrs
	infoMsg: TranslationKey | lazy<string>
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
