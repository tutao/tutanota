import m, { Children, Component, Vnode } from "mithril"
import { Keys, TabIndex } from "../../api/common/TutanotaConstants.js"
import { isKeyPressed } from "../../misc/KeyManager.js"

export type relDocument = "privacy-policy" | "terms-of-service" | "license" | "me"

export interface ExternalLinkAttrs {
	href: string
	text?: string
	// The href links to a website controlled by Tutao GmbH
	isCompanySite: boolean
	class?: string
	specialType?: relDocument
}

export class ExternalLink implements Component<ExternalLinkAttrs> {
	view({ attrs }: Vnode<ExternalLinkAttrs>): Children {
		return m(
			"a.underline",
			{
				href: attrs.href,
				target: "_blank",
				class: attrs.class,
				rel: `external noreferrer ${attrs.isCompanySite ? "" : "nofollow"} ${attrs.specialType ?? ""}`,
				// Allow keyboard usage in modals etc.
				tabindex: TabIndex.Default,
				onkeydown: (e: KeyboardEvent) => {
					if (isKeyPressed(e.key, Keys.RETURN)) {
						e.stopPropagation()
					}
				},
			},
			attrs.text ?? attrs.href,
		)
	}
}
