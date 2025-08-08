import m, { Children, Component, Vnode } from "mithril"

export type ListColumnAttrs = {
	headerContent: Children
	class?: string
}

export class ListColumnWrapper implements Component<ListColumnAttrs> {
	view({ attrs, children }: Vnode<ListColumnAttrs>): Children {
		return m(".flex.flex-column.fill-absolute", { class: attrs.class }, [
			attrs.headerContent ? m(".flex.flex-column.justify-center.plr-safe-inset", attrs.headerContent) : null,
			m(".rel.flex-grow", children),
		])
	}
}
