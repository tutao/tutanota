// @flow
import m from "mithril"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {addFlash, removeFlash} from "./Flash"
import {Icon} from "./Icon"
import {Icons} from "./icons/Icons"
import {BootIcons} from "./icons/BootIcons"
import {theme} from "../theme"
import {px} from "../size"
import {DefaultAnimationTime} from "../animation/Animations"
import type {lazy} from "../../api/common/utils/Utils"

export type ExpanderAttrs = {
	label: TranslationKey | lazy<string>,
	expanded: Stream<boolean>,
	showWarning?: boolean,
	color?: string,
	style?: Object
}

export type ExpanderPanelAttrs = {
	expanded: Stream<boolean>,
}

export class ExpanderButtonN implements MComponent<ExpanderAttrs> {
	_domIcon: ?HTMLElement;

	view(vnode: Vnode<ExpanderAttrs>): Children {
		const a = vnode.attrs
		return m(".flex.limit-width", [ // .limit-width does not work without .flex in IE11
			m("button.expander.bg-transparent.pt-s.hover-ul.limit-width", {
				style: a.style,
				onclick: (event: MouseEvent) => {
					a.expanded(!a.expanded())
					event.stopPropagation()
				},
				oncreate: vnode => addFlash(vnode.dom),
				onremove: (vnode) => removeFlash(vnode.dom),
				"aria-expanded": String(!!a.expanded()),
			}, m(".flex.items-center", [ // TODO remove wrapper after Firefox 52 has been deployed widely https://bugzilla.mozilla.org/show_bug.cgi?id=984869
				(a.showWarning) ? m(Icon, {
					icon: Icons.Warning,
					style: {
						fill: a.color ? a.color : theme.content_button,
					}
				}) : null,
				m("small.b.text-ellipsis", {style: {color: a.color || theme.content_button}}, lang.getMaybeLazy(a.label).toUpperCase()),
				m(Icon, {
					icon: BootIcons.Expand,
					class: "flex-center items-center",
					style: {
						fill: a.color ? a.color : theme.content_button,
						'margin-right': px(-4), // icon is has 4px whitespace to the right,
						transform: `rotateZ(${a.expanded() ? 180 : 0}deg)`,
						transition: `transform ${DefaultAnimationTime}ms`
					},
				}),
			])),
		])
	}
}

/**
 * Panel which shows or hides content depending on the attrs.expanded and animates transitions.
 */
export class ExpanderPanelN implements MComponent<ExpanderPanelAttrs> {
	childDiv: HTMLElement

	// There are some cases where the child div will be added to and a redraw won't be triggered, in which case
	// the expander panel wont update until some kind of interaction happens
	observer: MutationObserver

	// We calculate the height manually because we need concrete values for the transition (can't just transition from 0px to 100%)
	lastCalculatedHeight: number

	// We remove the children from the DOM to take them out of the taborder. Setting "tabindex = -1" on the element will not work because
	// it does not apply to any children
	childrenInDom: boolean

	oninit(vnode: Vnode<ExpanderPanelAttrs>) {

		this.childrenInDom = vnode.attrs.expanded()

		this.observer = new MutationObserver(mutations => {
			// redraw if a child has been added that wont be getting displayed
			if (this.childDiv && this.childDiv.offsetHeight !== this.lastCalculatedHeight) {
				m.redraw()
			}
		})
	}

	view(vnode: Vnode<ExpanderPanelAttrs>): Children {
		const expanded = vnode.attrs.expanded

		this.lastCalculatedHeight = this.childDiv?.offsetHeight ?? 0

		// The expander panel children are wrapped in an extra div so that we can calculate the height properly,
		// since offsetHeight doesn't include borders or margins
		return m(".expander-panel.overflow-hidden",
			m("div", {
				style: {
					opacity: expanded() ? "1" : "0",
					height: expanded() ? `${this.lastCalculatedHeight}px` : "0px",
					transition: `opacity ${DefaultAnimationTime}ms ease-out, height ${DefaultAnimationTime}ms ease-out`
				},
				ontransitionstart: transition => {
					// Show the children when the expander begins opening
					if (transition.propertyName === "opacity" && expanded()) {
						this.childrenInDom = true
					}
				},
				ontransitionend: transition => {
					// Hide the children when the expander finishes closing
					if (transition.propertyName === "opacity" && !expanded()) {
						this.childrenInDom = false
					}
				},
			}, m(".expander-child-wrapper", {
				oncreate: vnode => {
					this.childDiv = vnode.dom
					this.observer.observe(this.childDiv, {childList: true, subtree: true})
				},
				onremove: () => {
					this.observer.disconnect()
				},
			}, this.childrenInDom ? vnode.children : null))
		)
	}
}