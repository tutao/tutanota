// @flow
import m from "mithril"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {animations, height, opacity, transform} from "../../../src/gui/animation/Animations"
import {addFlash, removeFlash} from "./Flash"
import {Icon} from "./Icon"
import {Icons} from "./icons/Icons"
import {BootIcons} from "./icons/BootIcons"
import {theme} from "../theme"
import {neverNull} from "../../api/common/utils/Utils"
import {px} from "../size"

export type ExpanderAttrs = {
	label: TranslationKey | lazy<string>,
	expanded: Stream<boolean>,
	showWarning?: boolean,
	style?: Object,
	color?: string
}

export type ExpanderPanelAttrs = {
	expanded: Stream<boolean>,
	class?: string,
}

export class ExpanderButtonN implements MComponent<ExpanderAttrs> {
	_domIcon: ?HTMLElement;

	view(vnode: Vnode<ExpanderAttrs>): Children {
		const a = vnode.attrs
		return m(".flex.limit-width", [ // .limit-width does not work without .flex in IE11
			m("button.expander.bg-transparent.pt-s.hover-ul.limit-width.mr-s", {
				style: a.style,
				onclick: (event: MouseEvent) => {
					this.toggle(a.expanded)
					event.stopPropagation()
				},
				oncreate: vnode => addFlash(vnode.dom),
				onremove: (vnode) => removeFlash(vnode.dom),
				"aria-expanded": String(!!a.expanded()),
			}, m(".flex.items-center", [ // TODO remove wrapper after Firefox 52 has been deployed widely https://bugzilla.mozilla.org/show_bug.cgi?id=984869
				(a.showWarning) ? m(Icon, {
					icon: Icons.Warning,
					style: {fill: a.color ? a.color : theme.content_button}
				}) : null,
				m("small.b.text-ellipsis", lang.getMaybeLazy(a.label).toUpperCase()),
				m(Icon, {
					icon: BootIcons.Expand,
					class: "flex-center items-center",
					style: {
						fill: a.color ? a.color : theme.content_button,
						'margin-right': px(-4) // icon is has 4px whitespace to the right
					},
					oncreate: vnode => {
						this._domIcon = vnode.dom
						if (a.expanded()) vnode.dom.style.transform = 'rotateZ(180deg)'
					},
				}),
			])),
		])
	}

	toggle(expanded: Stream<boolean>) {
		if (this._domIcon) {
			let start = expanded() ? 180 : 0
			animations.add(neverNull(this._domIcon), transform('rotateZ', start, start + 180))
		}
		expanded(!expanded())
	}

}

export class ExpanderPanelN implements MComponent<ExpanderPanelAttrs> {
	_domPanel: HTMLElement;

	view(vnode: Vnode<ExpanderPanelAttrs>): Children {
		return m(".expander-panel.overflow-hidden", [
			vnode.attrs.expanded()
				? m("div", {
					oncreate: vnode => {
						this._domPanel = vnode.dom
						vnode.dom.style.height = 0
						this._animate(true)
					},
					onbeforeremove: vnode => this._animate(false),
					class: vnode.attrs.class
				}, vnode.children)
				: null
		])
	}

	_animate(fadeIn: boolean): Promise<void> {
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

