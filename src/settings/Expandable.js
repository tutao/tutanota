// @flow
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import m from "mithril"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"
import stream from "mithril/stream/stream.js"


export type ExpandableAttrs = {|
	title: TranslationKey | lazy<string>,
	children: Children,
	infoMsg: TranslationKey | lazy<string>,
	infoLinkId?: string,
	onExpand?: () => void
|}

export class Expandable implements MComponent<ExpandableAttrs> {
	_expanded: Stream<boolean>

	constructor() {
		this._expanded = stream(false)
	}

	oncreate(vnode: VnodeDOM<ExpandableAttrs>) {
		this._expanded.map(expanded => {
			if (expanded) {
				if (vnode.attrs.onExpand) {
					vnode.attrs.onExpand()
				}
			}
		})
	}

	view(vnode: Vnode<ExpandableAttrs>): Children {
		const {title, children, infoLinkId, infoMsg} = vnode.attrs
		return [
			m(".flex-space-between.items-center.mb-s.mt-l", [
				m(".h4", lang.getMaybeLazy(title)),
				m(ExpanderButtonN, {label: "show_action", expanded: this._expanded})
			]),
			m(ExpanderPanelN, {expanded: this._expanded}, children),
			m("small", lang.getMaybeLazy(infoMsg)),
			infoLinkId ? m("small.text-break", [m(`a[href=${lang.getInfoLink(infoLinkId)}][target=_blank]`, lang.getInfoLink(infoLinkId))]) : null
		];
	}
}
