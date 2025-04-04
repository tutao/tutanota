import m, { Children, Component, Vnode } from "mithril"

type BadgeAttrs = {
	classes?: string
}
export default class Badge implements Component<BadgeAttrs> {
	view(vnode: Vnode<BadgeAttrs>): Children {
		return m(".teamLabel.pl-s.pr-s.border-radius.no-wrap" + (vnode.attrs.classes || ""), vnode.children)
	}
}
