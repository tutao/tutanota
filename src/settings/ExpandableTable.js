//@flow


import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import type {TableAttrs} from "../gui/base/TableN"
import {TableN} from "../gui/base/TableN"
import m from "mithril"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"
import stream from "mithril/stream/stream.js"


type ExpandableTableAttrs = {
	title: TranslationKey | lazy<string>,
	table: TableAttrs,
	infoMsg: TranslationKey | lazy<string>,
	infoLinkId?: string,
	onExpand?: () => void
}

export class ExpandableTable implements MComponent<ExpandableTableAttrs> {
	_expanded: Stream<boolean>

	constructor() {
		this._expanded = stream(false)
	}

	oncreate(vnode: VnodeDOM<ExpandableTableAttrs>) {
		this._expanded.map(expanded => {
			if (expanded) {
				if (vnode.attrs.onExpand) {
					vnode.attrs.onExpand()
				}
			}
		})
	}

	view(vnode: Vnode<ExpandableTableAttrs>): Children {
		const {title, table, infoLinkId, infoMsg} = vnode.attrs
		return [
			m(".flex-space-between.items-center.mb-s.mt-l", [
				m(".h4", lang.getMaybeLazy(title)),
				m(ExpanderButtonN, {label: "show_action", expanded: this._expanded})
			]),
			m(ExpanderPanelN, {expanded: this._expanded}, m(TableN, table)),
			m("small", lang.getMaybeLazy(infoMsg)),
			infoLinkId ? m("small.text-break", [m(`a[href=${lang.getInfoLink(infoLinkId)}][target=_blank]`, lang.getInfoLink(infoLinkId))]) : null
		];
	}
}
