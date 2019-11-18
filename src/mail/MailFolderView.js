//@flow

import type {NavButtonAttrs} from "../gui/base/NavButtonN"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import m from "mithril"
import {isNavButtonSelected, NavButtonN} from "../gui/base/NavButtonN"
import {ButtonN} from "../gui/base/ButtonN"
import {animations, opacity} from "../gui/animation/Animations"

export type Attrs = {count: number, button: NavButtonAttrs, rightButton: ?ButtonAttrs}

export class MailFolderView implements MComponent<Attrs> {
	_hovered: boolean = false;

	view(vnode: Vnode<Attrs>): ?Children {
		const {count, button, rightButton} = vnode.attrs

		return m(".folder-row.plr-l.flex.flex-row" + (isNavButtonSelected(button) ? ".row-selected" : ""), {}, [
			count > 0
				?
				m(".folder-counter.z2", {
					onmouseenter: () => {
						this._hovered = true
					},
					onmouseleave: () => {
						this._hovered = false
					}
				}, count < 99 || this._hovered ? count : "99+")
				: null,
			m(NavButtonN, button),
			rightButton
				? m(ButtonN, Object.assign({}, rightButton, {
					oncreate: vnode => {
						vnode.dom.style.opacity = 0
						return animations.add(vnode.dom, opacity(0, 1, true))
					},
					onbeforeremove: vnode => {
						vnode.dom.style.opacity = 1
						return animations.add(vnode.dom, opacity(1, 0, true))
					}
				}))
				: null
		])
	}
}
