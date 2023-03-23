import type { InfoLink, TranslationKey } from "../misc/LanguageViewModel"
import { lang } from "../misc/LanguageViewModel"
import m, { Children, Component, Vnode } from "mithril"
import { ExpanderButton, ExpanderPanel } from "../gui/base/Expander"
import { ifAllowedTutanotaLinks } from "../gui/base/GuiUtils"
import type { lazy, Thunk } from "@tutao/tutanota-utils"
import Stream from "mithril/stream"
import { locator } from "../api/main/MainLocator.js"

export type SettingsExpanderAttrs = {
	title: TranslationKey | lazy<string>
	buttonText?: TranslationKey | lazy<string>
	infoMsg?: TranslationKey | lazy<string>
	infoLinkId?: InfoLink | undefined
	onExpand?: Thunk | undefined
	expanded: Stream<boolean>
}

export class SettingsExpander implements Component<SettingsExpanderAttrs> {
	oncreate(vnode: Vnode<SettingsExpanderAttrs>) {
		vnode.attrs.expanded.map((expanded) => {
			if (expanded && vnode.attrs.onExpand) {
				vnode.attrs.onExpand()
			}
		})
	}

	view(vnode: Vnode<SettingsExpanderAttrs>): Children {
		const { title, buttonText, infoLinkId, infoMsg, expanded } = vnode.attrs
		return [
			m(".flex-space-between.items-center.mb-s.mt-l", [
				m(".h4", lang.getMaybeLazy(title)),
				m(ExpanderButton, {
					label: buttonText || "show_action",
					expanded: expanded(),
					onExpandedChange: expanded,
				}),
			]),
			m(
				ExpanderPanel,
				{
					expanded: expanded(),
				},
				vnode.children,
			),
			infoMsg ? m("small", lang.getMaybeLazy(infoMsg)) : null,
			infoLinkId
				? ifAllowedTutanotaLinks(locator.logins, infoLinkId, (link) => m("small.text-break", [m(`a[href=${link}][target=_blank]`, link)]))
				: null,
		]
	}
}
