// @flow

import m from "mithril"

export type ListColumnAttrs = {
	headerContent: Children
}

export class ListColumnWrapper implements MComponent<ListColumnAttrs> {
	view(vnode: Vnode<ListColumnAttrs>): Children {
		return m(".flex.flex-column.fill-absolute", [
			m(".flex.flex-column.justify-center.plr-l.list-border-right.list-bg.list-header", vnode.attrs.headerContent),
			m(".rel.flex-grow", vnode.children)
		])
	}
}

