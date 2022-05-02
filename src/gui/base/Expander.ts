import m, {Children, Component, Vnode} from "mithril"
import type {TranslationKey} from "../../misc/LanguageViewModel"
import {lang} from "../../misc/LanguageViewModel"
import {addFlash, removeFlash} from "./Flash"
import {Icon} from "./Icon"
import {Icons} from "./icons/Icons"
import {BootIcons} from "./icons/BootIcons"
import {theme} from "../theme"
import {px} from "../size"
import {DefaultAnimationTime} from "../animation/Animations"
import type {lazy} from "@tutao/tutanota-utils"
import {assertNotNull} from "@tutao/tutanota-utils"

export type ExpanderAttrs = {
	label: TranslationKey | lazy<string>
	expanded: boolean
	onExpandedChange: (value: boolean) => unknown
	showWarning?: boolean
	color?: string
	style?: Record<string, any>
}
export type ExpanderPanelAttrs = {
	expanded: boolean
}

export class ExpanderButtonN implements Component<ExpanderAttrs> {
	view(vnode: Vnode<ExpanderAttrs>): Children {
		const a = vnode.attrs
		return m(".flex.limit-width", [
			// .limit-width does not work without .flex in IE11
			m(
				"button.expander.bg-transparent.pt-s.hover-ul.limit-width.flex.items-center",
				{
					style: a.style,
					onclick: (event: MouseEvent) => {
						a.onExpandedChange(!a.expanded)
						event.stopPropagation()
					},
					oncreate: vnode => addFlash(vnode.dom),
					onremove: vnode => removeFlash(vnode.dom),
					"aria-expanded": String(a.expanded),
				},
				[
					a.showWarning
						? m(Icon, {
							icon: Icons.Warning,
							style: {
								fill: a.color ? a.color : theme.content_button,
							},
						})
						: null,
					m(
						"small.b.text-ellipsis",
						{
							style: {
								color: a.color || theme.content_button,
							},
						},
						lang.getMaybeLazy(a.label).toUpperCase(),
					),
					m(Icon, {
						icon: BootIcons.Expand,
						class: "flex-center items-center",
						style: {
							fill: a.color ? a.color : theme.content_button,
							"margin-right": px(-4),
							// icon is has 4px whitespace to the right,
							transform: `rotateZ(${a.expanded ? 180 : 0}deg)`,
							transition: `transform ${DefaultAnimationTime}ms`,
						},
					}),
				],
			),
		])
	}
}

/**
 * Panel which shows or hides content depending on the attrs.expanded and animates transitions.
 */
export class ExpanderPanelN implements Component<ExpanderPanelAttrs> {
	childDiv: HTMLElement | null = null
	// There are some cases where the child div will be added to and a redraw won't be triggered, in which case
	// the expander panel wont update until some kind of interaction happens
	observer: MutationObserver | null = null
	// We calculate the height manually because we need concrete values for the transition (can't just transition from 0px to 100%)
	lastCalculatedHeight: number | null = null
	// We remove the children from the DOM to take them out of the taborder. Setting "tabindex = -1" on the element will not work because
	// it does not apply to any children
	childrenInDom: boolean | null = null
	setChildrenInDomTimeout: TimeoutID | null

	oninit(vnode: Vnode<ExpanderPanelAttrs>) {
		this.childrenInDom = vnode.attrs.expanded
		this.observer = new MutationObserver(mutations => {
			// redraw if a child has been added that wont be getting displayed
			if (this.childDiv && this.childDiv.offsetHeight !== this.lastCalculatedHeight) {
				m.redraw()
			}
		})
	}

	onbeforeupdate(vnode: Vnode<ExpanderPanelAttrs>, old: Vnode<ExpanderPanelAttrs>): boolean {
		const oldExpanded = old.attrs.expanded
		const currentExpanded = vnode.attrs.expanded

		if (oldExpanded !== currentExpanded) {
			this._handleExpansionStateChanged(currentExpanded)
		}

		return true
	}

	view(vnode: Vnode<ExpanderPanelAttrs>): Children {
		const expanded = vnode.attrs.expanded
		this.lastCalculatedHeight = this.childDiv?.offsetHeight ?? 0
		// The expander panel children are wrapped in an extra div so that we can calculate the height properly,
		// since offsetHeight doesn't include borders or margins
		return m(
			".expander-panel.overflow-hidden",
			m(
				"div",
				{
					style: {
						opacity: expanded ? "1" : "0",
						height: expanded ? `${this.lastCalculatedHeight}px` : "0px",
						transition: `opacity ${DefaultAnimationTime}ms ease-out, height ${DefaultAnimationTime}ms ease-out`,
					},
				},
				m(
					".expander-child-wrapper",
					{
						oncreate: vnode => {
							this.childDiv = vnode.dom as HTMLElement
							assertNotNull(this.observer).observe(this.childDiv, {
								childList: true,
								subtree: true,
							})
						},
						onremove: () => {
							this.observer?.disconnect()
						},
					},
					this.childrenInDom ? vnode.children : null,
				),
			),
		)
	}

	_handleExpansionStateChanged(expanded: boolean) {
		clearTimeout(this.setChildrenInDomTimeout)

		if (expanded) {
			this.childrenInDom = true
		} else {
			this.setChildrenInDomTimeout = setTimeout(() => (this.childrenInDom = false), DefaultAnimationTime)
		}
	}
}