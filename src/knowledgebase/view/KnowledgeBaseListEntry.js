// @flow
import m from "mithril"
import type {KnowledgeBaseEntry} from "../../api/entities/tutanota/KnowledgeBaseEntry"
import {px} from "../../gui/size"

export type KnowledgebaseListEntryAttrs = {
	entry: KnowledgeBaseEntry
}

export const KNOWLEDGEBASE_LIST_ENTRY_HEIGHT = 50

/**
 *  Renders one list entry of the knowledgeBase
 */

export class KnowledgeBaseListEntry implements MComponent<KnowledgebaseListEntryAttrs> {
	view(vnode: Vnode<KnowledgebaseListEntryAttrs>): Children {
		const {title, keywords} = vnode.attrs.entry
		return m(".flex.flex-column.overflow-hidden.full-width", {
			style: {
				height: px(KNOWLEDGEBASE_LIST_ENTRY_HEIGHT),
			}
		}, [
			m(".text-ellipsis.mb-xs.b", title),
			m(".flex.badge-line-height.text-ellipsis", [
				keywords.map(keyword => {
					return m(".b.small.teamLabel.pl-s.pr-s.border-radius.no-wrap.small.mr-s.min-content", keyword.keyword)
				})
			])
		])
	}
}