import { pureComponent } from "./base/PureComponent.js"
import m from "mithril"

/** A layout that is used instead of bottom navigation in some situations. */
export const MobileBottomActionBar = pureComponent((_, children) => {
	return m(".bottom-nav.flex.items-center.plr-l.justify-between", children)
})
