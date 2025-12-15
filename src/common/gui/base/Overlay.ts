import m, { Children, Component, VnodeDOM } from "mithril"
import { LayerType } from "../../../RootView"
import { lazy, makeSingleUse, newPromise } from "@tutao/tutanota-utils"
import { assertMainOrNodeBoot } from "../../api/common/Env"
import { component_size, px, size } from "../size.js"
import { styles } from "../styles.js"
import { getSafeAreaInsetBottom } from "../HtmlUtils.js"

assertMainOrNodeBoot()
export type PositionRect = {
	top?: string | null
	left?: string | null
	right?: string | null
	width?: string | null
	bottom?: string | null
	height?: string | null
	zIndex?: LayerType
}
type OverlayAttrs = {
	component: Component
	position: lazy<PositionRect>
	createAnimation?: string
	closeAnimation?: string
	shadowClass: string
}
type OverlayParentAttrs = {
	/**
	 * Overlays that have a `zIndex` lower than this value are inerted.
	 * This is useful when there's an open modal with some overlays below it and others above it
	 * (only overlays behind the modal are inerted).
	 */
	inertBelow: number
}

const overlays: Map<number, OverlayAttrs> = new Map()
let key = 0

export function displayOverlay(
	position: lazy<PositionRect>,
	component: Component,
	createAnimation?: string,
	closeAnimation?: string,
	shadowClass: string = "dropdown-shadow",
): () => void {
	// Use the inverse of the show animation as the close animation if it is not given
	if (createAnimation != null && closeAnimation == null) closeAnimation = `${createAnimation} animation-reverse`

	const overlayKey = key++
	const pair = {
		position,
		component,
		createAnimation,
		closeAnimation,
		shadowClass,
	} as OverlayAttrs
	// Add the new overlay into the overlay container
	overlays.set(overlayKey, pair)

	// Make single so fast taps doesn't try to remove
	// the same overlay twice
	return makeSingleUse(() => {
		// Remove the overlay & warn if unsuccessful
		if (overlays.delete(overlayKey)) {
			m.redraw()
		} else {
			console.warn(`Missing overlay with key:${overlayKey}!`)
		}
	}) as () => void
}

export const overlay: Component<OverlayParentAttrs> = {
	view: (vnode): Children => {
		const visible = overlays.size > 0
		const inertBelow = vnode.attrs.inertBelow

		return m(
			// we want the overlays to position relative to the overlay parent
			// the overlay parent also should fill the root
			"#overlay.fill-absolute.noprint",
			{
				inert: !visible,
				style: {
					display: visible ? "" : "none",
					"margin-top": "env(safe-area-inset-top)", // insets for iPhone X
					// keep the bottom nav bar clear & inset for iOS
					"margin-bottom": styles.isUsingBottomNavigation() ? px(component_size.bottom_nav_bar + getSafeAreaInsetBottom()) : "unset",
					// we would need to change this if we wanted something to appear from the side
					"margin-left": "env(safe-area-inset-left)",
					"margin-right": "env(safe-area-inset-right)",
				},
				"aria-hidden": !visible,
			},
			Array.from(overlays.entries()).map((overlay) => {
				const [key, attrs] = overlay
				const position = attrs.position()

				const baseClasses = "abs elevated-bg " + attrs.shadowClass
				const classes = attrs.createAnimation == null ? baseClasses : baseClasses + " " + attrs.createAnimation
				const zIndex = position.zIndex ?? LayerType.Overlay

				return m(
					"",
					{
						key,
						class: classes,
						inert: zIndex < inertBelow,
						style: {
							width: position.width,
							top: position.top,
							bottom: position.bottom,
							right: position.right,
							left: position.left,
							height: position.height,
							zIndex,
						},
						onbeforeremove: (vnode: VnodeDOM) => {
							if (attrs.closeAnimation != null) {
								const dom = vnode.dom as HTMLElement

								// Force the environment to restart the animations via a reflow
								dom.className = baseClasses
								void dom.offsetWidth

								// Play the closing animation
								dom.className = baseClasses + " " + attrs.closeAnimation

								// Wait for the close animation to complete
								return newPromise(function (resolve) {
									dom.addEventListener("animationend", resolve)
								})
							}
						},
					},
					m(attrs.component),
				)
			}),
		)
	},
}
