// @flow
import m from "mithril"

type BadgeAttrs = {
	classes?: string
}

export default class Badge implements MComponent<BadgeAttrs> {
	view(vnode: Vnode<BadgeAttrs>): Children {
		return m(".b.teamLabel.pl-s.pr-s.border-radius.no-wrap" + (vnode.attrs.classes || ''), vnode.children)
	}
}