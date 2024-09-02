import m, { Children, Component, Vnode } from "mithril"
import type { TranslationKey } from "../../misc/LanguageViewModel"
import { lang } from "../../misc/LanguageViewModel"
import { Icon, IconSize } from "./Icon"
import { Icons } from "./icons/Icons"
import { BootIcons } from "./icons/BootIcons"
import { theme } from "../theme"
import { px } from "../size"
import { DefaultAnimationTime } from "../animation/Animations"
import type { lazy } from "@tutao/tutanota-utils"
import { assertNotNull } from "@tutao/tutanota-utils"
import { isKeyPressed } from "../../misc/KeyManager.js"
import { Keys } from "../../api/common/TutanotaConstants.js"

export type ExpanderAttrs = {
	label: TranslationKey | lazy<string>
	expanded: boolean
	onExpandedChange: (value: boolean) => unknown
	isPropagatingEvents?: boolean
	isBig?: boolean
	isUnformattedLabel?: boolean
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
		const label = lang.getMaybeLazy(a.label)
		return m(
			".limit-width",
			m(
				"button.expander.bg-transparent.pt-s.hover-ul.limit-width.flex.items-center.b.text-ellipsis.flash",
				{
					style: a.style,
					onclick: (event: MouseEvent) => {
						a.onExpandedChange(!a.expanded)
						if (!a.isPropagatingEvents) event.stopPropagation()
					},
					onkeydown: (e: KeyboardEvent) => {
						if (isKeyPressed(e.key, Keys.SPACE, Keys.RETURN)) {
							a.onExpandedChange(!a.expanded)
							if (!a.isPropagatingEvents) e.preventDefault()
						}
					},
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
						`${a.isBig ? "span" : "small"}`,
						{
							style: {
								color: a.color || theme.content_button,
							},
						},
						a.isUnformattedLabel ? label : label.toUpperCase(),
					),
					m(Icon, {
						icon: BootIcons.Expand,
						class: "flex-center items-center",
						size: a.isBig ? IconSize.Medium : IconSize.Normal,
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
		)
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
			this.handleExpansionStateChanged(currentExpanded)
		}

		return true
	}

	view(vnode: Vnode<ExpanderPanelAttrs>): Children {
		const expanded = vnode.attrs.expanded
		// getBoundingClientRect() gives us the correct size, with a fraction
		this.lastCalculatedHeight = this.childDiv?.getBoundingClientRect().height ?? 0
		return m(
			".expander-panel",
			// We want overflow while expanded in some specific cases like dropdowns, but generally we don't want it because we want to clip our children
			// for animation and sizing, so we enable it only when expanded
			m(
				expanded ? "div" : ".overflow-hidden",
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

	private handleExpansionStateChanged(expanded: boolean) {
		clearTimeout(this.setChildrenInDomTimeout)

		if (expanded) {
			this.childrenInDom = true
		} else {
			this.setChildrenInDomTimeout = setTimeout(() => {
				this.childrenInDom = false
				m.redraw()
			}, DefaultAnimationTime)
		}
	}
}
