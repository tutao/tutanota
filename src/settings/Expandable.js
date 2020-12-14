// @flow
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import m from "mithril"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/ExpanderN"


export type ExpandableAttrs = {|
	title: TranslationKey | lazy<string>,
	children: Children,
	infoMsg: TranslationKey | lazy<string>,
	infoLinkId?: string,
	onExpand?: () => void,
	expanded: Stream<boolean>
|}

export class Expandable implements MComponent<ExpandableAttrs> {

	oncreate(vnode: Vnode<ExpandableAttrs>) {
		vnode.attrs.expanded.map(expanded => {
			if (expanded && vnode.attrs.onExpand) {
				vnode.attrs.onExpand()
			}
		})
	}

	view(vnode: Vnode<ExpandableAttrs>): Children {
		const {title, children, infoLinkId, infoMsg, expanded} = vnode.attrs
		return [
			m(".flex-space-between.items-center.mb-s.mt-l", [
				m(".h4", lang.getMaybeLazy(title)),
				m(ExpanderButtonN, {label: "show_action", expanded})
			]),
			m(ExpanderPanelN, {expanded}, children),
			m("small", lang.getMaybeLazy(infoMsg)),
			infoLinkId ? m("small.text-break", [m(`a[href=${lang.getInfoLink(infoLinkId)}][target=_blank]`, lang.getInfoLink(infoLinkId))]) : null
		];
	}
}
