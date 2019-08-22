// @flow
import m from "mithril"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {animations, height, opacity, transform} from "../../../src/gui/animation/Animations"
import {Icon} from "./Icon"
import {Icons} from "./icons/Icons"
import {BootIcons} from "./icons/BootIcons"
import {theme} from "../theme"
import {addFlash, removeFlash} from "./Flash"
import {px} from "../size"

export class ExpanderButton {
	panel: ExpanderPanel;
	getLabel: lazy<string>;
	_domIcon: ?HTMLElement;
	view: Function;
	_showWarning: boolean;

	constructor(labelTextIdOrLabelFunction: TranslationKey | lazy<string>, panel: ExpanderPanel, showWarning: boolean, style: Object = {}, color: () => string = () => theme.content_button) {
		this.panel = panel
		this.getLabel = typeof labelTextIdOrLabelFunction === "function"
			? labelTextIdOrLabelFunction
			: lang.get.bind(lang, labelTextIdOrLabelFunction)
		this._showWarning = showWarning

		this.view = (): VirtualElement => {
			style.color = color()
			return m(".flex.limit-width",
				[ // .limit-width does not work without .flex in IE11
					m("button.expander.bg-transparent.pt-s.hover-ul.limit-width", {

						style,
						onclick: (event: MouseEvent) => {
							this.toggle()
							event.stopPropagation()
						},
						oncreate: vnode => addFlash(vnode.dom),
						onremove: (vnode) => removeFlash(vnode.dom),
						// Must be "true" or "false" strings, mere presence of attribute doesn't signify anything
						"aria-expanded": String(!!this.panel.expanded),
					}, m(".flex.items-center", [ // TODO remove wrapper after Firefox 52 has been deployed widely https://bugzilla.mozilla.org/show_bug.cgi?id=984869
						(this._showWarning) ? m(Icon, {
							icon: Icons.Warning,
							style: {fill: color()}
						}) : null,
						m("small.b.text-ellipsis", this.getLabel().toUpperCase()),
						m(Icon, {
							icon: BootIcons.Expand,
							class: "flex-center items-center",
							style: {
								fill: color(),
								'margin-right': px(-4) // icon is has 4px whitespace to the right
							},
							oncreate: vnode => {
								this._domIcon = vnode.dom
								if (this.panel.expanded) this._domIcon.style.transform = 'rotateZ(180deg)'
							},
						}),
					])),
				])
		}
	}

	toggle() {
		if (this._domIcon) {
			let start = this.panel.expanded ? 180 : 0
			animations.add(this._domIcon, transform('rotateZ', start, start + 180))
		}
		this.panel.setExpanded(!this.panel.expanded)
	}

	setShowWarning(showWarning: boolean): void {
		this._showWarning = showWarning
	}

}

export class ExpanderPanel {
	child: Component;
	expanded: boolean;
	_domPanel: HTMLElement;

	view: Function;

	constructor(child: Component) {
		this.child = child
		this.expanded = false
		this.view = (): VirtualElement => m(".expander-panel.overflow-hidden.no-shrink", [
			this.expanded
				? m("div", {
					oncreate: vnode => {
						this._domPanel = vnode.dom
						vnode.dom.style.height = 0
						this._animate(true)
					},
					onbeforeremove: vnode => this._animate(false),
				}, m(this.child))
				: null
		])
	}

	_animate(fadeIn: boolean): Promise<void> {
		animations.add(this._domPanel, fadeIn ? opacity(0, 1, true) : opacity(1, 0, true))
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

	setExpanded(expanded: boolean): ExpanderPanel {
		this.expanded = expanded
		let c = (this.child: any)
		if (c['setExpanded']) {
			c['setExpanded'](expanded)
		}
		return this
	}
}
