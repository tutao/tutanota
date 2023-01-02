import m, { Children, Component, Vnode } from "mithril"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import { addFlash, removeFlash } from "./Flash"
import { Icon } from "./Icon"
import { Icons } from "./icons/Icons"
import { BootIcons } from "./icons/BootIcons"
import { theme } from "../theme"
import { px } from "../size"
import { DefaultAnimationTime } from "../animation/Animations"
import type { lazy } from "@tutao/tutanota-utils"
import { assertNotNull } from "@tutao/tutanota-utils"

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

export class ExpanderButton implements Component<ExpanderAttrs> {
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
					oncreate: (vnode) => addFlash(vnode.dom),
					onremove: (vnode) => removeFlash(vnode.dom),
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
export class ExpanderPanel implements Component<ExpanderPanelAttrs> {
	childDiv: HTMLElement | null = null
	// There are some cases where the child div will be added to and a redraw won't be triggered, in which case
	// the expander panel won't update until some kind of interaction happens.
	// Unfortunately no one knows what these cases are anymore besides some direct mutation.
	observer: MutationObserver | null = null
	// We calculate the height manually because we need concrete values for the transition (can't just transition from 0px to 100%)
	lastCalculatedHeight: number | null = null
	// We remove the children from the DOM to take them out of the taborder. Setting "tabindex = -1" on the element will not work because
	// it does not apply to any children
	childrenInDom: boolean | null = null
	setChildrenInDomTimeout: TimeoutID | null

	oninit(vnode: Vnode<ExpanderPanelAttrs>) {
		this.childrenInDom = vnode.attrs.expanded
		this.observer = new MutationObserver((mutations) => {
			// redraw if a child has been added that won't be getting displayed
			if (this.childDiv && this.childDiv.getBoundingClientRect().height !== this.lastCalculatedHeight) {
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
		// getBoundingClientRect() gives us the correct size, with a fraction
		this.lastCalculatedHeight = this.childDiv?.getBoundingClientRect().height ?? 0
		return m(
			".expander-panel",
			// it's conceivable that the content could overflow or influence the
			// panel's size, but we did not observe this. overflow: hidden would
			// solve that in case it becomes a problem, but majorly complicate
			// putting dropdowns and similar elements inside the panel.
			m(
				"div",
				{
					style: {
						opacity: expanded ? "1" : "0",
						height: expanded ? `${this.lastCalculatedHeight}px` : "0px",
						transition: `opacity ${DefaultAnimationTime}ms ease-out, height ${DefaultAnimationTime}ms ease-out`,
					},
				},
				// we use this wrapper to measure the child reliably
				// just a marker class
				m(
					".expander-child-wrapper",
					{
						style: {
							// one way to deal with collapsible margins.
							// CSS is fun in the way that it likes to collapse some vertical margins in some cases.
							// https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Box_Model/Mastering_margin_collapsing
							// One of such cases is when there's no content between the parent and the child and no margins or borders.
							// So assuming that the child we want to display inside has a margin-top set it would actually overflow our child-wrapper on the
							// top. Which means all our sizing is wrong.
							// There are few ways to prevent this, one of them is `display: flow-root`. It should have no side effects except for some
							// `display: float` items but if you are using `float` still you have no one to blame but yourself.
							// we could set `overflow: hidden` here instead but we do measure this element so we probably shouldn't
							display: "flow-root",
						},
						oncreate: (vnode) => {
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

	// This was done for some obscure case on iOS 12 and it wasn't even done correctly (setTimeout() will not magically produce a redraw()) so it is probably
	// a good candidate for removal.
	_handleExpansionStateChanged(expanded: boolean) {
		clearTimeout(this.setChildrenInDomTimeout)

		if (expanded) {
			this.childrenInDom = true
		} else {
			this.setChildrenInDomTimeout = setTimeout(() => (this.childrenInDom = false), DefaultAnimationTime)
		}
	}
}
