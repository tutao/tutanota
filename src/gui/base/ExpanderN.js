// @flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {lang} from "../../misc/LanguageViewModel"
import {animations, transform, height, opacity} from "../../../src/gui/animation/Animations"
import {addFlash, removeFlash} from "./Flash"
import {Icon} from "./Icon"
import {Icons} from "./icons/Icons"
import {BootIcons} from "./icons/BootIcons"
import {theme} from "../theme"
import {neverNull} from "../../api/common/utils/Utils"

export type ExpanderAttrs ={
	label: string|lazy<string>,
	expanded: stream<boolean>,
	showWarning?: boolean,
	style?: Object,
	color?: string
}

export type ExpanderPanelAttrs = {
	expanded: stream<boolean>,
	class?: string,
}

class _ExpanderButton {
	_domIcon: ?HTMLElement;

	view(vnode: Vnode<ExpanderAttrs>) {
		const a = vnode.attrs
		return m(".pr-expander.flex.limit-width", [ // .limit-width does not work without .flex in IE11
			m("button.expander.bg-transparent.pt-s.hover-ul.limit-width", {
				style: a.style,
				onclick: (event: MouseEvent) => {
					this.toggle(a.expanded)
					event.stopPropagation()
				},
				oncreate: vnode => addFlash(vnode.dom),
				onbeforeremove: (vnode) => removeFlash(vnode.dom),
			}, m(".flex.items-center", [ // TODO remove wrapper after Firefox 52 has been deployed widely https://bugzilla.mozilla.org/show_bug.cgi?id=984869
				(a.showWarning) ? m(Icon, {
						icon: Icons.Warning,
						style: {fill: a.color ? a.color : theme.content_button}
					}) : null,
				m("small.b.text-ellipsis", (a.label instanceof Function ? a.label() : lang.get(a.label)).toUpperCase()),
				m(Icon, {
					icon: BootIcons.Expand,
					class: "flex-center items-center",
					style: {fill: a.color ? a.color : theme.content_button},
					oncreate: vnode => {
						this._domIcon = vnode.dom
						if (!a.expanded()) vnode.dom.style.transform = 'rotateZ(180deg)'
					},
				}),
			])),
		])
	}

	toggle(expanded: stream<boolean>) {
		if (this._domIcon) {
			let start = expanded() ? 0 : 180
			animations.add(neverNull(this._domIcon), transform('rotateZ', start, start + 180))
		}
		expanded(!expanded())
	}

}

class _ExpanderPanel {
	_domPanel: HTMLElement;

	view(vnode: Vnode<ExpanderPanelAttrs>) {
		return m(".expander-panel.overflow-hidden", [
			vnode.attrs.expanded() ? m("div", {
					oncreate: vnode => {
						this._domPanel = vnode.dom
						vnode.dom.style.height = 0
						this._animate(true)
					},
					onbeforeremove: vnode => this._animate(false),
					class: vnode.attrs.class
				}, vnode.children) : null
		])
	}

	_animate(fadeIn: boolean) {
		animations.add(this._domPanel, fadeIn ? opacity(0, 1, false) : opacity(1, 0, false))
		let childHeight = Array.from(this._domPanel.children)
			.map((domElement: HTMLElement) => domElement.offsetHeight)
			.reduce((current: number, previous: number) => current + previous, 0)
		return animations.add(this._domPanel, height(fadeIn ? 0 : childHeight, fadeIn ? childHeight : 0))
			.then(() => {
				if (fadeIn) {
					this._domPanel.style.height = ''
				}
			})
	}
}

export const ExpanderButtonN: Class<MComponent<ExpanderAttrs>> = _ExpanderButton
export const ExpanderPanelN: Class<MComponent<ExpanderPanelAttrs>> = _ExpanderPanel