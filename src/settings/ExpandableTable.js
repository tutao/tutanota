//@flow

import m from "mithril"
import stream from "mithril/stream/stream.js"
import type {TranslationKey} from "../misc/LanguageViewModel"
import type {TableAttrs} from "../gui/base/TableN"
import {TableN} from "../gui/base/TableN"
import {SettingsExpander} from "./SettingsExpander"

type ExpandableTableAttrs = {|
	title: TranslationKey | lazy<string>,
	table: TableAttrs,
	infoMsg: TranslationKey | lazy<string>,
	infoLinkId?: string,
	// ExpandableTable uses internal state whenever this isn't passed in
	expanded?: Stream<boolean>,
	onExpand?: () => void,
|}

export class ExpandableTable implements MComponent<ExpandableTableAttrs> {
	expanded: Stream<boolean>

	constructor() {
		this.expanded = stream(false)
	}

	view(vnode: Vnode<ExpandableTableAttrs>): Children {
		const {title, table, infoLinkId, infoMsg, expanded, onExpand} = vnode.attrs

		return m(SettingsExpander, {
			title,
			infoLinkId,
			infoMsg,
			onExpand,
			expanded: expanded || this.expanded
		}, m(TableN, table))
	}
}
