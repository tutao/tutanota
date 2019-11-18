// @flow
import m from "mithril"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonN, isVisible} from "./ButtonN"

export type DialogHeaderBarAttrs = {|
	left?: Array<ButtonAttrs>,
	right?: Array<ButtonAttrs>,
	middle?: lazy<string>
|}

/**
 * An action bar is a bar that contains buttons (either on the left or on the right).
 */
class _DialogHeaderBar {

	view(vnode: Vnode<LifecycleAttrs<DialogHeaderBarAttrs>>): VirtualElement {
		const a = Object.assign({}, {left: [], right: []}, vnode.attrs)
		let columnClass = a.middle ? ".flex-third.overflow-hidden" : ".flex-half.overflow-hidden"
		return m(".flex-space-between.dialog-header-line-height", [
			m(columnClass + ".ml-negative-s", a.left.map(a => isVisible(a) ? m(ButtonN, a) : null)),
			// ellipsis is not working if the text is directly in the flex element, so create a child div for it
			a.middle ? m(".flex-third-middle.overflow-hidden.flex.justify-center.items-center.b", [m(".text-ellipsis", a.middle())]) : null,
			m(columnClass + ".mr-negative-s.flex.justify-end", a.right.map(a => isVisible(a) ? m(ButtonN, a) : null))
		])
	}
}

export const DialogHeaderBar: Class<MComponent<DialogHeaderBarAttrs>> = _DialogHeaderBar