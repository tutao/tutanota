import { InfoLink, lang, TranslationKey } from "../LanguageViewModel.js"
import m, { Children, Component, Vnode } from "mithril"
import { ExternalLink, relDocument } from "../../gui/base/ExternalLink.js"
import { Icon, IconSize } from "../../gui/base/Icon"
import { Icons } from "../../gui/base/icons/Icons"
import { theme } from "../../gui/theme"

export type MoreInfoLinkAttrs = {
	link: InfoLink
	isSmall?: boolean
	class?: string
}

/**
 * This component shows a "More info" message with a link to a given destination.
 */
export class MoreInfoLink implements Component<MoreInfoLinkAttrs> {
	view(vnode: Vnode<MoreInfoLinkAttrs>): Children {
		let specialType: relDocument | undefined
		switch (vnode.attrs.link) {
			case InfoLink.HomePage:
				specialType = "me"
				break
			case InfoLink.About:
				specialType = "license"
				break
			case InfoLink.Privacy:
				specialType = "privacy-policy"
				break
			case InfoLink.Terms:
			case InfoLink.GiftCardsTerms:
				specialType = "terms-of-service"
				break
			default:
				specialType = undefined
				break
		}
		return m(
			"p",
			{
				class: `${vnode.attrs.class} ${vnode.attrs.isSmall ? "small" : ""}`,
			},
			lang.get("moreInfo_msg") + " ",
			m(
				"span.text-break",
				{
					class: vnode.attrs.isSmall ? "small" : "",
				},
				[
					m(ExternalLink, {
						href: vnode.attrs.link,
						isCompanySite: true,
						specialType,
					}),
				],
			),
		)
	}
}

// Function for rendering the more info link in a new style
export function renderMoreInfoLink(link: InfoLink, message: TranslationKey) {
	return [
		m(".flex", { style: { "text-align": "justify", "align-content": "center" } }, [
			m(ExternalLink, {
				text: lang.getTranslation(message).text,
				href: link,
				isCompanySite: true,
			}),
			m(Icon, {
				icon: Icons.OpenOutline,
				size: IconSize.PX24,
				style: {
					fill: theme.on_surface,
				},
			}),
		]),
	]
}
