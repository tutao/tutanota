import m, { Children, Component, Vnode } from "mithril"
import type { DialogHeaderBarAttrs } from "./DialogHeaderBar"
import { DialogHeaderBar } from "./DialogHeaderBar"
import { px } from "../size"
import type { MaybeLazy } from "@tutao/tutanota-utils"
import { resolveMaybeLazy } from "@tutao/tutanota-utils"
import Stream from "mithril/stream"

export type DialogInjectionRightAttrs<T extends {}> = {
	visible: Stream<boolean>
	headerAttrs: MaybeLazy<DialogHeaderBarAttrs>
	component: Class<Component<T>>
	componentAttrs: T
}

/**
 * injects additional content on the right of a dialog
 */
export class DialogInjectionRight<T extends {}> implements Component<DialogInjectionRightAttrs<T>> {
	view({ attrs }: Vnode<DialogInjectionRightAttrs<T>>): Children {
		const { component, componentAttrs } = attrs

		if (attrs.visible()) {
			return m(".flex-grow-shrink-auto.flex-transition.ml-s.rel.dialog.dialog-width-m.elevated-bg.dropdown-shadow.border-radius", [
				m(DialogHeaderBar, resolveMaybeLazy(attrs.headerAttrs)),
				m(".dialog-container.scroll.plr-l", m(component, componentAttrs)),
			])
		} else {
			return m(".flex-hide.flex-transition.rel", {
				style: {
					maxWidth: px(0),
				},
			})
		}
	}
}
