// @flow

import m from "mithril"
import type {DialogHeaderBarAttrs} from "./DialogHeaderBar"
import {DialogHeaderBar} from "./DialogHeaderBar"
import {px} from "../size"
import {resolveMaybeLazy} from "../../api/common/utils/Utils"
import type {MaybeLazy} from "../../api/common/utils/Utils"

export type DialogInjectionRightAttrs<T> = {
	visible: Stream<boolean>,
	headerAttrs: MaybeLazy<DialogHeaderBarAttrs>,
	component: Class<MComponent<$Attrs<T>>>,
	componentAttrs: T
}

export class DialogInjectionRight<T> implements MComponent<DialogInjectionRightAttrs<T>> {
	view(vnode: Vnode<DialogInjectionRightAttrs<T>>): Children {
		const {attrs} = vnode
		if (attrs.visible()) {
			return m(".flex-grow-shrink-auto.flex-transition.ml-s.rel.dialog.dialog-width-m.elevated-bg.dropdown-shadow", [
				m(".dialog-header.plr-l", m(DialogHeaderBar, resolveMaybeLazy(attrs.headerAttrs))),
				m(".dialog-container.scroll.plr-l", m(attrs.component, attrs.componentAttrs))
			])
		} else {
			return m(".flex-hide.flex-transition.rel", {
				style: {
					maxWidth: px(0)
				}
			})
		}
	}
}
