import m, { Children, Component, Vnode } from "mithril"

export type ListColumnAttrs = {
	headerContent: Children
}

export class ListColumnWrapper implements Component<ListColumnAttrs> {
	view(vnode: Vnode<ListColumnAttrs>): Children {
		return m(".flex.flex-column.fill-absolute", [
			vnode.attrs.headerContent ? m(".flex.flex-column.justify-center.plr-safe-inset", vnode.attrs.headerContent) : null,
			m(".rel.flex-grow", vnode.children),
		])
	}
}
