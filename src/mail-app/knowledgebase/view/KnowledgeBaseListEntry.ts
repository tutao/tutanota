import m, { Children, Component, Vnode } from "mithril"
import type { KnowledgeBaseEntry } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { px } from "../../../common/gui/size.js"

export type KnowledgebaseListEntryAttrs = {
	entry: KnowledgeBaseEntry
}
export const KNOWLEDGEBASE_LIST_ENTRY_HEIGHT = 50

/**
 *  Renders one list entry of the knowledgeBase
 */
export class KnowledgeBaseListEntry implements Component<KnowledgebaseListEntryAttrs> {
	view(vnode: Vnode<KnowledgebaseListEntryAttrs>): Children {
		const { title, keywords } = vnode.attrs.entry
		return m(
			".flex.flex-column.overflow-hidden.full-width",
			{
				style: {
					height: px(KNOWLEDGEBASE_LIST_ENTRY_HEIGHT),
				},
			},
			[
				m(".text-ellipsis.mb-4.b", title),
				m(".flex.badge-line-height.text-ellipsis", [
					keywords.map((keyword) => {
						return m("small.teamLabel.pl-4.pr-4.border-radius.no-wrap.small.mr-8.min-content", keyword.keyword)
					}),
				]),
			],
		)
	}
}
