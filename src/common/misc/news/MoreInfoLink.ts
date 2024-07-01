import { InfoLink, lang } from "../LanguageViewModel.js"
import m, { Children, Component, Vnode } from "mithril"
import { ExternalLink, relDocument } from "../../gui/base/ExternalLink.js"

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
