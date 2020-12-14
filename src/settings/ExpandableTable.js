//@flow


import type {TranslationKey} from "../misc/LanguageViewModel"
import type {TableAttrs} from "../gui/base/TableN"
import {TableN} from "../gui/base/TableN"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Expandable} from "./Expandable"


type ExpandableTableAttrs = {|
	title: TranslationKey | lazy<string>,
	table: TableAttrs,
	infoMsg: TranslationKey | lazy<string>,
	infoLinkId?: string,
	onExpand?: () => void,
|}

export class ExpandableTable implements MComponent<ExpandableTableAttrs> {
	expanded: Stream<boolean>

	constructor() {
		this.expanded = stream(false)
	}

	view(vnode: Vnode<ExpandableTableAttrs>): Children {
		const {title, table, infoLinkId, infoMsg, onExpand} = vnode.attrs
		return m(Expandable, {
			title,
			children: m(TableN, table),
			infoLinkId,
			infoMsg,
			onExpand,
			expanded: this.expanded
		})
	}
}
