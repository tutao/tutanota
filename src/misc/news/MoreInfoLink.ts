import { InfoLink, lang } from "../LanguageViewModel.js"
import m, { Children, Component, Vnode } from "mithril"

export type MoreInfoLinkAttrs = {
	link: InfoLink
}

/**
 * This component shows a "More info" message with a link to a given destination.
 */
export class MoreInfoLink implements Component<MoreInfoLinkAttrs> {
	view(vnode: Vnode<MoreInfoLinkAttrs>): Children {
		return m(
			"p",
			lang.get("moreInfo_msg") + " ",
			m("small.text-break", [
				m(
					"a",
					{
						href: vnode.attrs.link,
						target: "_blank",
					},
					vnode.attrs.link,
				),
			]),
		)
	}
}
