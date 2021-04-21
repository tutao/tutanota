// @flow
import m from "mithril"
import type {ButtonAttrs} from "./ButtonN"
import {ButtonN, isVisible} from "./ButtonN"
import type {MaybeLazy} from "../../api/common/utils/Utils"
import {resolveMaybeLazy} from "../../api/common/utils/Utils"


export type DialogHeaderBarAttrs = {|
	left?: MaybeLazy<Array<ButtonAttrs>>,
	right?: MaybeLazy<Array<ButtonAttrs>>,
	middle?: lazy<string>,
	create?: () => void,
	remove?: () => void,
|}

/**
 * An action bar is a bar that contains buttons (either on the left or on the right).
 */
export class DialogHeaderBar implements MComponent<DialogHeaderBarAttrs> {

	view(vnode: Vnode<LifecycleAttrs<DialogHeaderBarAttrs>>): VirtualElement {
		const a = Object.assign({}, {left: [], right: []}, vnode.attrs)
		let columnClass = a.middle ? ".flex-third.overflow-hidden" : ".flex-half.overflow-hidden"
		return m(".flex-space-between.dialog-header-line-height", {
			oncreate: () => { if (a.create) a.create() },
			onremove: () => { if (a.remove) a.remove() },
		}, [
			m(columnClass + ".ml-negative-s", resolveMaybeLazy(a.left).map(a => isVisible(a) ? m(ButtonN, a) : null)),
			// ellipsis is not working if the text is directly in the flex element, so create a child div for it
			a.middle ? m("#dialog-title.flex-third-middle.overflow-hidden.flex.justify-center.items-center.b", [m(".text-ellipsis", a.middle())]) : null,
			m(columnClass + ".mr-negative-s.flex.justify-end", resolveMaybeLazy(a.right).map(a => isVisible(a) ? m(ButtonN, a) : null))
		])
	}
}