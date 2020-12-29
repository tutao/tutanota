// @flow
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"
import m from "mithril"
import {ExpanderButtonN, ExpanderPanelN} from "../gui/base/Expander"


export type SettingsExpanderAttrs = {|
	title: TranslationKey | lazy<string>,
	buttonText?: TranslationKey | lazy<string>,
	infoMsg?: TranslationKey | lazy<string>,
	infoLinkId?: string,
	onExpand?: () => void,
	expanded: Stream<boolean>
|}

export class SettingsExpander implements MComponent<SettingsExpanderAttrs> {

	oncreate(vnode: Vnode<SettingsExpanderAttrs>) {
		vnode.attrs.expanded.map(expanded => {
			if (expanded && vnode.attrs.onExpand) {
				vnode.attrs.onExpand()
			}
		})
	}

	view(vnode: Vnode<SettingsExpanderAttrs>): Children {
		const {title, buttonText, infoLinkId, infoMsg, expanded} = vnode.attrs
		return [
			m(".flex-space-between.items-center.mb-s.mt-l", [
				m(".h4", lang.getMaybeLazy(title)),
				m(ExpanderButtonN, {label: buttonText || "show_action", expanded})
			]),
			m(ExpanderPanelN, {expanded}, vnode.children),
			infoMsg ? m("small", lang.getMaybeLazy(infoMsg)) : null,
			infoLinkId ? m("small.text-break", [m(`a[href=${lang.getInfoLink(infoLinkId)}][target=_blank]`, lang.getInfoLink(infoLinkId))]) : null
		];
	}
}
