import type { InfoLink, TranslationKey, MaybeTranslation } from "../misc/LanguageViewModel.js"
import { lang } from "../misc/LanguageViewModel.js"
import m, { Children, Component, Vnode } from "mithril"
import { ExpanderButton, ExpanderPanel } from "../gui/base/Expander.js"
import { ifAllowedTutaLinks } from "../gui/base/GuiUtils.js"
import type { lazy, Thunk } from "@tutao/tutanota-utils"
import Stream from "mithril/stream"
import { locator } from "../api/main/CommonLocator.js"

export type SettingsExpanderAttrs = {
	title: MaybeTranslation
	buttonText?: MaybeTranslation
	infoMsg?: MaybeTranslation
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
			m(".flex-space-between.items-center.mb-8.mt-32", [
				m(".h4", lang.getTranslationText(title)),
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
			infoMsg ? m("small", lang.getTranslationText(infoMsg)) : null,
			infoLinkId ? ifAllowedTutaLinks(locator.logins, infoLinkId, (link) => m("small.text-break", [m(`a[href=${link}][target=_blank]`, link)])) : null,
		]
	}
}
