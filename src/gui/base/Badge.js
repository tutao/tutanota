// @flow
import m from "mithril"

type BadgeAttrs = {
	classes?: string
}

export default class Badge implements MComponent<BadgeAttrs> {
	view(vnode: Vnode<BadgeAttrs>) {
		return m(".b.teamLabel.pl-s.pr-s.border-radius" + (vnode.attrs.classes || ''), vnode.children)
	}
}