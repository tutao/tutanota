// @flow
import m from "mithril"
import {assertMainOrNode} from "../../api/common/Env"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonN} from "./ButtonN"

assertMainOrNode()

export type ActionBarAttrs = {
	buttons: ButtonAttrs[]
}

/**
 * An action bar is a bar that contains buttons (either on the left or on the right).
 */
export class ActionBar implements MComponent<ActionBarAttrs> {
	view(vnode: Vnode<ActionBarAttrs>): Children {
		return m(".action-bar.flex-end.items-center",
			vnode.attrs.buttons.filter(b => !b.isVisible || b.isVisible()).map(b => m(ButtonN, b)))
	}
}