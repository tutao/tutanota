import m, { Children, Component, Vnode } from "mithril"

export type ListColumnAttrs = {
	headerContent: Children
}

export class ListColumnWrapper implements Component<ListColumnAttrs> {
	view(vnode: Vnode<ListColumnAttrs>): Children {
		return m(".flex.flex-column.fill-absolute", [
			m(".flex.flex-column.justify-center.list-border-right.list-bg.list-border-bottom.plr-safe-inset", vnode.attrs.headerContent),
			m(".rel.flex-grow", vnode.children),
		])
	}
}
